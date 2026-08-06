import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and shows bot latency'),
    execute: async (client, interaction: ChatInputCommandInteraction) => {
        // Defer first, then fetch the reply to measure latency
        await interaction.deferReply();

        const reply = await interaction.fetchReply();
        const latency = reply.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        // Color-code latency
        const latencyColor = latency < 100 ? '#00ff88' : latency < 250 ? '#ffaa00' : '#ff4444';

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(latencyColor as `#${string}`)
            .addFields(
                { name: '📡 Bot Latency', value: `\`${latency}ms\``, inline: true },
                { name: '🌐 API Latency', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
});
