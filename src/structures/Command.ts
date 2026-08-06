import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { ExtendedClient } from './ExtendedClient';

export interface CommandOptions {
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    execute: (client: ExtendedClient, interaction: ChatInputCommandInteraction) => Promise<any>;
}

export class Command {
    public data: CommandOptions['data'];
    public execute: CommandOptions['execute'];

    constructor(options: CommandOptions) {
        this.data = options.data;
        this.execute = options.execute;
    }
}
