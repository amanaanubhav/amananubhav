import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { userQuery, resumeData, adventureData } = await req.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        const result = await model.generateContentStream(userQuery);

        // Create a readable stream from the async generator
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(encoder.encode(chunkText));
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error("Gemini Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}