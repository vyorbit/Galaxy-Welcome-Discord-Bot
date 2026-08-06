import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    TextChannel,
    ChannelType
} from 'discord.js';
import { Command } from '../../structures/Command';
import {
    getLeave,
    setLeaveEnabled,
    setLeaveChannel,
    setLeaveMessage,
    setLeaveColor,
    setLeaveEmbedEnabled,
    resetLeave,
    resolveLeavePlaceholders
} from '../../database/repositories/LeaveRepo';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Configure leave messages for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Set the channel where leave messages are sent')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('The text channel for leave messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Set the leave message text')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Message text. Use {user} {server} {count}')
                        .setRequired(true)
                        .setMaxLength(1000)
                )
        )
        .addSubcommand(sub =>
            sub.setName('color')
                .setDescription('Set the embed color for leave messages')
                .addStringOption(opt =>
                    opt.setName('hex')
                        .setDescription('Hex color code, e.g. #ED4245')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('embed')
                .setDescription('Toggle embed on or off for leave messages')
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('True = embed, False = plain text')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Enable or disable leave messages')
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('True to enable, False to disable')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Send a test leave message in this channel')
        )
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View the current leave configuration')
        )
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('Reset all leave settings to default')
        ),

    execute: async (client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guildId || !interaction.guild) {
            return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // ── /leave setup ─────────────────────────────────────────────────────────
        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel', true) as TextChannel;
            setLeaveChannel(guildId, channel.id);

            const settings = getLeave(guildId);
            if (!settings.enabled) {
                setLeaveEnabled(guildId, true);
            }

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Leave Channel Set')
                .setDescription(`Leave messages will now be sent to ${channel}.`)
                .addFields({ name: 'Status', value: '🟢 Enabled automatically', inline: true })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /leave message ───────────────────────────────────────────────────────
        if (sub === 'message') {
            const text = interaction.options.getString('text', true);
            setLeaveMessage(guildId, text);

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Leave Message Updated')
                .addFields(
                    { name: 'New Message', value: text },
                    { name: 'Available Placeholders', value: '`{user}` `{server}` `{count}`' }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /leave color ─────────────────────────────────────────────────────────
        if (sub === 'color') {
            const hex = interaction.options.getString('hex', true).trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                return interaction.reply({ content: '❌ Invalid hex color. Use format: `#RRGGBB`', ephemeral: true });
            }
            setLeaveColor(guildId, hex);

            const embed = new EmbedBuilder()
                .setColor(hex as `#${string}`)
                .setTitle('✅ Leave Embed Color Updated')
                .setDescription(`Color set to \`${hex}\``)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /leave embed ─────────────────────────────────────────────────────────
        if (sub === 'embed') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setLeaveEmbedEnabled(guildId, enabled);

            return interaction.reply({
                content: `✅ Leave messages will now be sent as **${enabled ? 'embed' : 'plain text'}**.`,
                ephemeral: true
            });
        }

        // ── /leave toggle ────────────────────────────────────────────────────────
        if (sub === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setLeaveEnabled(guildId, enabled);

            return interaction.reply({
                content: `✅ Leave messages are now **${enabled ? '🟢 enabled' : '🔴 disabled'}**.`,
                ephemeral: true
            });
        }

        // ── /leave test ──────────────────────────────────────────────────────────
        if (sub === 'test') {
            const settings = getLeave(guildId);
            const memberCount = interaction.guild.memberCount;

            const resolved = resolveLeavePlaceholders(settings.message, {
                username: interaction.user.username,
                server: interaction.guild.name,
                count: memberCount
            });

            if (settings.embed_enabled) {
                const embed = new EmbedBuilder()
                    .setColor((settings.embed_color as `#${string}`) || '#ED4245')
                    .setDescription(resolved)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: '👆 This is a test leave message' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply({ content: resolved });
            }
        }

        // ── /leave view ──────────────────────────────────────────────────────────
        if (sub === 'view') {
            const s = getLeave(guildId);

            const embed = new EmbedBuilder()
                .setColor((s.embed_color as `#${string}`) || '#ED4245')
                .setTitle('🚪 Leave Configuration')
                .addFields(
                    { name: 'Status',  value: s.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                    { name: 'Channel', value: s.channel_id ? `<#${s.channel_id}>` : '❌ Not set', inline: true },
                    { name: 'Embed',   value: s.embed_enabled ? '✅ On' : '❌ Off', inline: true },
                    { name: 'Color',   value: `\`${s.embed_color}\``, inline: true },
                    { name: 'Message', value: `\`\`\`${s.message}\`\`\`` }
                )
                .setFooter({ text: 'Placeholders: {user} {server} {count}' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /leave reset ─────────────────────────────────────────────────────────
        if (sub === 'reset') {
            resetLeave(guildId);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🔄 Leave Settings Reset')
                .setDescription('All leave settings have been reset to their defaults.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});
