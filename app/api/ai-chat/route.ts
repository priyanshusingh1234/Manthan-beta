import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { GoogleGenAI } from "@google/genai";
import { AI_HELPER_CONTEXT } from "@/lib/aiHelperContext";

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const userMessage = body.message;

        if (!userMessage) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Fetch User Context
        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        
        // Fetch Chat History
        const { data: historyRows } = await supabaseAdmin
            .from("ai_chat_history")
            .select("role, content")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(20);

        const contents = [];
        const systemInstruction = `${AI_HELPER_CONTEXT}
        
CURRENT USER CONTEXT:
- Name/Username: ${userMeta.full_name || userMeta.username || 'Student'}
- Total Points: ${userMeta.totalPoints || 0}
- Battles Won: ${userMeta.battlesWon || 0}
- Battles Attempted: ${userMeta.battlesAttempted || 0}
`;
        
        if (historyRows && historyRows.length > 0) {
            for (const row of historyRows) {
                contents.push({ role: row.role, parts: [{ text: row.content }] });
            }
        }
        
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const GEMINI_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "";
        if (!GEMINI_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        // Save User Message to DB immediately
        await supabaseAdmin.from("ai_chat_history").insert({
            user_id: userId,
            role: "user",
            content: userMessage
        }).catch(err => console.error("Failed to save user msg:", err));

        const client = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const response = await client.models.generateContent({
            model: "gemini-3.6-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7
            }
        });

        const reply = response.text || "I'm not sure how to respond to that right now, but keep up the great work!";

        // Save Model Reply to DB
        await supabaseAdmin.from("ai_chat_history").insert({
            user_id: userId,
            role: "model",
            content: reply
        }).catch(err => console.error("Failed to save model msg:", err));

        return NextResponse.json({ success: true, reply });
    } catch (err: any) {
        console.error("AI Helper Error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: historyRows, error } = await supabaseAdmin
            .from("ai_chat_history")
            .select("id, role, content, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ success: true, history: historyRows || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
