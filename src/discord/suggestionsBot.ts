import type { ClientOptions, Message } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { Client, Collection } from 'discord.js';
import { ButtonStyle } from 'discord-api-types/v10';
import type { PathLike } from 'fs';
import path from 'path';

import type Main from '../main/main';
import type { Suggestion } from '../main/util/mongo';
import type BaseCommand from './commands/base.command';
import KingsDevEmbedBuilder from './utils/kingsDevEmbedBuilder';

export default class SuggestionsBot extends Client {
    main: Main;
    commands: Collection<string, BaseCommand> = new Collection();

    constructor(main: Main, options: ClientOptions) {
        super(options);
        this.main = main;
    }

    loadCommand(commandPath: PathLike, commandName: string) {
        try {
            const command: BaseCommand = new (require(`${commandPath}${path.sep}${commandName}`).default)(this);
            console.info(`Loading Command: ${command.name}.`);
            this.commands.set(command.name, command);
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`;
        }
    }

    loadEvent(eventPath: PathLike, eventName: string) {
        try {
            const event = new (require(`${eventPath}${path.sep}${eventName}`).default)(this);
            console.info(`Loading Event: ${eventName}.`);
            this.on(eventName, (...args) => event.run(...args));
        } catch (e) {
            return `Unable to load event ${eventName}: ${e}`;
        }
    }

    async updateSuggestion(message: Message, suggestion: Suggestion) {
        return message.edit({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setAuthor({
                        name: `Suggestion | ${suggestion.author.tag}`,
                        iconURL: suggestion.author.avatarURL || undefined,
                    } )
                    .setDescription(suggestion.content)
                    .setColor(948466)
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('suggestion:upvote')
                            .setStyle(ButtonStyle.Success)
                            .setLabel(suggestion.upvotes.length.toString())
                            .setEmoji('👍'),
                        new ButtonBuilder()
                            .setCustomId('suggestion:count')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel((suggestion.upvotes.length - suggestion.downvotes.length).toString())
                            .setEmoji('#️⃣'),
                        new ButtonBuilder()
                            .setCustomId('suggestion:downvote')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel(suggestion.downvotes.length.toString())
                            .setEmoji('👎'),
                    ),
            ],
        });
    }

}
