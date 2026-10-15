export const ROUTES = {
  home: '/',
  personal: '/personal',
  professional: '/professional',
  stories: '/stories',
  projectArchive: '/project-archive',
  achievements: '/achievements',
  adminChat: '/admin-chat',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
