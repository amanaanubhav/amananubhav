import type { Achievement, AchievementInput } from '../model/types';

/**
 * Normalizes achievement data from string to object. Ported verbatim from the
 * legacy helper, including the generic desc and the fixed "Winner" rank.
 */
export function normalizeAchievement(item: AchievementInput): Achievement {
  if (typeof item === 'string') {
    // Simple string parsing fallback
    const parts = item.split('(');
    const title = (parts[0] ?? '').trim();
    const meta = parts[1] ? parts[1].replace(')', '') : 'Honor';
    return {
      title: title,
      desc: 'Awarded for excellence in technical innovation and problem solving.',
      skills: [meta],
      rank: 'Winner',
    };
  }
  return item;
}
