import { GoogleGenAI } from "@google/genai";



export type AIVerdict = { isCorrect: boolean; isPartiallyCorrect?: boolean; breakdown: string; raw: string };

export async function verifyWithGemini(userImageUrl: string, questionText: string, modelAnswerUrl: string | null, userStats?: any): Promise<AIVerdict | null> {
    try {
        let studentImagePart: any = undefined;
        try {
            const resp = await fetch(userImageUrl, { signal: AbortSignal.timeout(20000) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuffer = await resp.arrayBuffer();
            let buffer = Buffer.from(arrayBuffer);
            let mimeType = resp.headers.get('content-type') || 'image/jpeg';
            
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) {
                try {
                    const sharp = require('sharp');
                    buffer = await sharp(buffer).png().toBuffer();
                    mimeType = 'image/png';
                } catch (e) {
                    console.warn(`Could not convert image from ${mimeType}`, e);
                }
            }
            
            const base64 = buffer.toString('base64');
            studentImagePart = { inlineData: { data: base64, mimeType } };
        } catch (e: any) {
            console.error("Failed to fetch student image for AI", e);
            throw new Error(`Student image fetch/convert failed: ${e.message}`);
        }

        let teacherImagePart: any = undefined;
        if (modelAnswerUrl) {
            try {
                const resp = await fetch(modelAnswerUrl, { signal: AbortSignal.timeout(20000) });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuffer = await resp.arrayBuffer();
                let buffer = Buffer.from(arrayBuffer);
                let mimeType = resp.headers.get('content-type') || 'image/jpeg';
                
                if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) {
                    try {
                        const sharp = require('sharp');
                        buffer = await sharp(buffer).png().toBuffer();
                        mimeType = 'image/png';
                    } catch (e) {
                        console.warn(`Could not convert image from ${mimeType}`, e);
                    }
                }

                const base64 = buffer.toString('base64');
                teacherImagePart = { inlineData: { data: base64, mimeType } };
            } catch (e: any) {
                console.error("Failed to fetch teacher image for AI", e);
                throw new Error(`Teacher image fetch/convert failed: ${e.message}`);
            }
        }

        const prompt = `You are a strict but encouraging teacher grading a student's handwritten answer according to formal board examination patterns (e.g., CBSE/ICSE step-marking).
Question Text: ${questionText}
${teacherImagePart ? "Teacher's Model Answer is provided as an image reference. " : ""}
Student's Answer is provided as an image.
${userStats ? `Context about this student: They have ${userStats.totalPoints || 0} points and have won ${userStats.battlesWon || 0} battles. Tailor your encouragement level accordingly.` : ""}

Task:
Determine if the student's actual final answer is correct and evaluate their steps. They do not need to perfectly show every step exactly as the teacher if their main conclusion and technique are right, but for full points, the logic must be sound.
IMPORTANT LIMITATION: Do not blindly fail a student for using alternative math formulas or different problem-solving techniques. Check their work intelligently to see if it is mathematically and logically sound on its own merit.
CRITICAL CHEAT DETECTION: Check if the student's image is a screenshot (e.g., showing a mobile UI, status bar, or digital text) or a photograph of a digital screen instead of handwritten work. If it is a screenshot or a photo of a screen, you MUST mark it as "wrong" and explicitly state that uploading screenshots/digital text is considered cheating and unfair means.

Grading Rules:
- "correct": The answer is completely right and logically sound. (Full points)
- "partially_correct": The student has the right approach or most of the steps right, but made a calculation error, missed a final unit, or left it incomplete. (Half points)
- "wrong": The approach is fundamentally flawed, the answer is completely incorrect, or they cheated (screenshot). (Penalty)

Respond ONLY with a valid JSON object matching this schema (no markdown formatting):
{
  "verdict": "correct", "partially_correct", or "wrong",
  "breakdown": "A clear, encouraging 3-4 sentence explanation addressing the student directly. Explain exactly where their math/logic fails, or why it was graded correctly/partially. If wrong, show the correction in a corrected way. If they cheated by using a screenshot, firmly explain that unfair means are not allowed."
}`;

        const contents = [];
        // All parts in GenAI v1 must be objects (e.g. { text: "..." })
        contents.push({ text: prompt });
        if (teacherImagePart) contents.push(teacherImagePart);
        if (studentImagePart) contents.push(studentImagePart);

        const GEMINI_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "";
        if (!GEMINI_KEY) {
            console.error("Gemini AI not initialized (missing API key)");
            throw new Error("Gemini API Key missing! Check your Vercel Environment Variables and trigger a fresh deploy.");
        }
        const client = new GoogleGenAI({ apiKey: GEMINI_KEY });

        // Use the new Google GenAI SDK v1 syntax: ai.models.generateContent
        const response = await client.models.generateContent({
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
            isPartiallyCorrect: json.verdict?.toLowerCase() === "partially_correct",
            breakdown: json.breakdown || "No detailed breakdown was provided.",
            raw: text
        };
    } catch (err: any) {
        console.error("Gemini Verification Error:", err);
        throw new Error(err.message || "Gemini Verification Error");
    }
}
