import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command';
import { getWelcome } from '../../database/repositories/WelcomeRepo';
import { getLeave } from '../../database/repositories/LeaveRepo';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Shows this server\'s configuration and stats'),

    execute: async (client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guildId || !interaction.guild) {
            return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        await interaction.deferReply();

        const guild = interaction.guild;
        const guildId = interaction.guildId;

        const welcome = getWelcome(guildId);
        const leave   = getLeave(guildId);

        // Fetch owner name
        const owner = await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📊 ${guild.name}`)
            .setThumbnail(guild.iconURL() ?? null)
            .addFields(
                // ── Server Info ──
                { name: '👑 Owner',        value: owner ? `${owner.user.username}` : 'Unknown', inline: true },
                { name: '👥 Members',      value: guild.memberCount.toLocaleString(), inline: true },
                { name: '📅 Created',      value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '\u200B',          value: '\u200B' }, // spacer

                // ── Welcome Config ──
                { name: '👋 Welcome',      value: welcome.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                { name: '📢 Welcome Channel', value: welcome.channel_id ? `<#${welcome.channel_id}>` : '❌ Not set', inline: true },
                { name: '\u200B',          value: '\u200B' }, // spacer

                // ── Leave Config ──
                { name: '🚪 Leave',        value: leave.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                { name: '📢 Leave Channel', value: leave.channel_id ? `<#${leave.channel_id}>` : '❌ Not set', inline: true },
            )
            .setFooter({ text: `Server ID: ${guild.id}` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
});
