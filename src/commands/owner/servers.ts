import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('owner-servers')
        .setDescription('Shows detailed information about all servers (Owner Only)'),
    execute: async (client, interaction: ChatInputCommandInteraction) => {
        // Owner-only guard
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '🔒 Only the bot owner can use this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch guild info across all clusters/shards
            const results = await client.cluster.broadcastEval((c) => {
                return c.guilds.cache.map(g => ({
                    name: g.name,
                    id: g.id,
                    memberCount: g.memberCount
                }));
            });

            // Flatten array of arrays from each cluster
            const allGuilds = results.flat();
            const totalMembers = allGuilds.reduce((acc, guild) => acc + guild.memberCount, 0);

            // Build description, capped at 20 entries to stay within embed limits
            const displayGuilds = allGuilds.slice(0, 20);
            let description = `**Total Servers:** ${allGuilds.length}\n**Total Members:** ${totalMembers.toLocaleString()}\n\n`;

            displayGuilds.forEach((g, index) => {
                description += `\`${index + 1}.\` **${g.name}** (${g.id}) — ${g.memberCount.toLocaleString()} members\n`;
            });

            if (allGuilds.length > 20) {
                description += `\n*...and ${allGuilds.length - 20} more server(s).*`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🌐 Global Server Information')
                .setDescription(description)
                .setColor('#5865F2')
                .setFooter({ text: `Clusters: ${results.length}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('[owner-servers] broadcastEval failed:', error);
            await interaction.editReply({ content: '❌ Failed to fetch server list. Are clusters running?' });
        }
    }
});
