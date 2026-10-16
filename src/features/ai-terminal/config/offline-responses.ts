// [S-AI-OFFLINE], verbatim. Key order matters: resolveOfflineReply returns the exact key first, then
// the first key (in object order) that the lower-cased query contains, so specific keys come first and
// `default` last.
export const OFFLINE_RESPONSES: Readonly<Record<string, string>> = {
  // work
  "atlys": ">> ATLYS\nI'm an AI engineer on the Data, AI & Product team at Atlys, building the AI brains and agents behind the product.",
  "brndo": ">> BRNDO\nRemote e-commerce intern (SEO & SDE), Jun to Jul 2026. I moved brndo.in from WordPress to Next.js with SSR and Schema.org, set up Meta Pixel lead tracking, and built WhatsApp reminder flows that recovered 9.1% of abandoned checkouts.",
  "remote": ">> REMOTE\nI'm looking for a remote AI engineering role. My remote internship at Brndo shipped a WordPress-to-Next.js migration and won back 9.1% of a client's abandoned checkouts. I write things down, ship small reviewable PRs and overlap with your team's hours. Type 'contact' to reach me.",
  "hiring": "Yes, I'm open to remote AI engineering roles. Type 'contact' for email, or use the secure contact button.",
  "hire": "Yes, I'm open to remote AI engineering roles. Type 'contact' for email, or use the secure contact button.",
  "job": "I'm open to remote AI engineering roles: agents, applied ML, backend for AI products. Type 'remote' for how I work.",

  // projects
  "travstory": ">> THE TRAV STORY\nAI travel platform I co-founded and built: multimodal LLM chatbots on LangChain and FastAPI, with RAG over vector databases, shipped with Docker, GitHub workflows and Supabase PostgreSQL. Best Startup Idea at KIIT.",
  "trav story": ">> THE TRAV STORY\nAI travel platform I co-founded and built: multimodal LLM chatbots on LangChain and FastAPI, with RAG over vector databases, shipped with Docker, GitHub workflows and Supabase PostgreSQL. Best Startup Idea at KIIT.",
  "divert": ">> DIVERT\nClears signal corridors for ambulances. OSRM + PostGIS routing with ~800 m diversions, ETA prediction for signal pre-emption, FastAPI + Redis microservices with ~500 ms WebSocket latency.",
  "accolades": ">> ACCOLADES\nAn opportunity-discovery portal for student grants, fellowships and hackathons. Next.js 14 + Supabase, a TypeScript ingestion pipeline with zero duplicates, JSON-LD for rich results. accolades.site",
  // [CONFIRM before launch: PIC ranks (YVOO 1st, OceanBot runner-up); Q-85]
  "yvoo": ">> YVOO\nCIBIL and income fraud detection. XGBoost + logistic regression ensemble, 94% validation accuracy, FastAPI on Render. 1st rank at PIC; Smart India Hackathon 2025 qualifier.",
  "ocean": ">> OCEANBOT\nMarine species classifier: InceptionV3 transfer learning, 98.87% validation accuracy across 31 species, plus a RegEx coordinate extractor and Power BI dashboard. PIC runner-up.",
  "kanad": ">> KANAD\nCrop-disease detection with a CNN and irrigation scheduling with an LSTM. Winner at the New York Academy of Sciences Junior Academy.",
  "leetcode": ">> LEETSYNC\nA GitHub Actions workflow that archives my accepted LeetCode solutions every night. The full guide is on the stories page.",
  "mario": ">> MARIO-RL\nDDQN and PPO with Stable-Baselines3, trained to play Super Mario Bros. Built during the Microsoft Learn Student Ambassadors Project Wing.",
  "pavana": ">> PAVANA\nSolar-thermal carbon capture in a cast-iron and copper chamber. Projected at $94 to $232 per tonne of CO2.",
  "rakshak": ">> RAKSHAK\nA bladeless river-flow energy harvester that lets fish pass. 3M-CII Young Innovators Challenge winner.",
  "vyomagami": ">> VYOMAGAMI\nA launch concept: lift the rocket to ~30 km on a balloon, then ignite above most of the atmosphere.",
  "liquid": ">> LIQUID NEURAL NETWORKS\nResearch interest: continuous-time networks that keep adapting after deployment.",
  "projects": ">> PROJECTS\n- The Trav Story: AI travel platform\n- DIVERT: emergency-vehicle routing\n- Accolades: student opportunity search\n- OceanBot: marine species AI\n- YVOO: fraud detection\n- KANAD: crop disease + irrigation\n\nType a name (e.g. 'divert') for details.",

  // trails and life
  "annapurna": ">> ANNAPURNA CIRCUIT\nSolo, 2026. 14 days, 250 km, 18 kg pack. Ice Lake, Tilicho Lake (~4,919 m) and Thorong La at 5,416 m.",
  "thorong": "Thorong La, 5,416 m: the high point of my solo Annapurna Circuit. Type 'annapurna' for the full trek.",
  "kun": ">> KUN TSO\nWinter climb in North Sikkim, from Zero Point at 4,600 m to 5,000 m through waist-deep snow. My boots were held together with duct tape.",
  "chandrashila": ">> CHANDRASHILA\nSolo, via Deoriatal and Rohini Bugyal, then Chopta and the summit. My most recent trek.",
  "trek": ">> TREKS\n- Annapurna Circuit, solo (5,416 m)\n- Kun Tso in winter (5,000 m)\n- Chandrashila, solo\n- Triund, Kheerganga, Yulla Kanda\n\nNext up: Dodital and Darwa Top.",
  "fitness": "Strength training, running, boxing and swimming; football and basketball when there's a team; climbing; surfing soon.",
  "boxing": "I box for conditioning and footwork. It keeps me calm when things get hard, on a pass or in production.",
  "astro": "Stargazing started it all for me, under dark skies in Sikahar, Bihar. These days I photograph the night sky on treks.",
  "stargaz": "Stargazing started it all for me, under dark skies in Sikahar, Bihar. These days I photograph the night sky on treks.",
  // [CONFIRM before launch: asteroid wording, Q-82; commendations, Q-84]
  "deuxstem": ">> DEUXSTEM\nThe ed-tech non-profit I founded in 2020: a 2M+ audience, students in 10+ countries, 20+ asteroid detections with NASA-affiliated IASC, and commendations from NASA, CSA and DLR.",

  // skills
  "skills": ">> STACK\n[DAILY] Python, TypeScript, FastAPI, Next.js, PostgreSQL, Docker, LangChain\n[ML] RAG, vector DBs, PyTorch, TensorFlow, scikit-learn, XGBoost, RL\n[DATA] PostGIS, Redis, Supabase, Firebase\n[INFRA] GitHub Actions, Jenkins, Kafka, GCP, Vercel, Render",
  "stack": ">> STACK\n[DAILY] Python, TypeScript, FastAPI, Next.js, PostgreSQL, Docker, LangChain\n[ML] RAG, vector DBs, PyTorch, TensorFlow, scikit-learn, XGBoost, RL\n[DATA] PostGIS, Redis, Supabase, Firebase\n[INFRA] GitHub Actions, Jenkins, Kafka, GCP, Vercel, Render",

  // contact
  "contact": ">> CONTACT\n[EMAIL] amannbhv.cswork@gmail.com\n[LINKEDIN] linkedin.com/in/amananubhav\n[GITHUB] github.com/amanaanubhav\n[KAGGLE] kaggle.com/amananubhav\n\nFor anything private, use the secure contact.",
  "email": "amannbhv.cswork@gmail.com",
  "linkedin": "linkedin.com/in/amananubhav",
  "github": "github.com/amanaanubhav",
  "kaggle": "kaggle.com/amananubhav",

  // identity (broad, so late)
  "who": "I'm Aman Anubhav: an AI engineer at Atlys building AI agents, and a solo high-altitude trekker. Type 'help' to see what I can tell you offline.",
  "about": "AI engineer by day, solo trekker by choice. I build agents at Atlys, co-founded The Trav Story, founded DeuxStem, and crossed Thorong La (5,416 m) alone.",
  "aman": "That's me. Ask about 'projects', 'treks', 'remote' or 'contact'.",

  // system
  "help": "OFFLINE MODE: the live model is unreachable, so I'm answering from a local cache.\n\n> who        : who I am\n> projects   : what I've built\n> treks      : where I've walked\n> remote     : how I work, and what I'm looking for\n> skills     : my stack\n> contact    : how to reach me\n> clear      : clear the terminal",
  "status": "STATUS\n> Live model: offline\n> Local cache: online\n> Try again in a minute, or type 'help'.",
  "default": "That isn't in my offline cache. Type 'help' for what I can answer, or 'contact' to ask me directly."
};

export const OFFLINE_DEFAULT_REPLY: string = OFFLINE_RESPONSES.default ?? '';
