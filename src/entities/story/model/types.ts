import type { MediaSlotId } from '@/shared/config';

export type StoryCategory =
  | 'Expedition & Mountaineering'
  | 'Dev & Automation'
  | 'Life & Astronomy'
  | 'Aerospace Innovation'
  | 'Climate Tech';

/** Local files only (no hotlinks). */
export type StoryMedia = { type: 'image'; url: string };

export type StoryLink = { label: string; url: string };

export type Story = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  category: StoryCategory;
  /** Local path of an existing cover photo, or '' when the cover is a pending media slot. */
  coverImage: string;
  /** Semantic HTML (h3, h4, p, ul, ol, li, blockquote, figure, figcaption, img, pre, code, a, strong, em). No classes. */
  content: string;
  media: StoryMedia[];
  links: StoryLink[];
  /** Matching `entities/expedition` id, for trek stories. */
  expeditionId?: string;
  /** Media registry slot for the cover (§E.3). */
  coverSlot?: MediaSlotId;
  /** Plates the reader shows after the body. */
  slotIds?: readonly MediaSlotId[];
  place?: string;
};
