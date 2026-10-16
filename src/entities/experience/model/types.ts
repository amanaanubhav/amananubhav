export type ExperienceMode = 'remote' | 'onsite' | 'hybrid';

export type ExperienceEntry = {
  role: string;
  org: string;
  /** Display label, e.g. "Jun 2026 — Jul 2026". */
  time: string;
  /** The prose paragraph (the terminal reads it). */
  detail: string;
  /** Stable id for React keys and anchors. */
  id?: string;
  /** ISO `yyyy-mm` or `yyyy`, for `<time dateTime>`; undefined when unknown. */
  start?: string;
  /** ISO `yyyy-mm` or `yyyy`; undefined while the role is current. */
  end?: string;
  mode?: ExperienceMode;
  bullets?: readonly string[];
  stack?: readonly string[];
  oneLiner?: string;
};
