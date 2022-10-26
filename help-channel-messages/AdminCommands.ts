import { EmbedColor } from '../src/utils/embed-helper';
import { HelpMessage } from '../src/utils/type-aliases';

const adminCommandsTileMessage: HelpMessage = {
    nameValuePair: {
        name: 'Admin Commands Title',
        value: 'admin-commands-title'
    },
    useInHelpChannel: true,
    useInHelpCommand: false,
    message: {
        embeds: [
            {
                color: EmbedColor.Neutral,
                title: 'Bot Admin Only Commands',
                timestamp: new Date().toISOString(),
                author: {
                    name: 'YABOB V4.',
                    icon_url: 'https://i.postimg.cc/dVkg4XFf/BOB-pfp.png'
                }
            }
        ]
    }
};

const queueAddHelp: HelpMessage = {
    nameValuePair: {
        name: 'queue add',
        value: 'queue-add'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/queue add [queue_name]`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Creates a new category with the name entered in `queue_name` and creates the #queue and #chat text channels within it.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: '`queue_name: string`\nThe name of the new queue category. Can contain any characters that are allowed by discord for category names other than comma (,).',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/queue add New Queue`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const queueRemoveHelp: HelpMessage = {
    nameValuePair: {
        name: 'queue remove',
        value: 'queue_remove'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/queue remove`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Deletes an existing category with the name entered in queue_name and the channels within it.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: '`queue_name: Channel`\nThe queue category you want to delete.',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/queue remove Existing Queue`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const cleanupQueueHelp: HelpMessage = {
    nameValuePair: {
        name: 'cleanup_queue',
        value: 'cleanup_queue'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/cleanup_queue (queue_name)`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Debug feature. Cleans up everything in #queue for the specified queue and resends new embeds.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: '`queue_name: Channel`\nThe queue to clean',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/cleanup class A`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const cleanupHelpChannelHelp: HelpMessage = {
    nameValuePair: {
        name: 'clean_up_help_channel',
        value: 'clean_up_help_channel'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/clean_up_help_channel`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Debug feature. Cleans up all the bot help channels and resends new embeds'
                    },
                    {
                        name: 'Options',
                        value: 'None',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/clean_up_help_channel`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const clearAllHelp: HelpMessage = {
    nameValuePair: {
        name: 'clear_all',
        value: 'clear_all'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/clear_all`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Empties all queues in the server.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: 'None',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/clear_all`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const setAfterSessionsMsgHelp: HelpMessage = {
    nameValuePair: {
        name: 'set_after_session_msg',
        value: 'set_after_session_msg'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/set_after_session_msg [message]`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Prompts a modal (aka form) where you can enter a message \
                        that is to be sent to the helpees after a session is over.',
                        inline: false
                    },
                    {
                        name: 'Modal Input Fields',
                        value: '`message: text - paragraph`\nThe message to send to the queue when a session ends.',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/set_after_session_msg`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const setLoggingChannelCommandHelp: HelpMessage = {
    nameValuePair: {
        name: 'set_logging_channel',
        value: 'set_logging_channel'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/set_logging_channel [channel]`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Sets the channel where the bot will log all of its actions.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: '`channel: Channel`\nThe channel where you want YABOB to log to.',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/set_logging_channel #logging`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const stopLoggingCommandHelp: HelpMessage = {
    nameValuePair: {
        name: 'stop_logging',
        value: 'stop_logging'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/stop_logging`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Stops the bot from logging to the channel set by `/set_logging_channel`.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: 'None',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/stop_logging`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const setQueueAutoClearHelp: HelpMessage = {
    nameValuePair: {
        name: 'set_queue_auto_clear',
        value: 'set_queue_auto_clear'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/set_queue_auto_clear`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Sets the time after which the queue will be cleared automatically.',
                        inline: false
                    },
                    {
                        name: 'Modal Input Fields',
                        value: '`hours: number - 2 digit max` \n`minutes: number - 2 digit max`\
                        \nqueue will be cleared after hours:minutes',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/set_queue_auto_clear`',
                        inline: true
                    }
                ]
            }
        ]
    }
};



const seriousModeCommandHelp: HelpMessage = {
    nameValuePair: {
        name: 'serious_mode',
        value: 'serious_mode'
    },
    useInHelpChannel: true,
    useInHelpCommand: true,
    message: {
        embeds: [
            {
                color: EmbedColor.NoColor,
                title: 'Command: `/serious_mode`',
                fields: [
                    {
                        name: 'Description',
                        value: 'Toggles serious mode. When serious mode is on, the bot will not use \
                        emotes or emoticons in messages and embeds.',
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: 'None',
                        inline: true
                    },
                    {
                        name: 'Example Usage',
                        value: '`/serious_mode`',
                        inline: true
                    }
                ]
            }
        ]
    }
};

const adminCommandHelpMessages: HelpMessage[] = [
    adminCommandsTileMessage,
    queueAddHelp,
    queueRemoveHelp,
    cleanupQueueHelp,
    cleanupHelpChannelHelp,
    clearAllHelp,
    setAfterSessionsMsgHelp,
    setLoggingChannelCommandHelp,
    stopLoggingCommandHelp,
    setQueueAutoClearHelp,
    seriousModeCommandHelp
];

export { adminCommandHelpMessages };
