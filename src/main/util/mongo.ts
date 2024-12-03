import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

import type Main from '../main';
import {Snowflake} from "discord.js";

export type GuildData = {
    guild_id: Snowflake;
    channels: {
        suggestions: Snowflake,
        accepted: Snowflake,
        denied: Snowflake,
    };
    suggestions: Record<string, {
        posted: number;
        author: Snowflake;
        content: string;
        upvotes: Snowflake[];
        downvotes: Snowflake[];
    }>;
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

    async postSuggestion(guild_id: Snowflake, message_url: string, author: Snowflake, content: string): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $set: { [`suggestions.${message_url.replace(/\./g, '[D]')}`]: { posted: Date.now(), author, content, upvotes: [], downvotes: [] } } },
                { upsert: true });
    }

    async upvoteSuggestion(guild_id: Snowflake, message_url: string, user_id: Snowflake): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $addToSet: { [`suggestions.${message_url.replace(/\./g, '[D]')}.upvotes`]: user_id } });
    }

    async downvoteSuggestion(guild_id: Snowflake, message_url: string, user_id: Snowflake): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $addToSet: { [`suggestions.${message_url.replace(/\./g, '[D]')}.downvotes`]: user_id } });
    }

    async removeVote(guild_id: Snowflake, message_url: string, user_id: Snowflake): Promise<void> {
        return void this.mongo.collection('guilds')
            .updateOne(
                { guild_id: guild_id },
                { $pull: { [`suggestions.${message_url.replace(/\./g, '[D]')}.upvotes`]: user_id, [`suggestions.${message_url.replace(/\./g, '[D]')}.downvotes`]: user_id } });
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
