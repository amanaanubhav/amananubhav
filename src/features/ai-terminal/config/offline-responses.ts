// --- LOCAL KNOWLEDGE BASE ---
// Key order matters: the fuzzy fallback returns the first key contained in the query.
export const OFFLINE_RESPONSES: Readonly<Record<string, string>> = {
  // core
  "who": "Aman Anubhav is a Genetically Engineered Learner, AI Researcher & Engineer. He builds advanced AI systems and sustainable tech.",
  "about": "Aman is an explorer of the digital and physical frontiers, specializing in MLOps, Liquid Neural Networks, and decentralized systems.",
  "aman": "That's me. I'm a Genetically Engineered Learner focused on AI, MLOps, and Climate Tech.",

  // projects
  "projects": "ACCESSING PROJECT ARCHIVES...\n\n1. [YVOO] - AI Credit Intelligence\n2. [PAVANA] - Carbon Capture Tech\n3. [RAKSHAK] - River Energy Harvester\n4. [LIQUID] - Neural Network Research\n\nType a project name (e.g., 'yvoo') for details.",
  "yvoo": ">> YVOO\nStatus: Deployed\nStack: Python, ML, React\n\nAn AI-driven credit intelligence platform achieving 90%+ accuracy in credit scoring using ensemble learning algorithms.",
  "pavana": ">> PAVANA\nStatus: Prototype\nTech: Material Science, Solar\n\nA solar-powered carbon capture system utilizing novel gradient composite metal chambers for maximized efficiency.",
  "rakshak": ">> RAKSHAK\nStatus: Research\nFocus: Clean Energy, Ecology\n\nA wildlife-friendly river-flow energy harvester designed to generate power without disrupting aquatic migration paths.",
  "liquid": ">> LIQUID NEURAL NETWORKS\nStatus: Ongoing Research\nFocus: Adaptive AI\n\nResearching continuous-time recurrent neural networks that adapt to dynamic environments in real-time.",

  // contact
  "contact": "UPLINK CHANNELS:\n\n[EMAIL] amannbhv.cswork@gmail.com\n[LINKEDIN] linkedin.com/in/aman-anubhav\n[GITHUB] github.com/aman-anubhav",
  "email": "amannbhv.cswork@gmail.com",
  "linkedin": "Signal detected: linkedin.com/in/aman-anubhav",
  "github": "Repo located: github.com/aman-anubhav",

  // skills
  "skills": "NEURAL SKILL TREE:\n\n[LANGUAGES] Python, JavaScript, C++, Rust\n[AI/ML] PyTorch, TensorFlow, Scikit-learn, LangChain\n[WEB] React, Next.js, Node.js, Tailwind\n[CLOUD] AWS, Google Cloud, Docker, Kubernetes",

  // system
  "help": "SYSTEM COMMANDS [OFFLINE MODE]:\n\n> who       : Identity verification\n> projects  : List major initiatives\n> skills    : Technical capabilities\n> contact   : Communication channels\n> clear     : Purge terminal logs\n\n[PROJECT SHORTCUTS]\n> yvoo, pavana, rakshak, liquid",
  "status": "SYSTEM REPORT:\n> Uplink: OFFLINE\n> Local Core: ONLINE\n> Integrity: 100%",
  "default": "Command not recognized in Local Cache. Type 'help' for available offline commands."
};

export const OFFLINE_DEFAULT_REPLY: string = OFFLINE_RESPONSES.default ?? '';
