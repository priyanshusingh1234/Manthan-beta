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
        .select("id, title, body, subject, class_grade, points, difficulty, image_url")
        .eq("id", id)
        .maybeSingle();

    if (!q) {
        return {
            title: 'Question Not Found | Dheeyudha',
            description: 'This question is not available.',
        };
    }

    const title = `${q.title} | Dheeyudha Question`;
    const description = (q.body || `Class ${q.class_grade || '?'} ${q.subject || 'Question'} · ${q.points || 0} points`)
        .toString()
        .slice(0, 160);
    const image = q.image_url
        ? (q.image_url.startsWith('http') ? q.image_url : `${APP_URL}${q.image_url}`)
        : `${APP_URL}/og-social.png`;
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
            <div className="min-h-screen flex items-center justify-center p-6 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">
                Question not found.
            </div>
        );
    }

    // Fetch the teacher metadata rapidly from the profiles table instead of slow Auth APIs
    let teacherMetadata: any = {};
    if (q.created_by) {
        try {
            const { data: profile, error: uErr } = await supabaseAdmin
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', q.created_by)
                .single();
                
            if (!uErr && profile) {
                teacherMetadata = profile;
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
    };

    // ── Route to written answer flow for high-point questions ──
    const isWrittenQuestion = (q.points || 0) > 15;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 py-10 px-4 flex flex-col items-center">
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
