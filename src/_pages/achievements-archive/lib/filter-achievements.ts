import { normalizeAchievement, type Achievement, type AchievementInput } from '@/entities/achievement';

/** Legacy normalize + search filter (title, desc, skills). */
export function filterAchievements(
  achievements: readonly AchievementInput[],
  searchQuery: string,
): Achievement[] {
  let items = achievements.map(normalizeAchievement);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.skills?.some((s) => s.toLowerCase().includes(q)),
    );
  }
  return items;
}
