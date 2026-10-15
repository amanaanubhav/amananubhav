import type { Project } from './types';

export const PROJECTS: readonly Project[] = [
  {
    id: "p1",
    featured: true,
    title: "DIVERT",
    type: "AI-Driven Traffic Preemption System",
    tech: ["FastAPI", "XGBoost", "PostGIS", "Docker", "Redis", "OSRM"],
    desc: "Engineered OSRM and PostGIS routing, automating 800m diversions for efficient routing. Implemented Random Forest pipelines predicting dynamic ETAs. Orchestrated Dockerized FastAPI and Redis microservices, achieving 500ms WebSocket latency for tracking.",
    link: "https://github.com/amanaanubhav",
    year: "Dec 2025 - Apr 2026"
  },
  {
    id: "p2",
    featured: true,
    title: "Accolades",
    type: "Opportunity Discovery Portal",
    tech: ["Next.js 14", "Supabase", "PostgreSQL", "TypeScript"],
    desc: "Architected hybrid-rendered application optimizing initial load speeds via SSR. Engineered an automated TypeScript data ingestion pipeline to upsert JSON records. Maximized organic SEO by implementing dynamic Open Graph metadata and automated XML sitemaps.",
    link: "https://github.com/amanaanubhav",
    year: "Dec 2025 - Present"
  },
  {
    id: "p3",
    featured: true,
    title: "YVOO",
    type: "CIBIL & Income Fraud Detection",
    tech: ["XGBoost", "LogReg", "EDA", "FastAPI", "Docker", "React", "PostgreSQL"],
    desc: "AI-driven credit intelligence platform. Engineered ML ensemble using XGBoost and LogReg with 94% validation accuracy. Synthesized artificial behavioral datasets. Deployed Dockerized ML models via Render. Qualified for Smart India Hackathon 2025.",
    link: "https://github.com/amanaanubhav/YVOO",
    year: "Sep 2025 - Dec 2025"
  },
  {
    id: "p4",
    featured: true,
    title: "OceanBot",
    type: "Marine Intelligence Platform",
    tech: ["InceptionV3", "RegEx", "Power BI", "TensorFlow", "NLP"],
    desc: "Marine life classification system achieving 98.87% accuracy across 31 species using transfer learning on InceptionV3. Developed custom head with L2 regularization and Dropout. Integrated 15+ RegEx based language processor for coordinate extraction and a Power BI dashboard. PIC conference runner up.",
    link: "https://www.kaggle.com/code/amananubhav/marine-ai",
    year: "Jul 2025 - Sep 2025"
  },
  {
    id: "p5",
    title: "PAVANA",
    type: "Climate Tech",
    tech: ["Thermodynamics", "CAD", "Simulation"],
    desc: "Solar-powered carbon capture system design capable of removing 90% atmospheric CO2 at reduced costs ($94-232/ton). Features novel gradient composite metal chambers.",
    link: "https://github.com/amanaanubhav",
    year: "2020 - Present"
  },
  {
    id: "p6",
    featured: true,
    title: "Mario-RL",
    type: "Autonomous Agent",
    tech: ["DDQN", "PPO", "Reinforcement Learning", "Stable-Baselines3"],
    desc: "Autonomous agent trained to master Super Mario Bros using deep reinforcement learning. Implemented RL-based DQN and PPO algorithms via Stable-Baselines3. Applied principles of autonomous decision-making to production AI systems.",
    link: "https://github.com/amanaanubhav/Mario-RL",
    year: "2023 - 2024"
  },
  {
    id: "p7",
    title: "RAKSHAK",
    type: "Clean Energy",
    tech: ["Fluid Dynamics", "Eco-Design"],
    desc: "Wildlife-friendly river-flow energy harvester achieving ~98% efficiency without traditional turbine blades. Winner of 3M-CII Young Innovators Challenge Award.",
    link: "https://github.com/amanaanubhav",
    year: "2021 - 2022"
  },
  {
    id: "p8",
    title: "Liquid Neural Networks",
    type: "AI Research",
    tech: ["ODEs", "Continuous-Time RNNs"],
    desc: "Investigating continuous-time recurrent neural networks for adaptive AI systems in robotics and edge computing that adapt post-deployment without retraining.",
    link: "https://github.com/amanaanubhav",
    year: "Active"
  },
  {
    id: "p9",
    title: "VYOMAGAMI",
    type: "Aerospace",
    tech: ["Physics Simulation", "Concept Design"],
    desc: "Hybrid balloon-rocket satellite launch system reducing deployment costs by 60-70% through novel atmospheric resistance minimization.",
    link: "https://github.com/amanaanubhav",
    year: "Research Phase"
  }
];
