/** @module SessionCalendar */
import { BaseInteractionExtension, IInteractionExtension } from '../extension-interface';
import { serverIdCalendarStateMap, CalendarExtensionState } from './calendar-states';
import {
    ButtonInteraction,
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    ModalSubmitInteraction,
    Role,
    TextBasedChannel
} from 'discord.js';
import {
    ButtonLogEmbed,
    EmbedColor,
    ErrorEmbed,
    SimpleEmbed,
    SimpleLogEmbed,
    SlashCommandLogEmbed
} from '../../utils/embed-helper';
import { ExtensionSetupError } from '../../utils/error-types';
import { CommandData } from '../../command-handling/slash-commands';
import {
    isServerInteraction,
    hasValidQueueArgument,
    isTriggeredByUserWithRoles,
    isTriggeredByUserWithRolesSync
} from '../../command-handling/common-validations';
import {
    checkCalendarConnection,
    composeUpcomingSessionsEmbedBody,
    getUpComingTutoringEvents,
    restorePublicEmbedURL
} from './shared-calendar-functions';
import { blue, red, yellow } from '../../utils/command-line-colors';
import { calendarCommands } from './calendar-slash-commands';
import {
    getQueueRoles,
    logButtonPress,
    logSlashCommand
} from '../../utils/util-functions';
import { appendCalendarHelpMessages } from './CalendarCommands';
import {
    ButtonCallback,
    CommandCallback,
    ModalSubmitCallback
} from '../../utils/type-aliases';
import { ExpectedCalendarErrors } from './expected-calendar-errors';
import { ExpectedParseErrors } from '../../command-handling/expected-interaction-errors';
import { environment } from '../../environment/environment-manager';
import { CalendarSuccessMessages } from './calendar-success-messages';
import { AttendingServerV2 } from '../../attending-server/base-attending-server';

class CalendarInteractionExtension
    extends BaseInteractionExtension
    implements IInteractionExtension
{
    protected constructor(private readonly guild: Guild) {
        super();
    }

    private static helpEmbedsSent = false;

    static async load(guild: Guild): Promise<CalendarInteractionExtension> {
        if (
            environment.sessionCalendar.YABOB_DEFAULT_CALENDAR_ID.length === 0 ||
            environment.sessionCalendar.YABOB_GOOGLE_API_KEY.length === 0
        ) {
            throw new ExtensionSetupError('Make sure you have Calendar ID and API key');
        }
        const calendarName = await checkCalendarConnection(
            environment.sessionCalendar.YABOB_DEFAULT_CALENDAR_ID
        ).catch(() => {
            throw ExpectedCalendarErrors.badId.defaultId;
        });
        serverIdCalendarStateMap.set(
            guild.id,
            await CalendarExtensionState.create(guild.id, guild.name)
        );
        const instance = new CalendarInteractionExtension(guild);
        appendCalendarHelpMessages(CalendarInteractionExtension.helpEmbedsSent);
        CalendarInteractionExtension.helpEmbedsSent = true;
        console.log(
            `[${blue('Session Calendar')}] ` +
                `successfully loaded for '${guild.name}'!\n` +
                ` - Using ${yellow(calendarName)} as the default calendar`
        );
        return instance;
    }

    // Undefined return values is when the method wants to reply to the interaction directly
    // - If a call returns undefined, processCommand won't edit the reply
    private commandMethodMap: { [commandName: string]: CommandCallback } = {
        set_calendar: this.updateCalendarId,
        unset_calendar: this.unsetCalendarId,
        when_next: this.listUpComingHours,
        make_calendar_string: interaction =>
            this.makeParsableCalendarTitle(interaction, false),
        make_calendar_string_all: interaction =>
            this.makeParsableCalendarTitle(interaction, true),
        set_public_embd_url: this.setPublicEmbedUrl
    } as const;

    private buttonMethodMap: { [buttonName: string]: ButtonCallback } = {
        refresh: this.requestCalendarRefresh
    } as const;

    private modalMethodMap: { [modalName: string]: ModalSubmitCallback } = {} as const;

    override get slashCommandData(): CommandData {
        return calendarCommands;
    }

    override canHandleButton(interaction: ButtonInteraction): boolean {
        const [buttonName] = this.splitButtonQueueName(interaction);
        return buttonName in this.buttonMethodMap;
    }

    override canHandleCommand(interaction: ChatInputCommandInteraction): boolean {
        return interaction.commandName in this.commandMethodMap;
    }

    override canHandleModalSubmit(interaction: ModalSubmitInteraction): boolean {
        return interaction.customId in this.modalMethodMap;
    }

    override async processCommand(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        //Send logs before* processing the command
        const server = this.isServerInteraction(interaction);
        await Promise.all<unknown>([
            interaction.reply({
                ...SimpleEmbed(
                    `Processing command \`${interaction.commandName}\` ...`,
                    EmbedColor.Neutral
                ),
                ephemeral: true
            }),
            server.sendLogMessage(SlashCommandLogEmbed(interaction))
        ]);
        const commandMethod = this.commandMethodMap[interaction.commandName];
        logSlashCommand(interaction);
        await commandMethod?.(interaction)
            .then(async successMsg => {
                if (successMsg) {
                    await interaction.editReply(
                        SimpleEmbed(successMsg, EmbedColor.Success)
                    );
                }
            })
            .catch(async err =>
                interaction.replied
                    ? await interaction.editReply(ErrorEmbed(err))
                    : await interaction.reply({ ...ErrorEmbed(err), ephemeral: true })
            );
    }

    override async processButton(interaction: ButtonInteraction): Promise<void> {
        const [buttonName, queueName] = this.splitButtonQueueName(interaction);
        const buttonMethod = this.buttonMethodMap[buttonName];
        await interaction.reply({
            ...SimpleEmbed(
                `Processing button \`${buttonName}\` in \`${queueName}\` ...`,
                EmbedColor.Neutral
            ),
            ephemeral: true
        });
        logButtonPress(interaction, buttonName, queueName);
        await buttonMethod?.(queueName, interaction)
            .then(async successMsg => {
                if (successMsg) {
                    await interaction.editReply(
                        SimpleEmbed(successMsg, EmbedColor.Success)
                    );
                }
            })
            .catch(async err =>
                interaction.replied
                    ? await interaction.editReply(ErrorEmbed(err))
                    : await interaction.reply({ ...ErrorEmbed(err), ephemeral: true })
            );
    }

    private splitButtonQueueName(interaction: ButtonInteraction): [string, string] {
        const delimiterPosition = interaction.customId.indexOf(' ');
        const buttonName = interaction.customId.substring(0, delimiterPosition);
        const queueName = interaction.customId.substring(delimiterPosition + 1);
        return [buttonName, queueName];
    }

    private isServerInteraction(
        interaction:
            | ChatInputCommandInteraction
            | ButtonInteraction
            | ModalSubmitInteraction
    ): AttendingServerV2 {
        const server = isServerInteraction(interaction);
        if (!serverIdCalendarStateMap.has(server.guild.id)) {
            throw ExpectedCalendarErrors.nonServerInteraction(interaction.guild?.name);
        }
        return server;
    }

    /**
     * Updates the calendar id in the shared calendar extension states
     * - Triggers the queue level extensions to update
     */
    private async updateCalendarId(
        interaction: ChatInputCommandInteraction
    ): Promise<string> {
        const newCalendarId = interaction.options.getString('calendar_id', true);
        const [newCalendarName, server] = await Promise.all([
            checkCalendarConnection(newCalendarId).catch(() => {
                throw ExpectedCalendarErrors.badId.newId;
            }),
            isServerInteraction(interaction),
            isTriggeredByUserWithRoles(interaction, 'set_calendar', ['Bot Admin'])
        ]);
        await serverIdCalendarStateMap.get(this.guild.id)?.setCalendarId(newCalendarId);
        await server.sendLogMessage(
            SimpleLogEmbed(CalendarSuccessMessages.backedupToFirebase)
        );
        return CalendarSuccessMessages.updatedCalendarId(newCalendarName);
    }

    /**
     * Resets the calendar id to default
     */
    private async unsetCalendarId(
        interaction: ChatInputCommandInteraction
    ): Promise<string> {
        const server = this.isServerInteraction(interaction);
        await isTriggeredByUserWithRoles(interaction, 'unset_calendar', ['Bot Admin']);
        await Promise.all([
            serverIdCalendarStateMap
                .get(this.guild.id)
                ?.setCalendarId(environment.sessionCalendar.YABOB_DEFAULT_CALENDAR_ID),
            server.sendLogMessage(
                SimpleLogEmbed(CalendarSuccessMessages.backedupToFirebase)
            )
        ]);
        return CalendarSuccessMessages.unsetCalendar;
    }

    /**
     * Builds the embed for /when_next
     */
    private async listUpComingHours(
        interaction: ChatInputCommandInteraction
    ): Promise<undefined> {
        const channel = hasValidQueueArgument(interaction);
        const viewModels = await getUpComingTutoringEvents(
            this.guild.id,
            channel.queueName
        );
        const embed = SimpleEmbed(
            `Upcoming Hours for ${channel.queueName}`,
            EmbedColor.NoColor,
            composeUpcomingSessionsEmbedBody(viewModels, channel)
        );
        await interaction.editReply(embed);
        return undefined;
    }

    /**
     * Makes calendar titles for all approved queues
     * @param generateAll whether to generate string for all the queue roles
     */
    private async makeParsableCalendarTitle(
        interaction: ChatInputCommandInteraction,
        generateAll: boolean
    ): Promise<string> {
        const [server, member] = [
            this.isServerInteraction(interaction),
            isTriggeredByUserWithRolesSync(interaction, 'make_calendar_string', [
                'Bot Admin',
                'Staff'
            ])
        ];
        const calendarDisplayName = interaction.options.getString('calendar_name', true);
        const user = interaction.options.getUser('user', false);
        let validQueues: (CategoryChannel | Role)[] = [];
        let memberToUpdate = member;

        if (user !== null) {
            const memberRoles = memberToUpdate.roles;
            // if they are not admin or doesn't have the queue role, reject
            if (
                !memberRoles.cache.some(role => role.name === 'Bot Admin') &&
                user.id !== interaction.user.id
            ) {
                throw ExpectedCalendarErrors.nonAdminMakingCalendarStrForOthers;
            } else {
                // already checked in isServerInteraction
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                memberToUpdate = await interaction.guild!.members.fetch(user);
            }
        }
        if (generateAll) {
            validQueues = await getQueueRoles(server, memberToUpdate);
        } else {
            const commandArgs = [
                ...this.guild.channels.cache.filter(
                    channel => channel.type === ChannelType.GuildCategory
                )
            ]
                .map((_, idx) =>
                    interaction.options.getChannel(`queue_name_${idx + 1}`, idx === 0)
                )
                .filter(queueArg => queueArg !== undefined && queueArg !== null);
            validQueues = commandArgs.map(category => {
                if (category?.type !== ChannelType.GuildCategory || category === null) {
                    throw ExpectedParseErrors.invalidQueueCategory(category?.name);
                }
                const queueTextChannel = (
                    category as CategoryChannel
                ).children.cache.find(
                    child =>
                        child.name === 'queue' && child.type === ChannelType.GuildText
                );
                if (queueTextChannel === undefined) {
                    throw ExpectedParseErrors.noQueueTextChannel(category.name);
                }
                return category as CategoryChannel;
            });
        }
        void serverIdCalendarStateMap
            .get(this.guild.id)
            ?.updateNameDiscordIdMap(calendarDisplayName, memberToUpdate.user.id)
            .catch(() =>
                console.error(
                    `Calendar refresh timed out from ${red(
                        'updateNameDiscordIdMap'
                    )} triggered by ${memberToUpdate.displayName}`
                )
            );
        await server.sendLogMessage(
            SimpleLogEmbed(CalendarSuccessMessages.backedupToFirebase)
        );
        return CalendarSuccessMessages.completedCalendarString(
            calendarDisplayName,
            validQueues.map(queue => queue.name)
        );
    }

    private async setPublicEmbedUrl(
        interaction: ChatInputCommandInteraction
    ): Promise<string> {
        const rawUrl = interaction.options.getString('url', true);
        const enable = interaction.options.getBoolean('enable', true);
        await isTriggeredByUserWithRoles(interaction, 'set_calendar', ['Bot Admin']);
        if (enable) {
            try {
                new URL(rawUrl); // call this constructor to check if URL is valid
            } catch {
                throw ExpectedCalendarErrors.badPublicEmbedUrl;
            }
            // now rawUrl is valid
            await serverIdCalendarStateMap.get(this.guild.id)?.setPublicEmbedUrl(rawUrl);
            return CalendarSuccessMessages.publicEmbedUrl.updated;
        } else {
            const state = serverIdCalendarStateMap.get(this.guild.id);
            await state?.setPublicEmbedUrl(restorePublicEmbedURL(state?.calendarId));
            return CalendarSuccessMessages.publicEmbedUrl.backToDefault;
        }
    }

    private async requestCalendarRefresh(
        queueName: string,
        interaction: ButtonInteraction
    ): Promise<string> {
        const server = this.isServerInteraction(interaction);
        const queueLevelExtension = serverIdCalendarStateMap
            .get(this.guild.id)
            ?.listeners.get(queueName);
        await server.sendLogMessage(
            ButtonLogEmbed(
                interaction.user,
                `Refresh Upcoming Sessions`,
                interaction.channel as TextBasedChannel
            )
        );
        await queueLevelExtension?.onCalendarExtensionStateChange();
        return CalendarSuccessMessages.refreshSuccess(queueName);
    }
}

export { CalendarInteractionExtension };
