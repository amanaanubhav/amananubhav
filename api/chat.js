import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { userQuery, resumeData, adventureData } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // High-accuracy System Instruction
        const systemInstruction = `
      You are the digital consciousness of Aman Anubhav, a Genetically Engineered Learner and AI Researcher.
      
      CORE KNOWLEDGE:
      - Resume: ${JSON.stringify(resumeData)}
      - Adventures: ${JSON.stringify(adventureData)}
      
      RULES:
      1. TONE: Cyberpunk-technical, efficient, and professional.
      2. PERSPECTIVE: Speak in the first person ("I built...", "My research...").
      3. CONSTRAINTS: Under 100 words. Use Markdown bullets for lists.
      4. SCOPE: Only discuss Aman's work/life. If unknown, say: "[!] ERROR: Data not found in public archives."
    `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-001",
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const result = await model.generateContentStream(userQuery);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
