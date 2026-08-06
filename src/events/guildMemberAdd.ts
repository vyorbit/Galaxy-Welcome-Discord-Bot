import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { Event } from '../structures/Event';
import { getWelcome, resolveWelcomePlaceholders } from '../database/repositories/WelcomeRepo';
import chalk from 'chalk';

export default new Event({
    name: Events.GuildMemberAdd,
    execute: async (member: GuildMember) => {
        try {
            const settings = getWelcome(member.guild.id);

            // Bail out if welcome is disabled or no channel is configured
            if (!settings.enabled || !settings.channel_id) return;

            // Try cache first, then fetch if missing (channels may not be cached on all shards)
            let channel = member.guild.channels.cache.get(settings.channel_id) as TextChannel | undefined;
            if (!channel) {
                channel = await member.guild.channels.fetch(settings.channel_id).catch(() => null) as TextChannel | null ?? undefined;
            }
            if (!channel || !channel.isTextBased()) return;

            const memberCount = member.guild.memberCount;

            const resolved = resolveWelcomePlaceholders(settings.message, {
                username: member.user.username,
                mention: member.toString(),
                server: member.guild.name,
                count: memberCount
            });

            if (settings.embed_enabled) {
                const embed = new EmbedBuilder()
                    .setColor((settings.embed_color as `#${string}`) || '#5865F2')
                    .setDescription(resolved)
                    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                    .setFooter({ text: `Member #${memberCount.toLocaleString()}` })
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            } else {
                await channel.send({ content: resolved });
            }

        } catch (error) {
            console.error(chalk.red(`[GuildMemberAdd] Failed to send welcome message in guild ${member.guild.id}:`), error);
        }
    }
});
