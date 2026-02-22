import supabaseAdmin from "@/lib/supabaseAdmin";
import SolveQuestionClient from "./SolveQuestionClient";
import WrittenSolveClient from "@/components/WrittenSolveClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SolveQuestionPage({
    params
}: {
    params: { id: string }
}) {
    const { id } = params;

    const { data: q, error } = await supabaseAdmin
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !q) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-slate-500">
                Question not found.
            </div>
        );
    }

    // Fetch the teacher metadata
    let teacherMetadata: any = {};
    if (q.created_by) {
        try {
            const { data: userData, error: uErr } = await supabaseAdmin.auth.admin.getUserById(q.created_by);
            if (!uErr && userData?.user) {
                teacherMetadata = userData.user.user_metadata || {};
            }
        } catch (err) {
            console.warn('Failed to fetch teacher metadata', err);
        }
    }

    const clientQuestion = {
        ...q,
        teacherName: teacherMetadata.fullName || teacherMetadata.full_name || teacherMetadata.name || "Teacher",
        teacherUsername: teacherMetadata.username || null,
        teacherAvatar: teacherMetadata.avatar_url || teacherMetadata.avatar || null,
    };

    // ── Route to written answer flow for high-point questions ──
    const isWrittenQuestion = (q.points || 0) > 15;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 py-10 px-4 flex flex-col items-center">
            <div className="w-full max-w-3xl">
                {isWrittenQuestion ? (
                    <WrittenSolveClient question={clientQuestion} />
                ) : (
                    <SolveQuestionClient question={clientQuestion} />
                )}
            </div>
        </div>
    );
}
