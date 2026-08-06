import { TextChannel, EmbedBuilder, User, ColorResolvable } from 'discord.js';
import type { ExtendedClient } from '../structures/ExtendedClient';
import {
    GiveawayRow,
    createGiveaway,
    getAllActiveGiveaways,
    getGiveaway,
    markGiveawayEnded,
} from '../database/repositories/GiveawayRepo';
import { humanDuration } from '../utils/duration';
import chalk from 'chalk';

export const GIVEAWAY_EMOJI = '🎉';
const GIVEAWAY_COLOR: ColorResolvable = '#FFD700';  // Gold

export class GiveawayManager {
    private client: ExtendedClient;
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(client: ExtendedClient) {
        this.client = client;
    }

    // ── Startup ──────────────────────────────────────────────────────────────────

    /** Load all active giveaways from DB and restore their end timers. */
    async initialize(): Promise<void> {
        const active = getAllActiveGiveaways();
        if (active.length === 0) return;

        console.log(chalk.blue(`[Giveaway] Restoring ${active.length} active giveaway(s)...`));
        for (const g of active) {
            this.scheduleTimer(g);
        }
    }

    // ── Core Methods ─────────────────────────────────────────────────────────────

    /**
     * Create and send a new giveaway to a channel.
     * Saves to DB and schedules the end timer.
     */
    async start(opts: {
        guildId:     string;
        channelId:   string;
        hostId:      string;
        prize:       string;
        durationMs:  number;
        winnerCount: number;
    }): Promise<string | null> {
        try {
            const guild   = await this.client.guilds.fetch(opts.guildId).catch(() => null);
            const channel = guild
                ? await guild.channels.fetch(opts.channelId).catch(() => null) as TextChannel | null
                : null;

            if (!channel || !channel.isTextBased()) return null;

            const endsAt     = Math.floor((Date.now() + opts.durationMs) / 1000);
            const endsAtDate = new Date(Date.now() + opts.durationMs);

            const embed = new EmbedBuilder()
                .setTitle('🎉  G I V E A W A Y  🎉')
                .setColor(GIVEAWAY_COLOR)
                .setDescription(
                    `### 🎁 ${opts.prize}\n\n` +
                    `React with ${GIVEAWAY_EMOJI} to enter!\n\n` +
                    `⏰ **Ends:** <t:${endsAt}:R>\n` +
                    `👑 **Winner${opts.winnerCount > 1 ? 's' : ''}:** ${opts.winnerCount}\n` +
                    `🎟️ **Hosted by:** <@${opts.hostId}>`
                )
                .setFooter({ text: `Ends at` })
                .setTimestamp(endsAtDate);

            const msg = await channel.send({ embeds: [embed] });
            await msg.react(GIVEAWAY_EMOJI);

            // Persist to DB
            createGiveaway({
                message_id:   msg.id,
                guild_id:     opts.guildId,
                channel_id:   opts.channelId,
                host_id:      opts.hostId,
                prize:        opts.prize,
                winner_count: opts.winnerCount,
                ends_at:      endsAt,
            });

            // Schedule end timer
            this.scheduleTimer({ message_id: msg.id, ends_at: endsAt } as GiveawayRow);

            return msg.id;
        } catch (error) {
            console.error(chalk.red('[Giveaway] Failed to start:'), error);
            return null;
        }
    }

    /**
     * End a giveaway: fetch all reactors, pick winners, edit the original
     * message, and post a congratulatory announcement.
     */
    async end(messageId: string): Promise<{ winners: string[]; error?: string }> {
        this.clearTimer(messageId);

        const giveaway = getGiveaway(messageId);
        if (!giveaway) return { winners: [], error: '❌ Giveaway not found.' };
        if (giveaway.ended) return { winners: [], error: '❌ This giveaway has already ended.' };

        try {
            const { channel, message } = await this.fetchMessage(giveaway);
            if (!message) {
                markGiveawayEnded(messageId, []);
                return { winners: [], error: '❌ Could not find the giveaway message (deleted?).' };
            }

            // Collect all 🎉 reactors (paginated to handle 1000+ entries)
            const participants = await this.fetchParticipants(message);
            const winners      = this.pickWinners(participants, giveaway.winner_count);
            const winnerIds    = winners.map(w => w.id);

            markGiveawayEnded(messageId, winnerIds);

            // Build the ended embed
            const endedEmbed = new EmbedBuilder()
                .setTitle('🎉  GIVEAWAY ENDED  🎉')
                .setColor('#2F3136')
                .setDescription(
                    `### 🎁 ${giveaway.prize}\n\n` +
                    (winners.length > 0
                        ? `🏆 **Winner${winners.length > 1 ? 's' : ''}:** ${winners.map(w => `<@${w.id}>`).join(', ')}`
                        : `❌ **No valid participants entered.**`) +
                    `\n\n🎟️ **Hosted by:** <@${giveaway.host_id}>`
                )
                .setFooter({ text: `${giveaway.winner_count} winner slot(s) | ID: ${messageId}` })
                .setTimestamp();

            await message.edit({ embeds: [endedEmbed] }).catch(() => {});

            if (channel && channel.isTextBased()) {
                if (winners.length > 0) {
                    await channel.send({
                        content: `🎉 Congratulations ${winners.map(w => `<@${w.id}>`).join(' ')}! ` +
                                 `You won **${giveaway.prize}**!\n> [Jump to giveaway](${message.url})`
                    }).catch(() => {});
                } else {
                    await channel.send({
                        content: `❌ The giveaway for **${giveaway.prize}** ended with no valid participants.`
                    }).catch(() => {});
                }
            }

            return { winners: winnerIds };
        } catch (error) {
            console.error(chalk.red(`[Giveaway] Error ending ${messageId}:`), error);
            markGiveawayEnded(messageId, []);
            return { winners: [], error: '⚠️ An unexpected error occurred while ending the giveaway.' };
        }
    }

    /**
     * Reroll a completed giveaway, picking fresh random winners.
     */
    async reroll(messageId: string, count?: number): Promise<{ winners: string[]; error?: string }> {
        const giveaway = getGiveaway(messageId);
        if (!giveaway) return { winners: [], error: '❌ Giveaway not found.' };

        try {
            const { channel, message } = await this.fetchMessage(giveaway);
            if (!message) return { winners: [], error: '❌ Could not find the giveaway message.' };

            const participants = await this.fetchParticipants(message);
            const winnerCount  = Math.max(1, count ?? giveaway.winner_count);
            const winners      = this.pickWinners(participants, winnerCount);

            if (channel && channel.isTextBased()) {
                if (winners.length > 0) {
                    await channel.send({
                        content: `🔁 **Giveaway Rerolled!**\n` +
                                 `New winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => `<@${w.id}>`).join(' ')}\n` +
                                 `Congratulations on winning **${giveaway.prize}**!\n` +
                                 `> [Jump to giveaway](${message.url})`
                    }).catch(() => {});
                } else {
                    await channel.send({ content: `❌ No valid participants to reroll.` }).catch(() => {});
                }
            }

            return { winners: winners.map(w => w.id) };
        } catch (error) {
            console.error(chalk.red(`[Giveaway] Error rerolling ${messageId}:`), error);
            return { winners: [], error: '⚠️ An error occurred during reroll.' };
        }
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────────

    /** Schedule or reschedule the end timer for a giveaway. */
    private scheduleTimer(giveaway: Pick<GiveawayRow, 'message_id' | 'ends_at'>): void {
        const delayMs = giveaway.ends_at * 1000 - Date.now();

        if (delayMs <= 0) {
            // Already expired (bot was down) — end asynchronously
            setImmediate(() => this.end(giveaway.message_id));
            return;
        }

        const timer = setTimeout(() => this.end(giveaway.message_id), delayMs);
        this.timers.set(giveaway.message_id, timer);
    }

    /** Cancel a running timer. */
    clearTimer(messageId: string): void {
        const t = this.timers.get(messageId);
        if (t) { clearTimeout(t); this.timers.delete(messageId); }
    }

    /** Fetch the guild, channel, and message for a giveaway. */
    private async fetchMessage(giveaway: GiveawayRow) {
        const guild   = await this.client.guilds.fetch(giveaway.guild_id).catch(() => null);
        const channel = guild
            ? await guild.channels.fetch(giveaway.channel_id).catch(() => null) as TextChannel | null
            : null;
        const message = channel
            ? await channel.messages.fetch(giveaway.message_id).catch(() => null)
            : null;
        return { guild, channel, message };
    }

    /**
     * Fetch all non-bot users who reacted with 🎉.
     * Paginates until all reactors are collected (handles 1000+ entries).
     */
    private async fetchParticipants(message: Awaited<ReturnType<typeof this.fetchMessage>>['message']) {
        const participants: User[] = [];
        if (!message) return participants;

        const reaction = message.reactions.cache.get(GIVEAWAY_EMOJI)
            ?? await message.reactions.resolve(GIVEAWAY_EMOJI)?.fetch().catch(() => null);
        if (!reaction) return participants;

        let lastId: string | undefined;
        while (true) {
            const batch = await reaction.users.fetch({ limit: 100, after: lastId });
            for (const [, user] of batch) {
                if (!user.bot) participants.push(user);
            }
            if (batch.size < 100) break;
            lastId = batch.last()?.id;
        }

        return participants;
    }

    /** Fisher-Yates shuffle, then take first N unique winners. */
    private pickWinners(pool: User[], count: number): User[] {
        if (pool.length === 0) return [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, pool.length));
    }
}
