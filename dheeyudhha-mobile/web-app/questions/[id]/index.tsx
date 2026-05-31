import type { Metadata } from 'next';
import supabaseAdmin from "@/lib/supabaseAdmin";
import SolveQuestionClient from "./SolveQuestionClient";
import WrittenSolveClient from "@/components/WrittenSolveClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { APP_URL } from '@/lib/appUrl';

export async function generateMetadata({
    params
}: {
    params: { id: string }
}): Promise<Metadata> {
    const { id } = params;
    const { data: q } = await supabaseAdmin
        .from("questions")
        .select("id, title, body, subject, class_grade, points, difficulty, image_url, image_path, question_type")
        .eq("id", id)
        .maybeSingle();

    if (!q) {
        return {
            title: 'Question Not Found | Dheeyudha',
            description: 'This question is not available.',
        };
    }

    const typePrefix = q.question_type === 'match' ? '🧩 Match The Following: ' : '';
    const title = `${typePrefix}${q.title} | Dheeyudha Question`;
    
    const defaultDesc = q.question_type === 'match' 
        ? `Interactive matching puzzle for Class ${q.class_grade || '?'} ${q.subject || ''}. Solve to earn ${q.points || 0} points!` 
        : `Class ${q.class_grade || '?'} ${q.subject || 'Question'} · ${q.points || 0} points`;
        
    const description = (q.body || defaultDesc).toString().slice(0, 160);
    let image = `${APP_URL}/og-social.png`;
    if (q.image_url) {
        image = q.image_url.startsWith('http') ? q.image_url : `${APP_URL}${q.image_url}`;
    } else if (q.image_path) {
        const { data: publicUrlData } = supabaseAdmin.storage.from('question-images').getPublicUrl(q.image_path);
        image = publicUrlData.publicUrl;
    }
    
    const canonical = `${APP_URL}/questions/${id}`;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'Dheeyudha',
            type: 'article',
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: q.title || 'Dheeyudha Question',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

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
            <View className="min-h-screen flex items-center justify-center p-6 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 flex-row">
                Question not found.
            </View>
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
        // Normalize fields for components that expect camelCase
        classGrade: q.class_grade,
        timeLimit: q.time_limit,
        imagePath: q.image_path,
        imageUrl: q.image_url,
        teacherName: teacherMetadata.fullName || teacherMetadata.full_name || teacherMetadata.name || "Teacher",
        teacherUsername: teacherMetadata.username || null,
        teacherAvatar: teacherMetadata.avatar_url || teacherMetadata.avatar || null,
        matchPairs: q.match_pairs || [],
        hasHint: !!q.hint,
        hint: undefined, // remove actual string from client payload
        explanation: undefined, // remove actual string from client payload
    };

    // ── Route to written answer flow for high-point questions ──
    const isWrittenQuestion = (q.points || 0) > 15;

    return (
        <View className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 py-10 px-4 flex flex-col items-center">
            <View className="w-full max-w-3xl">
                {isWrittenQuestion ? (
                    <WrittenSolveClient question={clientQuestion} />
                ) : (
                    <SolveQuestionClient question={clientQuestion} />
                )}
            </View>
        </View>
    );
}
