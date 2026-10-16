import type { Achievement, AchievementGroup } from '@/entities/achievement';

/** Register order of the groups (§G.6). */
export const ACHIEVEMENT_GROUP_ORDER: readonly AchievementGroup[] = ['Competitions', 'Selections', 'Recognition', 'Service'];

export interface AchievementSection {
  /** The group name, or undefined for entries without one (rendered last, under a neutral heading). */
  group: AchievementGroup | undefined;
  items: Achievement[];
}

/**
 * Splits the (already filtered) register into its groups in register order, keeping data order inside each
 * group. Empty groups are dropped so a search never leaves an empty heading behind.
 */
export function groupAchievements(items: readonly Achievement[]): AchievementSection[] {
  const byGroup = new Map<AchievementGroup | undefined, Achievement[]>();
  for (const item of items) {
    const list = byGroup.get(item.group);
    if (list) list.push(item);
    else byGroup.set(item.group, [item]);
  }
  const ordered: AchievementSection[] = [];
  for (const group of ACHIEVEMENT_GROUP_ORDER) {
    const list = byGroup.get(group);
    if (list) ordered.push({ group, items: list });
  }
  const ungrouped = byGroup.get(undefined);
  if (ungrouped) ordered.push({ group: undefined, items: ungrouped });
  return ordered;
}

/** Winner and 1st place take the signal stamp; every other rank is ink on a line-strong edge (§G.6). */
export function isTopRank(rank: string | undefined): boolean {
  if (!rank) return false;
  return rank === 'Winner' || rank.startsWith('1st');
}

/** "1 honor" / "18 honors". */
export function honorCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'honor' : 'honors'}`;
}
