import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

// DELETE /api/admin/delete-written-questions
// Deletes all written questions (no options/correct_option) and their storage images.
// Only callable by a teacher account — add extra auth if needed.
export async function DELETE(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must be a teacher
        const meta = user.user_metadata || {};
        if (!meta.isTeacher) return NextResponse.json({ error: "Forbidden — teachers only" }, { status: 403 });

        // 1. Fetch all written questions (options IS NULL = written type)
        const { data: writtenQs, error: fetchErr } = await supabaseAdmin
            .from("questions")
            .select("id, image_path")
            .is("options", null)     // written questions have no options
            .is("correct_option", null);

        if (fetchErr) throw new Error(fetchErr.message);
        if (!writtenQs || writtenQs.length === 0) {
            return NextResponse.json({ success: true, deleted: 0, message: "No written questions found." });
        }

        const ids = writtenQs.map((q: any) => q.id);
        const imagePaths = writtenQs
            .map((q: any) => q.image_path)
            .filter(Boolean) as string[];

        // 2. Delete related written_submissions first (FK constraint)
        await supabaseAdmin
            .from("written_submissions")
            .delete()
            .in("question_id", ids);

        // 3. Delete question_attempts for these questions
        await supabaseAdmin
            .from("question_attempts")
            .delete()
            .in("question_id", ids);

        // 4. Delete the questions themselves
        const { error: delErr } = await supabaseAdmin
            .from("questions")
            .delete()
            .in("id", ids);

        if (delErr) throw new Error(delErr.message);

        // 5. Delete storage images in batches of 100
        if (imagePaths.length > 0) {
            const BATCH = 100;
            for (let i = 0; i < imagePaths.length; i += BATCH) {
                const batch = imagePaths.slice(i, i + BATCH);
                try {
                    await supabaseAdmin.storage.from("question-images").remove(batch);
                } catch (e) {
                    console.warn("[delete-written] Storage batch delete failed:", e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            deleted: ids.length,
            imagesDeleted: imagePaths.length,
            message: `Deleted ${ids.length} written question(s) and ${imagePaths.length} image(s).`,
        });
    } catch (err: any) {
        console.error("[delete-written-questions]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
