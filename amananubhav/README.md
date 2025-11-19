# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Aman Anubhav - AI Researcher Portfolio

This is a modern, premium portfolio website built with React, Vite, Tailwind CSS, and Firebase.

🚀 Quick Start (Local Development)

Install Dependencies

npm install


Setup Environment Variables
Ensure you have a .env file in the root directory with your Firebase keys:

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
... (see your .env file)


Run Development Server

npm run dev


Open http://localhost:5173 to see your site.

🏠 Local Hosting (Production Simulation)

To see exactly how your site will look when deployed to the web (optimised and minified):

Build the Project
This compiles your code into the dist/ folder.

npm run build


Preview the Build
This uses Vite's built-in lightweight server.

npm run preview


Run with Custom Node Server (Optional)
If you want to run it as a standalone Node.js app (good for VPS hosting):

npm run serve


Access it at http://localhost:3000.

🌐 Deployment to Vercel (Recommended)

The easiest way to deploy this Vite app is using Vercel.

Option A: Vercel CLI (Fastest)

Install Vercel CLI: npm i -g vercel

Run command: vercel

Follow the prompts (Accept defaults).

Important: Go to your Vercel Dashboard > Settings > Environment Variables and add your Firebase keys there (copy them from your .env file).

Option B: Git Integration (Best Practice)

Push this code to a GitHub repository.

Go to Vercel.com and "Add New Project".

Import your GitHub repository.

Vercel will automatically detect Vite.

Add Environment Variables: before clicking "Deploy", verify you paste the content of your .env file into the Environment Variables section.

Click Deploy.

🛠 Troubleshooting

Blank Screen? Check your browser console (F12). If you see Firebase errors, your .env keys are missing or incorrect.

Styles Missing? Ensure tailwind.config.js exists and src/index.css includes the @tailwind directives.