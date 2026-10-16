import type { Achievement } from '@/entities/achievement';

/** A skill group split into the items used every day (shown first, larger) and the rest, in data order. */
export function splitDaily(items: readonly string[], daily: readonly string[]): { daily: string[]; rest: string[] } {
  const isDaily = new Set(daily);
  return {
    daily: items.filter((item) => isDaily.has(item)),
    rest: items.filter((item) => !isDaily.has(item)),
  };
}

/** The six starred honors (§G.3 #achievements), in data order. No filler: if fewer are starred, fewer show. */
export function featuredHonors(list: readonly Achievement[], limit = 6): Achievement[] {
  return list.filter((item) => item.featured).slice(0, limit);
}

/** Ranks that read as a win get the signal stamp; selections and qualifiers stay ink. */
export function isWinningRank(rank: string | undefined): boolean {
  if (!rank) return false;
  return /^(winner|1st)/i.test(rank.trim());
}

/** Time-zone window in IST as "10:00 to 19:00 IST" (Q-20). */
export function formatWindowIST(window: readonly [number, number] | undefined): string | undefined {
  if (!window) return undefined;
  const hh = (hour: number) => `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;
  return `${hh(window[0])} to ${hh(window[1])} IST`;
}
