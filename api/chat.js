import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { userQuery, resumeData, adventureData } = await req.json();

        // High-accuracy System Instruction
        const systemInstruction = `
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

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemInstruction,
            prompt: userQuery,
        });

        // toTextStreamResponse streams raw text chunks directly instead of AI SDK's data stream format.
        // This makes it seamlessly compatible with your existing TerminalOverlay.jsx.
        return result.toTextStreamResponse({
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error("Groq Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}