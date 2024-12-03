import type { Interaction } from 'discord.js';

import type SuggestionsBot from '../suggestionsBot';

export default class {
    client: SuggestionsBot;
    constructor(client: SuggestionsBot) {
        this.client = client;
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) {
            if (!interaction.guild) return interaction.replyError('This command can only be used in a server.');

            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;

            if (!command.opts.enabled) {
                return interaction.reply({
                    content: 'This command is currently disabled.',
                    ephemeral: true,
                });
            }

            return command.execute(interaction);
        } else if (interaction.isAutocomplete()) {
            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;
            return command.autocomplete(interaction);
        } else if (interaction.isButton()) {
            const suggestions = await this.client.main.mongo.fetchSuggestions(interaction.guildId!);
            if (!suggestions) return interaction.replyError('No suggestions have been posted in this server.');

            const suggestion = suggestions[interaction.message.url.replace(/\./g, '[D]')];
            if (!suggestion) return interaction.replyError('This suggestion does not exist.');

            void interaction.deferUpdate();
            if (interaction.customId === 'suggestion:upvote') {
                if (suggestion.upvotes.includes(interaction.user.id)) {
                    suggestion.upvotes = suggestion.upvotes.filter(id => id !== interaction.user.id);
                } else {
                    suggestion.upvotes.push(interaction.user.id);
                    suggestion.downvotes = suggestion.downvotes.filter(id => id !== interaction.user.id);
                }
            } else if (interaction.customId === 'suggestion:downvote') {
                if (suggestion.downvotes.includes(interaction.user.id)) {
                    suggestion.downvotes = suggestion.downvotes.filter(id => id !== interaction.user.id);
                } else {
                    suggestion.downvotes.push(interaction.user.id);
                    suggestion.upvotes = suggestion.upvotes.filter(id => id !== interaction.user.id);
                }
            }

            await this.client.main.mongo.updateSuggestion(interaction.guildId!, interaction.message.url, suggestion);
            await this.client.updateSuggestion(interaction.message, suggestion);
        }
    }
}
