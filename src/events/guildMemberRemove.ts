import { Events, GuildMember, EmbedBuilder, TextChannel, PartialGuildMember } from 'discord.js';
import { Event } from '../structures/Event';
import { getLeave, resolveLeavePlaceholders } from '../database/repositories/LeaveRepo';
import chalk from 'chalk';

export default new Event({
    name: Events.GuildMemberRemove,
    execute: async (member: GuildMember | PartialGuildMember) => {
        try {
            // Resolve partial members — user data may be incomplete for large servers
            const fullMember = member.partial
                ? await member.fetch().catch(() => null)
                : member;
            if (!fullMember) return;

            const settings = getLeave(fullMember.guild.id);

            // Bail out if leave is disabled or no channel is configured
            if (!settings.enabled || !settings.channel_id) return;

            // Try cache first, then fetch if missing
            let channel = fullMember.guild.channels.cache.get(settings.channel_id) as TextChannel | undefined;
            if (!channel) {
                channel = await fullMember.guild.channels.fetch(settings.channel_id).catch(() => null) as TextChannel | null ?? undefined;
            }
            if (!channel || !channel.isTextBased()) return;

            // memberCount is already decremented after the member left
            const memberCount = fullMember.guild.memberCount;

            const resolved = resolveLeavePlaceholders(settings.message, {
                username: fullMember.user?.username ?? 'Unknown User',
                server: fullMember.guild.name,
                count: memberCount
            });

            if (settings.embed_enabled) {
                const embed = new EmbedBuilder()
                    .setColor((settings.embed_color as `#${string}`) || '#ED4245')
                    .setDescription(resolved)
                    .setThumbnail(fullMember.user?.displayAvatarURL({ size: 256 }) ?? null)
                    .setFooter({ text: `Now ${memberCount.toLocaleString()} members` })
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            } else {
                await channel.send({ content: resolved });
            }

        } catch (error) {
            console.error(chalk.red(`[GuildMemberRemove] Failed to send leave message in guild ${member.guild?.id}:`), error);
        }
    }
});
