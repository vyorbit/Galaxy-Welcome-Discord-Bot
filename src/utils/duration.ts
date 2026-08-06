/**
 * Parse a duration string like "1h", "30m", "2d", "1w" into milliseconds.
 * Returns null if the format is invalid.
 */
export function parseDuration(input: string): number | null {
    const match = input.trim().match(/^(\d+)\s*(s|m|h|d|w)$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    if (value <= 0 || value > 100_000) return null;

    const units: Record<string, number> = {
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
        w: 604_800_000,
    };

    return value * units[match[2].toLowerCase()];
}

/**
 * Format milliseconds into a human-readable string like "2 hours" or "3 days".
 */
export function humanDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const w = Math.floor(d / 7);

    if (w > 0) return `${w} week${w !== 1 ? 's' : ''}`;
    if (d > 0) return `${d} day${d !== 1 ? 's' : ''}`;
    if (h > 0) return `${h} hour${h !== 1 ? 's' : ''}`;
    if (m > 0) return `${m} minute${m !== 1 ? 's' : ''}`;
    return `${s} second${s !== 1 ? 's' : ''}`;
}

/**
 * Build a Unicode block progress bar.
 * e.g. buildBar(75, 100) → "███████░░░"
 */
export function buildBar(value: number, total: number, length = 10): string {
    const pct  = total === 0 ? 0 : value / total;
    const fill = Math.round(pct * length);
    return '█'.repeat(fill) + '░'.repeat(length - fill);
}
