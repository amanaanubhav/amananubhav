export type Achievement = {
  title: string;
  desc: string;
  skills?: string[];
  rank?: string;
};

export type AchievementInput = string | Achievement;
