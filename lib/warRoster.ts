import supabaseAdmin from "@/lib/supabaseAdmin";

const WAR_ROSTER_TABLE = "war_selected_members";

function isMissingRosterTableError(error: any) {
    const msg = String(error?.message || "").toLowerCase();
    return msg.includes(`relation "public.${WAR_ROSTER_TABLE}" does not exist`);
}

export async function getSelectedWarMemberIds(warId: string, schoolId: string): Promise<string[] | null> {
    const { data, error } = await supabaseAdmin
        .from(WAR_ROSTER_TABLE)
        .select("user_id")
        .eq("war_id", warId)
        .eq("school_id", schoolId);

    if (error) {
        if (isMissingRosterTableError(error)) return null;
        throw error;
    }

    const ids = Array.from(new Set((data || []).map((row: any) => String(row.user_id)).filter(Boolean)));
    return ids.length ? ids : null;
}

export async function saveSelectedWarMemberIds(params: { warId: string; schoolId: string; memberIds: string[] }) {
    const { warId, schoolId, memberIds } = params;
    const uniqueIds = Array.from(new Set((memberIds || []).map(String).filter(Boolean)));

    const { error: deleteErr } = await supabaseAdmin
        .from(WAR_ROSTER_TABLE)
        .delete()
        .eq("war_id", warId)
        .eq("school_id", schoolId);

    if (deleteErr) {
        if (isMissingRosterTableError(deleteErr)) return false;
        throw deleteErr;
    }

    if (!uniqueIds.length) return true;

    const rows = uniqueIds.map((userId) => ({
        war_id: warId,
        school_id: schoolId,
        user_id: userId,
    }));

    const { error: insertErr } = await supabaseAdmin
        .from(WAR_ROSTER_TABLE)
        .insert(rows);

    if (insertErr) {
        if (isMissingRosterTableError(insertErr)) return false;
        throw insertErr;
    }

    return true;
}
