import { GoogleGenAI } from "@google/genai";

const GEMINI_KEY = process.env.GOOGLE_GENAI_API_KEY || "";
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export type AIVerdict = { isCorrect: boolean; breakdown: string; raw: string };

export async function verifyWithGemini(userImageUrl: string, questionText: string, modelAnswerUrl: string | null): Promise<AIVerdict | null> {
    try {
        let studentImagePart: any = undefined;
        try {
            const resp = await fetch(userImageUrl, { signal: AbortSignal.timeout(20000) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuffer = await resp.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = resp.headers.get('content-type') || 'image/jpeg';
            studentImagePart = { inlineData: { data: base64, mimeType } };
        } catch (e) {
            console.error("Failed to fetch student image for AI", e);
            return null;
        }

        let teacherImagePart: any = undefined;
        if (modelAnswerUrl) {
            try {
                const resp = await fetch(modelAnswerUrl, { signal: AbortSignal.timeout(20000) });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuffer = await resp.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = resp.headers.get('content-type') || 'image/jpeg';
                teacherImagePart = { inlineData: { data: base64, mimeType } };
            } catch (e) {
                console.error("Failed to fetch teacher image for AI", e);
            }
        }

        const prompt = `You are a teacher grading a student's answer. 
Question Text: ${questionText}
${teacherImagePart ? "Teacher's Model Answer is provided as an image reference. " : ""}
Student's Answer is provided as an image.

Task:
Determine if the student's actual final answer is correct. They do not need to perfectly show every step exactly as the teacher if their main conclusion and technique are right. 
IMPORTANT LIMITATION: Do not blindly fail a student for using alternative math formulas or different problem-solving techniques. Check their work intelligently to see if it is mathematically and logically sound on its own merit.

Respond ONLY with a valid JSON object matching this schema (no markdown formatting):
{
  "verdict": "correct" or "wrong",
  "breakdown": "A clear, encouraging 3-4 sentence explanation addressing the student directly. Explain exactly where their math/logic fails, or why it was graded correctly despite using a different format."
}`;

        const contents = [];
        // All parts in GenAI v1 must be objects (e.g. { text: "..." })
        contents.push({ text: prompt });
        if (teacherImagePart) contents.push(teacherImagePart);
        if (studentImagePart) contents.push(studentImagePart);

        if (!ai) {
            console.error("Gemini AI not initialized (missing API key)");
            return null;
        }

        // Use the new Google GenAI SDK v1 syntax: ai.models.generateContent
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: contents }],
            config: {
                responseMimeType: "application/json",
            }
        });

        let text = response.text || "{}";
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const json = JSON.parse(text);

        return {
            isCorrect: json.verdict?.toLowerCase() === "correct",
            breakdown: json.breakdown || "No detailed breakdown was provided.",
            raw: text
        };
    } catch (err) {
        console.error("Gemini Verification Error:", err);
        return null; // Fatal error
    }
}
