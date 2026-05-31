import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { upsertProfile } from "@/lib/profiles";
import { createNotification } from "@/lib/createNotification";

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userMeta = user.user_metadata || {};
        const completed = userMeta.loginBonusCompleted === true;
        
        if (completed) {
            return NextResponse.json({ error: "Login bonus already completed!" }, { status: 400 });
        }

        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const todayStr = nowIST.toISOString().slice(0, 10);
        
        const lastClaimDate = userMeta.lastLoginClaimDate;
        if (lastClaimDate === todayStr) {
            return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
        }

        const currentDay = Number(userMeta.loginBonusDay) || 0;
        const newDay = currentDay + 1;
        
        let pointsToAward = newDay * 5;
        let cosmetics = userMeta.cosmetics || [];
        let newlyCompleted = false;

        if (newDay >= 7) {
            newlyCompleted = true;
            if (!cosmetics.includes('badge_7day_pioneer')) {
                cosmetics.push('badge_7day_pioneer');
            }
        }

        const currentTotal = Number(userMeta.totalPoints) || 0;
        const newTotal = currentTotal + pointsToAward;

        const updatedMeta = {
            ...userMeta,
            totalPoints: newTotal,
            loginBonusDay: newDay,
            lastLoginClaimDate: todayStr,
            loginBonusCompleted: newlyCompleted,
            cosmetics
        };

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: updatedMeta
        });

        await upsertProfile(user.id, updatedMeta);

        // Notify user locally about points (optional, or rely on UI)
        await createNotification({
            userId: user.id,
            type: 'points_earned',
            title: `Day ${newDay} Login Bonus!`,
            body: newlyCompleted 
                ? `You claimed ${pointsToAward} points and earned the 7-Day Pioneer Badge!` 
                : `You claimed ${pointsToAward} points. Come back tomorrow for more!`,
            href: '/',
        });

        return NextResponse.json({ 
            success: true, 
            pointsAwarded: pointsToAward, 
            newTotal, 
            newDay, 
            completed: newlyCompleted 
        });

    } catch (err: any) {
        console.error("Error in login-bonus/claim:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
