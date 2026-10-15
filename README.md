>_ AMAN ANUBHAV // AI RESEARCHER / ENGINEER

🚀 Modern Portfolio V5: Cyber-Aesthetic Interactive Showcase

This repository hosts the code for my personal portfolio, designed to showcase advanced engineering skills, not just static credentials. The site features high-performance UI/UX, client-side encryption, and a custom hybrid AI terminal built using React and the Gemini API.

Live Demo: [Insert Vercel Deployment Link Here]

I. Technical Core & Featured Systems

The portfolio is built on a foundation of performance and security, demonstrating proficiency in MLOps concepts, complex data visualization, and cryptographic implementations.

1. The Interactive Hero Section (E2E & Performance)

The unique landing page combines advanced visual effects with minimal performance impact.

Cyber-Aesthetic Lens: Uses CSS masking (maskImage) over two high-contrast layers to create a "magnifying glass" or "X-ray" effect. Moving the cursor inverts the colors, revealing the hidden, high-contrast text.

Wireframe Tunnel Animation: The background features a custom HTML5 Canvas animation depicting an infinitely deep, swirling "Spider-Web" tunnel. High-speed light bursts travel from the center outwards, simulating intense data transmission and providing a futuristic, dark-space feel.

Smart Scroll: The Navbar implements a custom scroll handler that hides the bar when scrolling down and reveals it instantly when scrolling up, optimizing screen space for content.

2. Secure Vault: Dual-Channel Encrypted Ledger

The Secure Vault is a demonstration of client-side cryptography, proving proficiency in secure data handling and encryption protocols.

Feature

Role / Technology Demonstrated

Security Model

Login/Registration

PBKDF2 Hashing: Password hashing for storage and verification.

Key Derivation

User Messaging

Dual Encryption (AES-256 GCM): Every message is encrypted twice before hitting the database.

E2EE + Escrow

User Privacy

User can only decrypt their own sent messages (userPayload field). Other users see encrypted ciphertext.

Privacy Guarantee

Admin Oversight

Admin (credentials below) can decrypt all messages using a Shared Admin Key (via adminPayload), creating a secure support channel for monitoring/audit.

Secure Channel to Admin

Admin Tools

Admin can NUKE CHAIN, prune individual blocks, and manage user status (block/delete).

Data Governance

Admin Access (For Testing/Audit):

Username: amananubhav

Password: youcantguess

3. Neural Link AI Terminal (Hybrid Chatbot)

This feature demonstrates robust MLOps practices by implementing a tiered fallback system to ensure the user always receives an answer, even if the primary API is offline.

Hybrid Tiers: The terminal first checks local commands (help, bio), then attempts to fetch a response from the Gemini API (using gemini-1.5-flash), and finally falls back to a Local Keyword-Matching Bot if the API fails or is unavailable.

Contextual Reasoning: The Gemini model is supplied with the entire RESUME JSON object as systemInstruction context, allowing it to answer deep, specific questions about projects like YVOO, Liquid Neural Networks, and PAVANA.

Custom Identity: The AI adopts a "sophisticated, slightly cyberpunk AI assistant" persona.

II. Development & Contribution

My Work & Philosophy

My philosophy is centered on being a "Genetically Engineered Learner"—I didn't inherit talent; I built it through obsessive curiosity and implementing knowledge to solve real-world problems (like Climate Tech, FinTech, and AI agents). This portfolio is the physical manifestation of that process.

Project Focus: Bridging the gap between research (LNNs) and production (YVOO, Mario-RL).

Contribution: I designed and implemented 100% of the React components, cryptographic logic, state management, and the custom canvas animations.

Future Concepts (Roadmap)

Full ECDH Key Exchange: Upgrade the Secure Vault from symmetric shared-secret to an Asymmetric (Public Key Infrastructure) model for true cryptographic integrity, requiring users to manage their own key pairs.

MLOps Monitoring: Integrate real-time project metrics (e.g., YVOO model drift data, PAVANA simulation results) into the Terminal or a dedicated dashboard section.

III. Local Setup & Deployment

The site is a Next.js 16 (App Router) app written in TypeScript and organised with Feature-Sliced Design. See docs/ARCHITECTURE.md for the layer layout and conventions.

Prerequisites

- Node.js 20.9 or newer, and npm.
- A Firebase project with Firestore and Anonymous Auth enabled (visitor chat, secure vault, admin inbox).
- An EmailJS account (chat notifications).
- An OpenRouter API key (AI terminal; default model openai/gpt-oss-120b, change it with OPENROUTER_MODEL).

Installation

    npm install

Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on http://localhost:3000 |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript) |
| `npm run lint:fsd` | Steiger FSD architecture lint over `./src` |
| `npm run typecheck` | `tsc --noEmit` |

Configuration

Create `.env.local` in the repo root (it is gitignored). Client variables must use the `NEXT_PUBLIC_` prefix:

    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=
    NEXT_PUBLIC_EMAILJS_SERVICE_ID=
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_AMAN=
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_VISITOR=
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
    OPENROUTER_API_KEY=      # server-only, read by the /api/chat edge route
    OPENROUTER_MODEL=        # optional, any OpenRouter model id (default openai/gpt-oss-120b)

Legacy names keep working. `next.config.ts` maps the old Vite names onto the `NEXT_PUBLIC_*` names at build time when the new name is not set, so existing `.env` / `.env.local` files and Vercel project variables need no change:

- `VITE_FIREBASE_API_KEY` or `VITE_FIREBASE_API`
- `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET` or `VITE_FIREBASE_STORAGE`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` or `VITE_FIREBASE_MESSAGING`
- `VITE_FIREBASE_APP_ID` or `VITE_FIREBASE_APP`
- `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID_TO_AMAN`, `VITE_EMAILJS_TEMPLATE_ID_TO_VISITOR`, `VITE_EMAILJS_PUBLIC_KEY`

`OPENROUTER_API_KEY` is never exposed to the browser. Client values are inlined at build time, so rebuild after changing them.

Run Development Server

    npm run dev

Deployment (Vercel)

`vercel.json` is `{"framework": "nextjs"}`, so Vercel uses its standard Next.js build (`next build`) with no custom output directory.

1. Import the repository in Vercel (framework preset: Next.js).
2. Add the environment variables above (either the `NEXT_PUBLIC_*` names or the legacy `VITE_*` names, plus `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`) for Production and Preview.
3. Deploy. `/api/chat` runs on the Edge runtime; `robots.txt` and `sitemap.xml` are generated from `app/robots.ts` and `app/sitemap.ts`.
