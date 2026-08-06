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
    getWelcome,
    setWelcomeEnabled,
    setWelcomeChannel,
    setWelcomeMessage,
    setWelcomeColor,
    setWelcomeEmbedEnabled,
    resetWelcome,
    resolveWelcomePlaceholders
} from '../../database/repositories/WelcomeRepo';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome messages for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Set the channel where welcome messages are sent')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('The text channel for welcome messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Set the welcome message text')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Message text. Use {mention} {user} {server} {count}')
                        .setRequired(true)
                        .setMaxLength(1000)
                )
        )
        .addSubcommand(sub =>
            sub.setName('color')
                .setDescription('Set the embed color for welcome messages')
                .addStringOption(opt =>
                    opt.setName('hex')
                        .setDescription('Hex color code, e.g. #5865F2')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('embed')
                .setDescription('Toggle embed on or off for welcome messages')
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('True = send as embed, False = send as plain text')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Enable or disable welcome messages')
                .addBooleanOption(opt =>
                    opt.setName('enabled')
                        .setDescription('True to enable, False to disable')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Send a test welcome message in this channel')
        )
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View the current welcome configuration')
        )
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('Reset all welcome settings to default')
        ),

    execute: async (client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guildId || !interaction.guild) {
            return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // ── /welcome setup ──────────────────────────────────────────────────────
        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel', true) as TextChannel;
            setWelcomeChannel(guildId, channel.id);

            const settings = getWelcome(guildId);
            if (!settings.enabled) {
                setWelcomeEnabled(guildId, true);
            }

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Welcome Channel Set')
                .setDescription(`Welcome messages will now be sent to ${channel}.`)
                .addFields({ name: 'Status', value: '🟢 Enabled automatically', inline: true })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /welcome message ─────────────────────────────────────────────────────
        if (sub === 'message') {
            const text = interaction.options.getString('text', true);
            setWelcomeMessage(guildId, text);

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Welcome Message Updated')
                .addFields(
                    { name: 'New Message', value: text },
                    { name: 'Available Placeholders', value: '`{mention}` `{user}` `{server}` `{count}`' }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /welcome color ───────────────────────────────────────────────────────
        if (sub === 'color') {
            const hex = interaction.options.getString('hex', true).trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                return interaction.reply({ content: '❌ Invalid hex color. Use format: `#RRGGBB`', ephemeral: true });
            }
            setWelcomeColor(guildId, hex);

            const embed = new EmbedBuilder()
                .setColor(hex as `#${string}`)
                .setTitle('✅ Welcome Embed Color Updated')
                .setDescription(`Color set to \`${hex}\``)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /welcome embed ───────────────────────────────────────────────────────
        if (sub === 'embed') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setWelcomeEmbedEnabled(guildId, enabled);

            return interaction.reply({
                content: `✅ Welcome messages will now be sent as **${enabled ? 'embed' : 'plain text'}**.`,
                ephemeral: true
            });
        }

        // ── /welcome toggle ──────────────────────────────────────────────────────
        if (sub === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setWelcomeEnabled(guildId, enabled);

            return interaction.reply({
                content: `✅ Welcome messages are now **${enabled ? '🟢 enabled' : '🔴 disabled'}**.`,
                ephemeral: true
            });
        }

        // ── /welcome test ────────────────────────────────────────────────────────
        if (sub === 'test') {
            const settings = getWelcome(guildId);
            const memberCount = interaction.guild.memberCount;

            const resolved = resolveWelcomePlaceholders(settings.message, {
                username: interaction.user.username,
                mention: interaction.user.toString(),
                server: interaction.guild.name,
                count: memberCount
            });

            if (settings.embed_enabled) {
                const embed = new EmbedBuilder()
                    .setColor((settings.embed_color as `#${string}`) || '#5865F2')
                    .setDescription(resolved)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: '👆 This is a test welcome message' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply({ content: resolved });
            }
        }

        // ── /welcome view ────────────────────────────────────────────────────────
        if (sub === 'view') {
            const s = getWelcome(guildId);

            const embed = new EmbedBuilder()
                .setColor((s.embed_color as `#${string}`) || '#5865F2')
                .setTitle('👋 Welcome Configuration')
                .addFields(
                    { name: 'Status',    value: s.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                    { name: 'Channel',   value: s.channel_id ? `<#${s.channel_id}>` : '❌ Not set', inline: true },
                    { name: 'Embed',     value: s.embed_enabled ? '✅ On' : '❌ Off', inline: true },
                    { name: 'Color',     value: `\`${s.embed_color}\``, inline: true },
                    { name: 'Message',   value: `\`\`\`${s.message}\`\`\`` }
                )
                .setFooter({ text: 'Placeholders: {mention} {user} {server} {count}' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── /welcome reset ───────────────────────────────────────────────────────
        if (sub === 'reset') {
            resetWelcome(guildId);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🔄 Welcome Settings Reset')
                .setDescription('All welcome settings have been reset to their defaults.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});
