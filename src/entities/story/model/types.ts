export type StoryCategory =
  | 'Expedition & Mountaineering'
  | 'Dev & Automation'
  | 'Life & Astronomy'
  | 'Aerospace Innovation'
  | 'Climate Tech';

export type StoryMedia = { type: 'image'; url: string };

export type StoryLink = { label: string; url: string };

export type Story = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  category: StoryCategory;
  coverImage: string;
  content: string;
  media: StoryMedia[];
  links: StoryLink[];
};
