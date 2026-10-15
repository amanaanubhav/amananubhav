/** Static content for the Life page sections, hoisted verbatim from the legacy components. */

export interface StemItem {
  num: string;
  title: string;
  desc: string;
  tags: string[];
  image: string;
}

export const STEM_ITEMS: readonly StemItem[] = [
  {
    num: '01',
    title: 'DEFYING SCHRODINGER EQUATION',
    desc: 'A theory research proposed to accurately discover the position of an electron near the atom using Bekenstein bound and other physics principles.',
    tags: ['Quantum Physics', 'Theoretical Physics', 'Bekenstein Bound'],
    image: '/schrodinger_bg.png',
  },
  {
    num: '02',
    title: 'PAVANA',
    desc: 'A carbon sequestration system using solar heat.',
    tags: ['Carbon Sequestration', 'Solar Heat', 'Sustainability'],
    image: '/pavana_bg.png',
  },
  {
    num: '03',
    title: 'VYOMAGAMI',
    desc: 'A solid fuel 2-stage rocket capable of flying into earth orbit.',
    tags: ['Aerospace', 'Propulsion', 'Orbital Mechanics'],
    image: '/vyomagami_bg.png',
  },
  {
    num: '04',
    title: 'VT60 & UF78',
    desc: 'Two Near-Earth Object asteroids discovered and currently in monitoring by NASA.',
    tags: ['Astronomy', 'NEO Discovery', 'NASA'],
    image: '/asteroids_bg.png',
  },
];

export interface AthleticsSlide {
  category: string;
  title: string;
  desc: string;
  image: string;
}

export const ATHLETICS_SLIDES: readonly AthleticsSlide[] = [
  {
    category: "Fitness & Athletics",
    title: "High Energy Maintenance",
    desc: "Pushing physical limits, embracing risk, and maintaining peak performance.",
    image: "https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&q=80",
  },
  {
    category: "Adventure Sports / Mountaineering",
    title: "Thorong La Pass",
    desc: "Elevation: 5416m",
    image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80",
  },
  {
    category: "Adventure Sports / Mountaineering",
    title: "Tilicho Lake",
    desc: "Elevation: 5200m — World's highest glacial lake.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80",
  },
  {
    category: "Adventure Sports / Mountaineering",
    title: "Kun Tso",
    desc: "Elevation: 5000m",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80",
  },
  {
    category: "Adventure Sports / Mountaineering",
    title: "Ice Lake",
    desc: "Elevation: 4800m",
    image: "/ice_lake_placeholder.png",
  },
  {
    category: "Videography",
    title: "Visual Storytelling",
    desc: "Capturing raw moments. Translating adrenaline and silence into a universal cinematic language.",
    image: "/videography_placeholder.png",
  },
];

export interface VentureLink {
  name: string;
  url: string;
}

export interface Venture {
  title: string;
  subtitle: string;
  desc: string;
  metric: string;
  links: VentureLink[];
  /** Media placeholder gradient stops, per theme (legacy: isDark ? dark : light). */
  mediaColor: { dark: string; light: string };
}

export const VENTURES: readonly Venture[] = [
  {
    title: 'Accolades',
    subtitle: 'Founder / The Command Center for Human Potential',
    desc: 'An elite discovery framework shifting students from passive searching to strategic career engineering. Democratizing access to high-value technical opportunities globally by mitigating noise and curating premium data.',
    metric: '01',
    links: [
      { name: 'Website', url: 'https://www.accolades.site' },
    ],
    mediaColor: { dark: 'from-zinc-800 to-zinc-900', light: 'from-zinc-100 to-zinc-200' },
  },
  {
    title: 'TheTravStory',
    subtitle: 'Founder / AI Travel Ecosystem',
    desc: 'An AI-powered platform generating personalized itineraries and facilitating direct bookings. Solving travel friction by saving time through hyper-curated, seamless experiences without the hustle and hiccups.',
    metric: '02',
    links: [
      { name: 'Website', url: 'https://www.thetravstory.com' },
      { name: 'Instagram', url: 'https://www.instagram.com/the_travstory/' },
    ],
    mediaColor: { dark: 'from-zinc-800 to-zinc-900', light: 'from-zinc-100 to-zinc-200' },
  },
  {
    title: 'Deuxstem',
    subtitle: 'Founder',
    desc: 'An entrepreneurial venture focused on scaling innovative solutions. Driving impact through strategic development and focused execution.',
    metric: '03',
    links: [
      { name: 'LinkedIn', url: 'https://in.linkedin.com/company/deuxstem' },
      { name: 'Instagram', url: 'https://www.instagram.com/deuxstem/' },
      { name: 'Google', url: 'https://www.google.com/search?q=deuxstem' },
    ],
    mediaColor: { dark: 'from-zinc-800 to-zinc-900', light: 'from-zinc-100 to-zinc-200' },
  },
  {
    title: 'MIT Launch X & Sedu',
    subtitle: 'Top 8% International Full Ride (2022)',
    desc: 'Selected as top 8% from all international applicants for a full ride to MIT Launch X. Developed a business named Sedu, engineering a rapid go-to-market strategy that generated $875 in sales within just 5 weeks.',
    metric: '04',
    links: [],
    mediaColor: { dark: 'from-zinc-800 to-zinc-900', light: 'from-zinc-100 to-zinc-200' },
  },
];

export const GALLERY_ITEMS: readonly string[] = [
  "/G1.webp", "/G21.webp", "/G8.webp",
  "/G5.webp", "/G6.webp", "/GV16.mp4",
  "/G13.webp", "/G14.webp", "/GV10.mp4",
  "/G2.webp", "/G9.webp", "/GV7.mp4",
];
