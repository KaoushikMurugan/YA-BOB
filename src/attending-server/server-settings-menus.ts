import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SelectMenuBuilder,
    SelectMenuComponentOptionData
} from 'discord.js';
import { SimpleEmbed, EmbedColor } from '../utils/embed-helper.js';
import {
    SettingsMenuCallback,
    SpecialRoleValues,
    YabobEmbed
} from '../utils/type-aliases.js';
import { buttonFactory, selectMenuFactory } from '../utils/component-id-factory.js';
import { AttendingServerV2 } from './base-attending-server.js';
import { isTextChannel } from '../utils/util-functions.js';

const mainMenuRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttonFactory
        .buildComponent('other', 'return_to_main_menu', undefined, undefined)
        .setEmoji('🏠')
        .setLabel('Return to Main Menu')
        .setStyle(ButtonStyle.Primary)
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EmptyEmbedField = {
    name: '\u200b',
    value: '\u200b'
} as const;

/** Use this string to force a trailing new line in an embed field */
const trailingNewLine = '\n\u200b' as const;

/**
 * Options for the main menu of server settings
 */
const serverSettingsMainMenuOptions: {
    optionObj: SelectMenuComponentOptionData;
    subMenu: SettingsMenuCallback;
}[] = [
    {
        optionObj: {
            emoji: '📝',
            label: 'Server Roles',
            description: 'Configure the server roles',
            value: 'server-roles'
        },
        subMenu: serverRolesConfigMenu
    },
    {
        optionObj: {
            emoji: '📨',
            label: 'After Session Message',
            description: 'Configure the message sent after a session',
            value: 'after-session-message'
        },
        subMenu: afterSessionMessageConfigMenu
    },
    {
        optionObj: {
            emoji: '⏳',
            label: 'Queue Auto Clear',
            description: 'Configure the auto-clearing of queues',
            value: 'queue-auto-clear'
        },
        subMenu: queueAutoClearConfigMenu
    },
    {
        optionObj: {
            emoji: '🪵',
            label: 'Logging Channel',
            description: 'Configure the logging channel',
            value: 'logging-channel'
        },
        subMenu: loggingChannelConfigMenu
    },
    {
        optionObj: {
            emoji: '🎓',
            label: 'Auto Give Student Role',
            description: 'Configure the auto-giving of the student role',
            value: 'auto-give-student-role'
        },
        subMenu: autoGiveStudentRoleConfigMenu
    }
];

/**
 * Composes the server settings main menu
 * @param server
 * @param channelId
 * @param isDm
 * @returns
 */
function serverSettingsMainMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean
): YabobEmbed {
    const embed = SimpleEmbed(
        `🛠 Server Settings for ${server.guild.name} 🛠`,
        EmbedColor.Aqua,
        `**This is the main menu for server settings.**\n\n` +
            `Select an option from the drop-down menu below.`
    );
    const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        selectMenuFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'server_settings',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setPlaceholder('Select an option')
            .addOptions(serverSettingsMainMenuOptions.map(option => option.optionObj))
    );
    return { embeds: embed.embeds, components: [selectMenu] };
}

/**
 * Composes the server roles configuration menu
 * @param server
 * @param channelId
 * @param isDm
 * @param forServerInit
 * @returns
 */
function serverRolesConfigMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean,
    forServerInit = false
): YabobEmbed {
    const embed = SimpleEmbed(
        `📝 Server Roles Configuration for ${server.guild.name} 📝`,
        EmbedColor.Aqua,
        (forServerInit
            ? `**Thanks for choosing YABOB for helping you with office hours!\n To start using YABOB, it requires the following roles: **\n`
            : '') +
            `**\n🤖 Bot Admin Role:** ${
                forServerInit
                    ? ` *Role that can manage the bot and it's settings*\n`
                    : server.botAdminRoleID === SpecialRoleValues.NotSet
                    ? 'Not Set'
                    : server.botAdminRoleID === SpecialRoleValues.Deleted
                    ? '@deleted-role'
                    : `<@&${server.botAdminRoleID}>`
            }\n\n` +
            `**📚 Helper Role:** ${
                forServerInit
                    ? ` *Role that allows users to host office hours*\n`
                    : server.helperRoleID === SpecialRoleValues.NotSet
                    ? 'Not Set'
                    : server.helperRoleID === SpecialRoleValues.Deleted
                    ? '@deleted-role'
                    : `<@&${server.helperRoleID}>`
            }\n\n` +
            `**🎓 Student Role:** ${
                forServerInit
                    ? ` *Role that allows users to join office hour queues*\n`
                    : server.studentRoleID === SpecialRoleValues.NotSet
                    ? 'Not Set'
                    : server.studentRoleID === SpecialRoleValues.Deleted
                    ? '@deleted-role'
                    : `<@&${server.studentRoleID}>`
            }\n\n` +
            `***Select an option from below to change the configuration:***\n\n` +
            `**1** - Use existing roles named the same as the missing roles. If not found create new roles\n` +
            `**⤷ A** - Use the @everyone role for the Student role if missing\n` +
            `**2** - Create brand new roles for the missing roles\n` +
            `**⤷ A** - Use the @everyone role for the Student role if missing\n` +
            `If you want to set the roles manually, use the \`/set_roles\` command.`
    );
    const buttons = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            buttonFactory
                .buildComponent(
                    isDm ? 'dm' : 'other',
                    `server_role_config_1`,
                    isDm ? server.guild.id : undefined,
                    isDm ? channelId : undefined
                )
                .setLabel('Use Existing Roles')
                .setStyle(ButtonStyle.Secondary),
            buttonFactory
                .buildComponent(
                    isDm ? 'dm' : 'other',
                    `server_role_config_1a`,
                    isDm ? server.guild.id : undefined,
                    isDm ? channelId : undefined
                )
                .setLabel('Use Existing Roles (@everyone is student)')
                .setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            buttonFactory
                .buildComponent(
                    isDm ? 'dm' : 'other',
                    `server_role_config_2`,
                    isDm ? server.guild.id : undefined,
                    isDm ? channelId : undefined
                )
                .setLabel('Create New Roles')
                .setStyle(ButtonStyle.Secondary),
            buttonFactory
                .buildComponent(
                    isDm ? 'dm' : 'other',
                    `server_role_config_2a`,
                    isDm ? server.guild.id : undefined,
                    isDm ? channelId : undefined
                )
                .setLabel('Create New Roles (@everyone is student)')
                .setStyle(ButtonStyle.Secondary)
        )
    ];
    return {
        embeds: embed.embeds,
        components: isDm ? buttons : [...buttons, mainMenuRow]
    };
}

/**
 * Composes the after session message configuration menu
 * @param server
 * @param channelId
 * @param isDm
 * @returns
 */
function afterSessionMessageConfigMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean
): YabobEmbed {
    const embed = new EmbedBuilder()
        .setTitle(`📨 After Session Message Configuration for ${server.guild.name} 📨`)
        .addFields({
            name: 'Description',
            value: `The after session message is sent to students after they finish their session with a helper (i.e. upon leaving the voice channel)${trailingNewLine}`
        })
        .addFields({
            name: 'The Current After Session Message',
            value: `${
                server.afterSessionMessage === ''
                    ? '`Not Set`'
                    : `${server.afterSessionMessage
                          .trim()
                          .split('\n')
                          .map(line => `> ${line}`)
                          .join('\n')}` // show the existing message in a quote block
            }${trailingNewLine}`
        })
        // addFields accepts RestOrArray<T>, so they can be combined but prettier makes it ugly
        .addFields({
            name: 'Select an option from below to change the configuration',
            value: `⚙️ - Set the after session message
            🔒 - Disable the after session message. The bot will no longer send the message to students after they finish their session\n`
        });
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'after_session_message_config_1',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('⚙️')
            .setLabel('Edit Message')
            .setStyle(ButtonStyle.Secondary),
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'after_session_message_config_2',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('🔒')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Secondary)
    );
    return { embeds: [embed.data], components: [buttons, mainMenuRow] };
}

/**
 * Composes the queue auto clear configuration menu
 * @param server
 * @param channelId
 * @param isDm
 * @returns
 */
function queueAutoClearConfigMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean
): YabobEmbed {
    const embed = new EmbedBuilder()
        .setTitle(`⏳ Queue Auto Clear Configuration for ${server.guild.name} ⏳`)
        .setColor(EmbedColor.Aqua)
        .addFields({
            name: 'Description',
            value: `If enabled, YABOB will automatically clear all the closed queues after the set amount of time.${trailingNewLine}`
        })
        .addFields({
            name: 'Current Auto Clear Timeout',
            value:
                server.queueAutoClearTimeout === undefined ||
                server.queueAutoClearTimeout === 'AUTO_CLEAR_DISABLED'
                    ? `The queue auto clear feature is currently disabled. The queue will not be cleared automatically.${trailingNewLine}`
                    : `Queues will automatically be cleared after __${`${server.queueAutoClearTimeout.hours}h ${server.queueAutoClearTimeout.minutes}min`}__ since the last time they were closed.${trailingNewLine}`
        })
        .addFields({
            name: 'Select an option from below to change the configuration',
            value: `⚙️ - Set the queue auto clear time
            🔒 - Disable the queue auto clear feature.`
        });
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                `queue_auto_clear_config_1`,
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('⚙️')
            .setLabel('Set Auto Clear Time')
            .setStyle(ButtonStyle.Secondary),
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                `queue_auto_clear_config_2`,
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('🔒')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Secondary)
    );
    return { embeds: [embed.data], components: [buttons, mainMenuRow] };
}

/**
 * Composes the logging channel configuration menu
 * @param server
 * @param channelId
 * @param isDm
 * @returns
 */
function loggingChannelConfigMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean
): YabobEmbed {
    // TODO: Implement a direct way to change the logging channel
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'logging_channel_config_2',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('🔒')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Secondary)
    );
    const embed = new EmbedBuilder()
        .setTitle(`🪵 Logging Configuration for ${server.guild.name} 🪵`)
        .setColor(EmbedColor.Aqua)
        .addFields({
            name: 'Description',
            value: `If enabled, YABOB will send log embeds to the given text channel after receiving interactions and encountering errors.${trailingNewLine}`
        })
        .addFields({
            name: 'Current Logging Channel',
            value:
                server.loggingChannel === undefined
                    ? `Not Set${trailingNewLine}`
                    : `${server.loggingChannel.toString()}${trailingNewLine}`
        })
        .addFields({
            name: 'Select an option from below to change the configuration',
            value: `The \`/set_logging_channel\` command - Enter the channel you want YABOB to log to.
             🔒 - Disable the logging feature\n`
        });
    const allTextChannels = server.guild.channels.cache
        .filter(
            channel =>
                isTextChannel(channel) &&
                channel.name !== 'queue' &&
                channel.name !== 'chat' 
        )
        .first(25); // Cannot have more than 25 options
    const channelsSelectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder().setCustomId('PlaceHolder').addOptions(
            ...allTextChannels.map(channel => ({
                label: channel.name,
                description: channel.name,
                value: channel.id
            }))
        )
    );
    return {
        embeds: [embed.data],
        components: [channelsSelectMenu, buttons, mainMenuRow]
    };
}

function autoGiveStudentRoleConfigMenu(
    server: AttendingServerV2,
    channelId: string,
    isDm: boolean
): YabobEmbed {
    const embed = SimpleEmbed(
        `🎓 Auto Give Student Role Configuration for ${server.guild.name} 🎓`,
        EmbedColor.Aqua,
        `\n${
            server.autoGiveStudentRole
                ? 'The auto give student role feature is currently **__enabled__**'
                : 'The auto give student role feature is currently **__disabled__**'
        }\n\n` +
            `***Select an option from below to change the configuration:***\n\n` +
            `**🔓** - Enable the auto give student role feature\n` +
            `**🔒** - Disable the auto give student role feature\n`
    );
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'auto_give_student_role_config_1',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('🔓')
            .setLabel('Enable')
            .setStyle(ButtonStyle.Secondary),
        buttonFactory
            .buildComponent(
                isDm ? 'dm' : 'other',
                'auto_give_student_role_config_2',
                isDm ? server.guild.id : undefined,
                isDm ? channelId : undefined
            )
            .setEmoji('🔒')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: embed.embeds, components: [buttons, mainMenuRow] };
}

export {
    serverSettingsMainMenu,
    serverSettingsMainMenuOptions,
    serverRolesConfigMenu,
    afterSessionMessageConfigMenu,
    queueAutoClearConfigMenu,
    loggingChannelConfigMenu,
    autoGiveStudentRoleConfigMenu,
    mainMenuRow
};
