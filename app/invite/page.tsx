import { Metadata } from "next";
import supabaseAdmin from "@/lib/supabaseAdmin";
import InviteClient from "@/components/InviteClient";

interface Props {
    searchParams: { squad?: string };
}

// Dynamic SEO metadata generated per-invite
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const squadId = searchParams.squad;

    if (!squadId) {
        return {
            title: "Invalid Invite | Dheeyudha",
            description: "This invite link is invalid.",
        };
    }

    let generalName = "A General";
    let schoolName = "an Elite School";

    try {
        const { data: squad } = await supabaseAdmin
            .from('squads')
            .select('general_id, school_id')
            .eq('id', squadId)
            .single();

        if (squad) {
            const { data: school } = await supabaseAdmin
                .from('schools')
                .select('name')
                .eq('id', squad.school_id)
                .single();

            if (school) schoolName = school.name;

            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const general = usersData.users.find(u => u.id === squad.general_id);
            if (general) {
                generalName = general.user_metadata?.fullName || general.email?.split('@')[0] || "The General";
            }
        }
    } catch (_) { }

    const title = `${generalName} has recruited you to ${schoolName}'s War Squadron`;
    const description = `Join ${schoolName}'s elite academic war squad on Dheeyudha. Your intelligence will boost the school's global ranking. Accept the draft — the war has already begun.`;
    const ogImage = `https://dheeyudha.vercel.app/og-invite.png`; // static OG image

    return {
        title,
        description,
        keywords: [`${schoolName}`, "school war", "academic competition", "Dheeyudha", "student squad", "war room"],
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://dheeyudha.vercel.app/invite?squad=${squadId}`,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: `Join ${schoolName}'s War Squadron on Dheeyudha`,
                }
            ],
            siteName: "Dheeyudha",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
            creator: "@dheeyudha",
        },
        alternates: {
            canonical: `https://dheeyudha.vercel.app/invite?squad=${squadId}`,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default function InvitePage({ searchParams }: Props) {
    const squadId = searchParams.squad;
    return <InviteClient squadId={squadId || null} />;
}
