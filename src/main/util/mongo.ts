import type { Snowflake } from 'discord.js';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

import type Main from '../main';

export type Suggestion = {
    posted: number;
    author: {
        tag: string;
        avatarURL: string | null;
    };
    content: string;
    upvotes: Snowflake[];
    downvotes: Snowflake[];
};

export type GuildData = {
    guild_id: Snowflake;
    channels: {
        suggestions: Snowflake,
        accepted: Snowflake,
        denied: Snowflake,
    };
    suggestions: Record<string, Suggestion>;
};

export default class Mongo {
    private mongo!: Db;
    main: Main;
    constructor(main: Main) {
        this.main = main;
    }

    async connect() {
        const client = await MongoClient.connect(process.env.MONGO_URI!);
        this.mongo = client.db(this.main.config.mongo.database);
        console.info(`Connected to Database ${this.mongo.databaseName}`);
    }

    async setGuildChannels(guild_id: Snowflake, suggestions: Snowflake, accepted: Snowflake, denied: Snowflake): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $set: {
                    'channels.suggestions': suggestions,
                    'channels.accepted': accepted,
                    'channels.denied': denied,
                } },
                { upsert: true });
    }

    async fetchGuildChannels(guild_id: Snowflake): Promise<GuildData['channels'] | null> {
        return await this.mongo.collection('guilds')
            .findOne({ guild_id }, { projection: { _id: 0, channels: 1 } })
            .then(doc => doc?.channels || null);
    }

    async postSuggestion(guild_id: Snowflake, message_url: string, authorTag: string, authorAvatar: string | null, content: string): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $set: { [`suggestions.${message_url.replace(/\./g, '[D]')}`]: {
                    posted: Date.now(),
                    author: {
                        tag: authorTag,
                        avatarURL: authorAvatar
                    },
                    content: content,
                    upvotes: [],
                    downvotes: [] } } },
                { upsert: true });
    }

    async fetchSuggestions(guild_id: Snowflake): Promise<GuildData['suggestions']> {
        return await this.mongo.collection('guilds')
            .findOne({ guild_id }, { projection: { _id: 0, suggestions: 1 } })
            .then(doc => doc?.suggestions || {});
    }

    async updateSuggestion(guild_id: Snowflake, message_url: string, suggestion: GuildData['suggestions'][string]): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $set: { [`suggestions.${message_url.replace(/\./g, '[D]')}`]: suggestion } });
    }

    async removeSuggestion(guild_id: Snowflake, message_url: string): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $unset: { [`suggestions.${message_url.replace(/\./g, '[D]')}`]: '' } });
    }

    async fetchGuild(guild_id: Snowflake): Promise<GuildData | null> {
        return await this.mongo.collection('guilds')
            .findOne({ guild_id }) as GuildData | null;
    }

}
