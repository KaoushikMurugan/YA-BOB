/**
 * @packageDocumentation
 * This file contains functions that make guild-level changes
 *  that don't directly affect AttendingServerV2's internal state
 */

import {
    CategoryChannel,
    ChannelType,
    Guild,
    GuildMember,
    PermissionFlagsBits,
    Snowflake,
    VoiceBasedChannel
} from 'discord.js';
import { SimpleEmbed, EmbedColor } from '../utils/embed-helper.js';
import { client } from '../global-states.js';
import { cyan, yellow, magenta, red } from '../utils/command-line-colors.js';
import { helpChannelConfigurations } from './command-ch-constants.js';
import { isCategoryChannel, isTextChannel } from '../utils/util-functions.js';
import { ExpectedServerErrors } from './expected-server-errors.js';
import { AccessLevelRoleIds } from '../models/access-level-roles.js';

/**
 * The very first check to perform when creating a new AttendingServerV2 instance
 * - Used inside AttendingServerV2.create
 */
async function initializationCheck(guild: Guild): Promise<void> {
    if (guild.members.me === null || !guild.members.me.permissions.has('Administrator')) {
        const owner = await guild.fetchOwner();
        await owner.send(
            SimpleEmbed(
                `Sorry, I need full administrator permission for '${guild.name}'`,
                EmbedColor.Error
            )
        );
        await guild.leave();
        throw Error(red("YABOB doesn't have admin permission."));
    }
    if (guild.members.me.roles.highest.comparePositionTo(guild.roles.highest) < 0) {
        const owner = await guild.fetchOwner();
        await owner.send(
            SimpleEmbed(
                `It seems like I'm joining a server with existing roles. ` +
                    `Please go to ${guild.name}'s Server settings → Roles and change ${client.user.username} ` +
                    `to the highest role.\n`,
                EmbedColor.Error
            )
        );
        throw Error(red("YABOB doesn't have highest role."));
    }
}

/**
 * Updates the help channel messages
 * Removes all messages in the help channel and posts new ones
 * @param guild
 * @param accessLevelRoleIds the access level role ids used to configure visibility
 */
async function updateCommandHelpChannels(
    guild: Guild,
    accessLevelRoleIds: AccessLevelRoleIds
): Promise<void> {
    const allChannels = await guild.channels.fetch();
    const existingHelpCategory = allChannels.find(
        (channel): channel is CategoryChannel =>
            channel !== null &&
            channel.type === ChannelType.GuildCategory &&
            channel.name === 'Bot Commands Help'
    );
    // If no help category is found, initialize
    if (!existingHelpCategory) {
        console.log(cyan(`Found no help channels in ${guild.name}. Creating new ones.`));
        const helpCategory = await guild.channels.create({
            name: 'Bot Commands Help',
            type: ChannelType.GuildCategory
        });
        // Only create the channels, let setHelpChannelVisibility control the permissions
        await Promise.all(
            helpChannelConfigurations.map(helpChannelConfig =>
                helpCategory.children.create({
                    name: helpChannelConfig.channelName
                })
            )
        );
        // console.log(helpCategory.children.cache.map(c => c.permissionOverwrites.cache.map(h => h.deny)));
        await Promise.all([
            sendHelpChannelMessages(helpCategory),
            setHelpChannelVisibility(guild, accessLevelRoleIds)
        ]);
    } else {
        console.log(
            `Found existing help channels in ${yellow(
                guild.name
            )}, updating command help files`
        );
        await Promise.all([
            sendHelpChannelMessages(existingHelpCategory),
            setHelpChannelVisibility(guild, accessLevelRoleIds)
        ]);
    }
    console.log(magenta(`✓ Updated help channels on ${guild.name} ✓`));
}

/**
 * Overwrites the existing command help channel and send new help messages
 * @param helpCategory the category named 'Bot Commands Help'
 */
async function sendHelpChannelMessages(helpCategory: CategoryChannel): Promise<void> {
    const allHelpChannels = helpCategory.children.cache.filter(isTextChannel);
    await Promise.all(
        allHelpChannels.map(async channel => {
            // have to fetch here, otherwise the cache is empty
            const allMessages = await channel.messages.fetch();
            await Promise.all(allMessages.map(msg => msg.delete()));
        })
    );
    // send the messages we want to show in the help channels
    await Promise.all(
        allHelpChannels.map(channel =>
            helpChannelConfigurations
                .find(val => val.channelName === channel.name)
                ?.helpMessages.filter(helpMessage => helpMessage.useInHelpChannel)
                .map(helpMessage => channel.send(helpMessage.message))
        )
    );
    console.log(
        `Successfully updated help messages in ${yellow(helpCategory.name)} in ${yellow(
            helpCategory.guild.name
        )}!`
    );
}

/**
 * Sets the command help channel visibility with the given role ids;
 *  Delete all existing permission overwrites, then create new ones
 * @param guild
 * @param accessLevelRoleIds the newly updated access level role ids
 */
async function setHelpChannelVisibility(
    guild: Guild,
    accessLevelRoleIds: AccessLevelRoleIds
): Promise<void> {
    const helpCategory = guild.channels.cache.find(
        (channel): channel is CategoryChannel =>
            isCategoryChannel(channel) && channel.name === 'Bot Commands Help'
    );
    if (!helpCategory) {
        return;
    }
    const helpChannels = (await helpCategory.fetch()).children.cache.filter(
        isTextChannel
    );
    await Promise.all(
        helpChannels
            .map(helpChannel =>
                helpChannel.permissionOverwrites.cache.map(overwrite =>
                    overwrite.delete()
                )
            )
            .flat()
    );
    // make the channel invisible to @everyone first
    await Promise.all(
        helpChannels.map(channel =>
            channel.permissionOverwrites.create(guild.roles.everyone, {
                ViewChannel: false
            })
        )
    );
    await Promise.all(
        helpChannels.map(channel =>
            helpChannelConfigurations
                .find(channelConfig => channelConfig.channelName === channel.name)
                ?.visibility.map(key => accessLevelRoleIds[key])
                ?.map(roleId =>
                    channel.permissionOverwrites.create(roleId, {
                        ViewChannel: true
                    })
                )
        )
    );
}

/**
 * Creates a new category with `categoryName` and creates `numOfChannels` voice channels
 * with the name `channelName` within the category
 * @param guild
 * @param categoryName the name of the category containing the voice channels
 * @param officeNamePrefix prefix of each voice channel
 * @param numberOfOffices number of offices to create
 * @param permittedRoleIds the Snowflakes of Bot Admin and Staff
 * @example
 * createOfficeCategory('Office Hours', 'Office', 3)  will create a
 * category named 'Office Hours' with 3 voice channels named 'Office 1', 'Office 2' and 'Office 3'
 */
async function createOfficeVoiceChannels(
    guild: Guild,
    categoryName: string,
    officeNamePrefix: string,
    numberOfOffices: number,
    permittedRoleIds: [Snowflake, Snowflake]
): Promise<void> {
    const allChannels = await guild.channels.fetch();
    // Find if a category with the same name exists
    const existingOfficeCategory = allChannels.filter(
        (channel): channel is CategoryChannel =>
            channel !== null &&
            channel.type === ChannelType.GuildCategory &&
            channel.name === categoryName
    );
    if (existingOfficeCategory.size !== 0) {
        throw ExpectedServerErrors.categoryAlreadyExists(categoryName);
    }
    // If no help category is found, initialize
    const officeCategory = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory
    });
    await Promise.all(
        Array(numberOfOffices)
            .fill(undefined)
            .map((_, officeNumber) =>
                officeCategory.children.create({
                    name: `${officeNamePrefix} ${officeNumber + 1}`,
                    type: ChannelType.GuildVoice,
                    // create the permission overwrites along with the channel itself
                    permissionOverwrites: [
                        {
                            deny: PermissionFlagsBits.SendMessages,
                            id: guild.roles.everyone
                        },
                        {
                            deny: PermissionFlagsBits.ViewChannel,
                            id: guild.roles.everyone
                        },
                        ...permittedRoleIds.map(id => ({
                            allow: PermissionFlagsBits.ViewChannel,
                            id: id
                        }))
                    ]
                })
            )
    );
}

/**
 * Sends the VC invite to the student after successful dequeue
 * @param student who will receive the invite
 * @param helperVoiceChannel which vc channel to invite the student to
 */
async function sendInvite(
    student: GuildMember,
    helperVoiceChannel: VoiceBasedChannel
): Promise<void> {
    const [invite] = await Promise.all([
        helperVoiceChannel.createInvite({
            maxAge: 15 * 60,
            maxUses: 1
        }),
        helperVoiceChannel.permissionOverwrites.create(student, {
            ViewChannel: true,
            Connect: true
        })
    ]);
    // remove the overwrite when the link dies
    setTimeout(() => {
        helperVoiceChannel.permissionOverwrites.cache
            .find(overwrite => overwrite.id === student.id)
            ?.delete()
            .catch(() =>
                console.error(`Failed to delete overwrite for ${student.displayName}`)
            );
    }, 15 * 60 * 1000);
    await student
        .send(
            SimpleEmbed(
                `It's your turn! Join the call: ${invite.toString()}`,
                EmbedColor.Success
            )
        )
        .catch(() => {
            // TODO: this assumes the error is always because of student blocking the dm
            throw ExpectedServerErrors.studentBlockedDm(student.id);
        });
}

export {
    initializationCheck,
    updateCommandHelpChannels,
    setHelpChannelVisibility,
    createOfficeVoiceChannels,
    sendInvite
};
