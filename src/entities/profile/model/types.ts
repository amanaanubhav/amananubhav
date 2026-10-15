export type ProfileLinks = {
  linkedin: string;
  github: string;
  email: string;
  news: string;
  website: string;
  kaggle: string;
  phone: string;
  instagram: string;
};

export type Education = {
  institution: string;
  degree: string;
  focus: string;
  year?: string;
  cpi?: string;
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
};
