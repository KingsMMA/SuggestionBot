import type SuggestionsBot from '../suggestionsBot';
import {ActionRowBuilder, ButtonBuilder, Message} from "discord.js";
import KingsDevEmbedBuilder from "../utils/kingsDevEmbedBuilder";
import {ButtonStyle, ThreadAutoArchiveDuration} from "discord-api-types/v10";

export default class {
    client: SuggestionsBot;

    constructor(client: SuggestionsBot) {
        this.client = client;
    }

    async run(message: Message) {
        if (message.author.bot) return;
        if (message.channel.isDMBased()) return;
        if (!message.guildId) return;

        const { suggestions, accepted, denied } = await this.client.main.mongo.fetchGuildChannels(message.guildId) ||
            {suggestions: null, accepted: null, denied: null};
        if (!suggestions) return;
        if (message.channelId !== suggestions) return;

        let suggestionMessage = await message.channel.send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setAuthor({
                        name: `Suggestion | ${message.author.tag}`,
                        iconURL: message.author.avatarURL() || undefined,
                    }, )
                    .setDescription(message.content)
                    .setColor(948466)
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('suggestion:upvote')
                            .setStyle(ButtonStyle.Success)
                            .setLabel('0')
                            .setEmoji('👍'),
                        new ButtonBuilder()
                            .setCustomId('suggestion:count')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel('0')
                            .setEmoji('#️⃣'),
                        new ButtonBuilder()
                            .setCustomId('suggestion:downvote')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('0')
                            .setEmoji('👎'),
                    ),
            ],
        });

        void message.delete();
        void suggestionMessage.startThread({
            name: `Suggestion | ${message.author.tag}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
        });
        void this.client.main.mongo.postSuggestion(message.guildId, suggestionMessage.url, message.author.tag, message.author.avatarURL(), message.content);
    }
}
