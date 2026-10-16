import type { SkillGroups } from './types';

/**
 * [S-SKILLS]: the five keys, without the items marked `*` in the deck (Rust, LNN, Flask, MongoDB,
 * Linux, Kubernetes, AWS and Azure stay out until Q-22).
 */
export const SKILLS: SkillGroups = {
  languages: ['Python', 'TypeScript', 'SQL', 'C/C++', 'JavaScript'],
  ai_ml: [
    'AI agents',
    'LangChain',
    'RAG and vector databases',
    'PyTorch',
    'TensorFlow',
    'scikit-learn',
    'XGBoost',
    'CNNs and LSTMs',
    'Transfer learning (InceptionV3)',
    'Reinforcement learning (DQN, PPO, Stable-Baselines3)',
    'Pandas and EDA',
  ],
  full_stack: [
    'FastAPI',
    'Next.js',
    'React',
    'Node.js',
    'PostgreSQL',
    'PostGIS',
    'Redis',
    'Supabase',
    'Firebase',
    'WebSockets',
    'OSRM',
    'Tailwind CSS',
    'Framer Motion',
    'Shopify Liquid',
  ],
  cloud_devops: ['Docker', 'GitHub Actions and CI/CD', 'YAML', 'Kafka', 'Jenkins', 'GCP', 'Vercel', 'Render', 'MLOps'],
  tools: [
    'Git and GitHub',
    'Claude Code',
    'NotebookLM',
    'Google AI Studio',
    'Power BI',
    'LaTeX',
    'Kaggle',
    'Google Colab',
    'VS Code',
    'Figma',
    'Meta Pixel',
    'Google Tag Manager',
    'Zoho CRM',
  ],
};

/** The tools I use every day (the bold first row of the stack). */
export const DAILY_STACK = ['Python', 'TypeScript', 'FastAPI', 'Next.js', 'PostgreSQL', 'Docker', 'LangChain'] as const;
