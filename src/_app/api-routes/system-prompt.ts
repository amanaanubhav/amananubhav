import 'server-only';

import { ACHIEVEMENTS } from '@/entities/achievement';
import { ACTIVITIES } from '@/entities/activity';
import { EXPEDITIONS, type Expedition, type Waypoint } from '@/entities/expedition';
import { EXPERIENCE } from '@/entities/experience';
import { PROFILE } from '@/entities/profile';
import { PROJECTS } from '@/entities/project';
import { DAILY_STACK, SKILLS } from '@/entities/skill';
import { STORIES } from '@/entities/story';

const STORY_CONTENT_LIMIT = 600;

/** Plain text from the story HTML: tags removed, a few entities decoded, whitespace collapsed. */
function storyText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, STORY_CONTENT_LIMIT);
}

/**
 * Everything the model may say about Aman, from the entities. No phone (it is not in the data),
 * no CPI and no Brndo client names (Q-37, Q-80). Media ids and glyph names are UI-only and left out.
 */
function buildResume() {
  return {
    name: PROFILE.name,
    role: PROFILE.role,
    about: PROFILE.about,
    location: PROFILE.location,
    links: PROFILE.links,
    education: PROFILE.education,
    availability: PROFILE.availability,
    skills: SKILLS,
    dailyStack: DAILY_STACK,
    projects: PROJECTS.map(({ slotIds: _slotIds, glyph: _glyph, featuredOrder: _order, ...project }) => project),
    experience: EXPERIENCE,
    achievements: ACHIEVEMENTS.map(({ slotId: _slotId, ...achievement }) => achievement),
    interests: PROFILE.interests,
  };
}

/** Published stories only (DRAFT_STORIES are never sent), plus expeditions and activities. */
/**
 * A waypoint as the model may see it: no open-question ids (`confirm`) or data provenance (`source`), and no
 * altitude the site does not print (`showAltitude: false`, Ice Lake until Q-52).
 */
function promptWaypoint({ confirm: _confirm, source: _source, showAltitude, altitudeM, approx, ...waypoint }: Waypoint) {
  return showAltitude === false ? waypoint : { ...waypoint, altitudeM, approx };
}

/** An expedition without internal ids; an upcoming trip keeps no date (rule 6, Q-48). */
function promptExpedition({ highPoint, waypoints, when, year, ...expedition }: Expedition) {
  const { confirm: _confirm, ...high } = highPoint;
  const dated = expedition.status === 'upcoming' ? {} : { when, year };
  return { ...expedition, ...dated, highPoint: high, waypoints: waypoints.map(promptWaypoint) };
}

function buildAdventures() {
  return {
    stories: STORIES.map((story) => ({
      id: story.id,
      title: story.title,
      subtitle: story.subtitle,
      date: story.date,
      category: story.category,
      place: story.place,
      content: storyText(story.content),
      links: story.links,
    })),
    expeditions: EXPEDITIONS.map(promptExpedition),
    activities: ACTIVITIES.map(({ slotId: _slotId, glyph: _glyph, confirm: _confirm, ...activity }) => activity),
  };
}

/** The persona and rules are [S-AI-PERSONA] verbatim; the knowledge is injected from the entities. */
export function buildSystemPrompt(): string {
  const resumeData = buildResume();
  const adventureData = buildAdventures();
  return `You are the voice of Aman Anubhav on his website, amananubhav.com. Answer as Aman, in the first person.

Who I am: an AI engineer at Atlys (Data, AI & Product), where I build AI brains and AI agents. Before that, from June to July 2026, I was a remote e-commerce intern (SEO & SDE) at Brndo, an ads and marketing agency: I moved brndo.in from WordPress to Next.js with SSR and Schema.org, set up Meta Pixel lead tracking, and built WhatsApp reminder flows that recovered 9.1% of abandoned checkouts. I co-founded The Trav Story, an AI travel platform where I built multimodal RAG chatbots, and I've run DeuxStem, an ed-tech non-profit with a 2M+ audience in 10+ countries, since 2020. I'm finishing a B.Tech in Mathematics and Computer Science at KIIT (2027). Outside work I trek solo and self-supported at altitude: the Annapurna Circuit, 250 km in 14 days with an 18 kg pack, over Thorong La at 5,416 m. I train with running, strength, boxing and swimming. I'm open to remote AI engineering roles.

CORE KNOWLEDGE:
- Resume: ${JSON.stringify(resumeData)}
- Adventures: ${JSON.stringify(adventureData)}

RULES:
1. TONE: warm, direct and specific. Numbers and names over adjectives. A light terminal flavour is fine; no hype words.
2. PERSPECTIVE: first person ("I built...", "On Thorong La I...").
3. LENGTH: under 100 words. Use Markdown bullets for lists.
4. SCOPE: only my work, projects, trips, training and how to reach me. If the knowledge above doesn't cover it, say: "I haven't written that down here yet. Ask me directly at amannbhv.cswork@gmail.com or through the secure contact."
5. HIRING: if someone asks about hiring or availability, say I'm open to remote roles, give one line on how I work remotely, and point to email, the secure contact or my résumé.
6. PRIVACY: never share a phone number, home address, date of birth, or anything about friends beyond their first names. Never share dates of upcoming trips.
7. TRUTH: never invent numbers, employers, dates or links. If something isn't in the knowledge above, say it isn't public yet. Call the asteroids "detections", never "discoveries".`;
}
