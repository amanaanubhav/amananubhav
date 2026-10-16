/** Public contact links. There is deliberately no phone field (Q-01, spec §A.6). */
export type ProfileLinks = {
  linkedin: string;
  github: string;
  email: string;
  news: string;
  website: string;
  kaggle: string;
  instagram: string;
};

export type Education = {
  institution: string;
  degree: string;
  focus: string;
  year?: string;
  /** Withheld until Q-37 is answered; never set in data. */
  cpi?: string;
};

/** Remote-work availability. Window, start date and roles stay undefined until Q-20 / Q-21. */
export type ProfileAvailability = {
  openToRemote: boolean;
  timeZone: 'Asia/Kolkata';
  utcLabel: 'IST, UTC+5:30';
  /** Working window in IST hours, e.g. [10, 19]. */
  workWindowIST?: readonly [number, number];
  availableFrom?: string;
  roles?: readonly string[];
};

export type Profile = {
  name: string;
  role: string;
  about: string;
  location: string;
  links: ProfileLinks;
  education: Education[];
  interests: string[];
  philosophy?: string;
  /** Short display name ("Aman Anubhav"). */
  displayName?: string;
  tagline?: string;
  availability?: ProfileAvailability;
  dailyStack?: readonly string[];
  focus?: readonly string[];
};
