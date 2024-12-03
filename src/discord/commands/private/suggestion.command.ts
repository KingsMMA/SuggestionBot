import type {
    ChatInputCommandInteraction,
    GuildBasedChannel,
    GuildTextBasedChannel
} from 'discord.js';
import {
    ActionRowBuilder, ButtonBuilder
} from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle } from 'discord-api-types/v10';

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

        const suggestions = await this.client.main.mongo.fetchSuggestions(interaction.guildId!);
        if (!suggestions) return interaction.replyError('No suggestions have been posted in this server.');

        const suggestion = suggestions[messageUrl.replace(/\./g, '[D]')];
        if (!suggestion) return interaction.replyError('This suggestion does not exist.');

        const channels = await this.client.main.mongo.fetchGuildChannels(interaction.guildId!);
        if (!channels) return interaction.replyError('No suggestion channel has been set.');

        const sentInId = messageUrl.split('/').slice(-2)[0];
        const messageId = messageUrl.split('/').slice(-1)[0];

        const channelSentIn = await interaction.guild!.channels.fetch(sentInId)
            .catch(() => undefined);
        if (!channelSentIn) return interaction.replyError('Unable to fetch the channel this suggestion was sent in.');

        const suggestionMessage = await (channelSentIn as GuildTextBasedChannel).messages.fetch(messageId)
            .catch(() => undefined);
        if (!suggestionMessage) return interaction.replyError('Unable to fetch the suggestion message.');

        await suggestionMessage.delete();

        const acceptedChannel = await interaction.guild!.channels.fetch(channels.accepted)
            .catch(() => undefined);
        if (!acceptedChannel) return interaction.replyError('Unable to fetch the accepted suggestions channel.');

        await (acceptedChannel as GuildTextBasedChannel).send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setAuthor({
                        name: `Suggestion | ${suggestion.author.tag}`,
                        iconURL: suggestion.author.avatarURL || undefined,
                    })
                    .setDescription(suggestion.content)
                    .setColor('Green')
                    .addField('Reason', reason || 'No reason provided.'),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('suggestion:upvote')
                            .setStyle(ButtonStyle.Success)
                            .setLabel(suggestion.upvotes.length.toString())
                            .setEmoji('👍')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('suggestion:count')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel((suggestion.upvotes.length - suggestion.downvotes.length).toString())
                            .setEmoji('#️⃣')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('suggestion:downvote')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel(suggestion.downvotes.length.toString())
                            .setEmoji('👎')
                            .setDisabled(true),
                    )
            ],
        });

        await this.client.main.mongo.removeSuggestion(interaction.guildId!, messageUrl);

        await interaction.replySuccess('The suggestion has been accepted.');
    }

    async deny(interaction: ChatInputCommandInteraction) {
        const messageUrl = interaction.options.getString('message-url', true);
        const reason = interaction.options.getString('reason', false);

        const suggestions = await this.client.main.mongo.fetchSuggestions(interaction.guildId!);
        if (!suggestions) return interaction.replyError('No suggestions have been posted in this server.');

        const suggestion = suggestions[messageUrl.replace(/\./g, '[D]')];
        if (!suggestion) return interaction.replyError('This suggestion does not exist.');

        const channels = await this.client.main.mongo.fetchGuildChannels(interaction.guildId!);
        if (!channels) return interaction.replyError('No suggestion channel has been set.');

        const sentInId = messageUrl.split('/').slice(-2)[0];
        const messageId = messageUrl.split('/').slice(-1)[0];

        const channelSentIn = await interaction.guild!.channels.fetch(sentInId)
            .catch(() => undefined);
        if (!channelSentIn) return interaction.replyError('Unable to fetch the channel this suggestion was sent in.');

        const suggestionMessage = await (channelSentIn as GuildTextBasedChannel).messages.fetch(messageId)
            .catch(() => undefined);
        if (!suggestionMessage) return interaction.replyError('Unable to fetch the suggestion message.');

        await suggestionMessage.delete();

        const deniedChannel = await interaction.guild!.channels.fetch(channels.denied)
            .catch(() => undefined);
        if (!deniedChannel) return interaction.replyError('Unable to fetch the accepted suggestions channel.');

        await (deniedChannel as GuildTextBasedChannel).send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setAuthor({
                        name: `Suggestion | ${suggestion.author.tag}`,
                        iconURL: suggestion.author.avatarURL || undefined,
                    })
                    .setDescription(suggestion.content)
                    .setColor('Red')
                    .addField('Reason', reason || 'No reason provided.'),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('suggestion:upvote')
                            .setStyle(ButtonStyle.Success)
                            .setLabel(suggestion.upvotes.length.toString())
                            .setEmoji('👍')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('suggestion:count')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel((suggestion.upvotes.length - suggestion.downvotes.length).toString())
                            .setEmoji('#️⃣')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('suggestion:downvote')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel(suggestion.downvotes.length.toString())
                            .setEmoji('👎')
                            .setDisabled(true),
                    )
            ],
        });

        await this.client.main.mongo.removeSuggestion(interaction.guildId!, messageUrl);

        await interaction.replySuccess('The suggestion has been denied.');
    }

    async remove(interaction: ChatInputCommandInteraction) {
        const messageUrl = interaction.options.getString('message-url', true);

        const suggestions = await this.client.main.mongo.fetchSuggestions(interaction.guildId!);
        if (!suggestions) return interaction.replyError('No suggestions have been posted in this server.');

        const suggestion = suggestions[messageUrl.replace(/\./g, '[D]')];
        if (!suggestion) return interaction.replyError('This suggestion does not exist.  If there is a message for it, you may safely delete it.');

        await this.client.main.mongo.removeSuggestion(interaction.guildId!, messageUrl);

        const sentInId = messageUrl.split('/').slice(-2)[0];
        const messageId = messageUrl.split('/').slice(-1)[0];

        const channelSentIn = await interaction.guild!.channels.fetch(sentInId)
            .catch(() => undefined);
        if (!channelSentIn) return interaction.replyError('Unable to fetch the channel this suggestion was sent in.');

        const suggestionMessage = await (channelSentIn as GuildTextBasedChannel).messages.fetch(messageId)
            .catch(() => undefined);
        if (!suggestionMessage) return interaction.replyError('Unable to fetch the suggestion message.');

        await suggestionMessage.delete();

        await interaction.replySuccess('The suggestion has been removed.');
    }

    async list(interaction: ChatInputCommandInteraction) {
        const suggestions = await this.client.main.mongo.fetchSuggestions(interaction.guildId!);
        if (!suggestions) return interaction.replyError('No suggestions have been posted in this server.');

        const suggestionList = Object.entries(suggestions)
            .sort(([key, value], [key2, value2]) => (value2.upvotes.length - value2.downvotes.length) - (value.upvotes.length - value.downvotes.length))
            .map(([key, value]) => {
            return `**${key.replace(/\[D]/g, '.')}**\n**Author:** ${value.author.tag}\n**Content:** ${value.content}\n**Net Vote:** ${value.upvotes.length - value.downvotes.length}`;
        });

        await interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('Suggestions')
                    .setDescription(suggestionList.join('\n\n')),
            ],
        });
    }

}
