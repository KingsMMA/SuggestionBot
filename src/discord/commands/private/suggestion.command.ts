import type {AutocompleteInteraction, ChatInputCommandInteraction, GuildBasedChannel} from 'discord.js';
import {PermissionsBitField} from 'discord.js';
import {ApplicationCommandOptionType, ApplicationCommandType} from 'discord-api-types/v10';

import type SuggestionsBot from '../../suggestionsBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';

export default class SuggestionCommand extends BaseCommand {
    constructor(client: SuggestionsBot) {
        super(client, {
            name: 'suggestion',
            description: 'Manage the server\'s suggestions.',
            type: ApplicationCommandType.ChatInput,
            default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
            options: [
                {
                    name: 'set-channel',
                    description: 'Set the channel where suggestions will be sent.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'suggestions',
                            description: 'The channel where suggestions will be sent.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                        {
                            name: 'accepted',
                            description: 'The channel where accepted suggestions will be sent.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                        {
                            name: 'denied',
                            description: 'The channel where denied suggestions will be sent.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'accept',
                    description: 'Accept a suggestion.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message-url',
                            description: 'The message URL of the suggestion to accept.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'reason',
                            description: 'The reason for accepting the suggestion.',
                            type: ApplicationCommandOptionType.String,
                            required: false,
                        },
                    ],
                },
                {
                    name: 'deny',
                    description: 'Deny a suggestion.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message-url',
                            description: 'The message URL of the suggestion to deny.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'reason',
                            description: 'The reason for denying the suggestion.',
                            type: ApplicationCommandOptionType.String,
                            required: false,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'Remove a suggestion without accepting/denying it.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message-url',
                            description: 'The message URL of the suggestion to remove.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'list',
                    description: 'List all suggestions.',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        switch (interaction.options.getSubcommand()) {
            case 'set-channel':
                return this.setChannel(interaction);
            case 'accept':
                return this.accept(interaction);
            case 'deny':
                return this.deny(interaction);
            case 'remove':
                return this.remove(interaction);
            case 'list':
                return this.list(interaction);
            default:
                return interaction.replyError('Invalid subcommand.');
        }
    }

    async setChannel(interaction: ChatInputCommandInteraction) {
        const suggestionsChannel = interaction.options.getChannel('suggestions', true) as GuildBasedChannel;
        const acceptedChannel = interaction.options.getChannel('accepted', true) as GuildBasedChannel;
        const deniedChannel = interaction.options.getChannel('denied', true) as GuildBasedChannel;

        if (
            !(suggestionsChannel.isTextBased() && acceptedChannel.isTextBased() && deniedChannel.isTextBased()) ||
            suggestionsChannel.guildId !== interaction.guildId ||
            acceptedChannel.guildId !== interaction.guildId ||
            deniedChannel.guildId !== interaction.guildId ||
            (suggestionsChannel.isVoiceBased() || acceptedChannel.isVoiceBased() || deniedChannel.isVoiceBased()) ||
            (suggestionsChannel.isThread() || acceptedChannel.isThread() || deniedChannel.isThread()))
            return interaction.replyError('Invalid channel type given.');

        await this.client.main.mongo.setGuildChannels(interaction.guildId!, suggestionsChannel.id, acceptedChannel.id, deniedChannel.id);
        await interaction.replySuccess(`The following channels will now be used:\n**Suggestions: **<#${suggestionsChannel.id}>\n**Accepted: **<#${acceptedChannel.id}>\n**Denied: **<#${deniedChannel.id}>`);
    }

    async accept(interaction: ChatInputCommandInteraction) {
        const messageUrl = interaction.options.getString('message-url', true);
        const reason = interaction.options.getString('reason', false);
    }

    async deny(interaction: ChatInputCommandInteraction) {
        const messageUrl = interaction.options.getString('message-url', true);
        const reason = interaction.options.getString('reason', false);
    }

    async remove(interaction: ChatInputCommandInteraction) {
        const messageUrl = interaction.options.getString('message-url', true);
    }

    async list(interaction: ChatInputCommandInteraction) {

    }

}