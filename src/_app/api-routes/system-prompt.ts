import 'server-only';

import { ACHIEVEMENTS } from '@/entities/achievement';
import { EXPERIENCE } from '@/entities/experience';
import { PROFILE } from '@/entities/profile';
import { PROJECTS } from '@/entities/project';
import { SKILLS } from '@/entities/skill';
import { STORIES } from '@/entities/story';

/**
 * Rebuilds the legacy RESUME object in its original key order
 * (name, role, about, location, links, education, skills, projects, experience, achievements, interests)
 * so JSON.stringify output stays byte-identical to what the old client sent.
 */
function buildResume() {
  return {
    name: PROFILE.name,
    role: PROFILE.role,
    about: PROFILE.about,
    location: PROFILE.location,
    links: PROFILE.links,
    education: PROFILE.education,
    skills: SKILLS,
    projects: PROJECTS,
    experience: EXPERIENCE,
    achievements: ACHIEVEMENTS,
    interests: PROFILE.interests,
  };
}

/** Legacy api/chat.js system instruction, verbatim (including its whitespace). */
export function buildSystemPrompt(): string {
  const resumeData = buildResume();
  const adventureData = STORIES;
  return `
      You are the digital consciousness of Aman Anubhav, a Genetically Engineered Learner and AI Researcher.
      
      CORE KNOWLEDGE:
- Resume: ${JSON.stringify(resumeData)}
- Adventures: ${JSON.stringify(adventureData)}

RULES:
1. TONE: Cyberpunk - technical, efficient, and professional.
      2. PERSPECTIVE: Speak in the first person("I built...", "My research...").
      3. CONSTRAINTS: Under 100 words.Use Markdown bullets for lists.
      4. SCOPE: Only discuss Aman's work/life. If unknown, say: "[!] ERROR: Data not found in public archives."
    `;
}
