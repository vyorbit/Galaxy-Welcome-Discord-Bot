import { Events, Interaction, ChatInputCommandInteraction } from 'discord.js';
import { Event } from '../structures/Event';
import { ExtendedClient } from '../structures/ExtendedClient';
import chalk from 'chalk';

export default new Event({
    name: Events.InteractionCreate,
    execute: async (interaction: Interaction) => {
        // Use isChatInputCommand() — interaction.isCommand() is deprecated in discord.js v14
        if (!interaction.isChatInputCommand()) return;

        const client = interaction.client as ExtendedClient;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.warn(chalk.yellow(`[Warning] No command matching "${interaction.commandName}" was found.`));
            await interaction.reply({ content: '❌ Unknown command.', ephemeral: true }).catch(() => {});
            return;
        }

        console.log(chalk.cyan(`[Command] ${interaction.user.username} (${interaction.user.id}) used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`));

        try {
            await command.execute(client, interaction as ChatInputCommandInteraction);
        } catch (error) {
            console.error(chalk.red(`[Error] Executing command "${interaction.commandName}":`), error);
            const errorMsg = { content: '⚠️ There was an error while executing this command. Please try again later.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg).catch(() => {});
            } else {
                await interaction.reply(errorMsg).catch(() => {});
            }
        }
    }
});
