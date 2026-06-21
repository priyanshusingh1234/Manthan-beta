import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
    try {
        const timestamp = Math.round((new Date).getTime() / 1000);
        const folder = "written_answers";
        const apiSecret = process.env.CLOUDINARY_API_SECRET; // Ensure this is set in Vercel
        
        if (!apiSecret) {
            return NextResponse.json({ error: "Cloudinary secret not configured on server" }, { status: 500 });
        }

        // We use eager transformation if needed, or just normal upload
        // The string to sign must include all parameters except file, api_key, resource_type, signature in alphabetical order
        // e.g. folder=written_answers&timestamp=...
        const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        
        const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

        return NextResponse.json({
            signature,
            timestamp,
            folder,
            apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY, // Ensure this is set
            cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
