import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";
import { createNotification } from "@/lib/createNotification";
import { upsertProfile } from "@/lib/profiles";
import { getSelectedWarMemberIds } from "@/lib/warRoster";

const WRONG_ANSWER_PENALTY = 1;

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

        const { questionId, selectedOption, startedAt, timeTaken, challengeId, warId, isCorrect: clientIsCorrect } = await req.json();

        if (!questionId) {
            return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
        }

        // 1. Fetch Question
        const { data: q, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("*")
            .eq("id", questionId)
            .single();

        if (qErr || !q) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        // 2. Check if already attempted
        const { data: existingAttempt } = await supabaseAdmin
            .from("question_attempts")
            .select("id")
            .eq("user_id", userId)
            .eq("question_id", questionId)
            .maybeSingle();

        // Custom logic for coop challenges
        let challenge = null;
        if (challengeId) {
            const { data: c } = await supabaseAdmin
                .from("coop_challenges")
                .select("*")
                .eq("id", challengeId)
                .single();
            challenge = c;
        }

        const isInitiatorRetry = challenge && challenge.initiator_id === userId;
        // The partner is the person being asked for help — they must be allowed to solve
        // even if they previously attempted this question on their own.
        const isCoopPartner = challenge && challenge.partner_id === userId
            && (challenge.status === 'pending' || challenge.status === 'active');

        if (existingAttempt && !isInitiatorRetry && !isCoopPartner && !warId) {
            return NextResponse.json({ error: "You have already attempted this question" }, { status: 403 });
        }

        let currentWar = null;
        let mySchoolId = null;
        let mySquadId: string | null = null;

        if (warId) {
            // Verify war exists and is active, and user is in one of the squads
            const { data: member } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).maybeSingle();
            const { data: war } = await supabaseAdmin.from("wars").select("*").eq("id", warId).maybeSingle();

            if (!war || !member || war.status !== 'active') {
                return NextResponse.json({ error: "Invalid or inactive war session" }, { status: 403 });
            }

            const isChallenger = member.squad_id === war.challenger_squad_id;
            const isDefender = member.squad_id === war.defender_squad_id;

            if (!isChallenger && !isDefender) {
                return NextResponse.json({ error: "You are not a participant in this war" }, { status: 403 });
            }

            mySquadId = String(member.squad_id);
            mySchoolId = isChallenger ? war.challenger_school_id : war.defender_school_id;
            const selectedMemberIds = await getSelectedWarMemberIds(warId, mySchoolId);

            if (selectedMemberIds && !selectedMemberIds.includes(userId)) {
                return NextResponse.json({ error: "General did not select you for this war lineup." }, { status: 403 });
            }

            const myQuestionIds: string[] = isChallenger ? (war.defender_questions || []) : (war.challenger_questions || []);

            if (!myQuestionIds.includes(questionId)) {
                return NextResponse.json({ error: "This question is not assigned to your squad in this war" }, { status: 403 });
            }

            currentWar = war;

            const { count: warAttemptCount } = await supabaseAdmin
                .from("war_submissions")
                .select("id", { count: "exact", head: true })
                .eq("war_id", warId)
                .eq("student_id", userId);

            if ((warAttemptCount || 0) >= 2) {
                return NextResponse.json({ error: "War limit reached: each player can solve at most 2 questions." }, { status: 403 });
            }

            const { data: existingWarSub } = await supabaseAdmin
                .from("war_submissions")
                .select("id")
                .eq("war_id", warId)
                .eq("student_id", userId)
                .eq("question_id", questionId)
                .maybeSingle();

            if (existingWarSub) {
                return NextResponse.json({ error: "You have already attempted this question in this war" }, { status: 403 });
            }
        }

        // 3. Evaluate answer
        let isCorrect = false;
        let correctOpt: number | null = null;
        if (q.question_type === 'match') {
            isCorrect = clientIsCorrect === true;
        } else {
            correctOpt = typeof q.correct_option === 'number' ? q.correct_option : null;
            isCorrect = correctOpt !== null && selectedOption === correctOpt;
        }
        const questionPoints = q.points || 0;
        const hasNegativeMarking = q.question_type !== 'match';

        // 4. Update User Points
        let userPointsChange = 0;
        let pointsChangeDisplay = 0;

        const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (uErr || !userResp?.user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userMeta = userResp.user.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;
        if (challenge) {
            const isPartner = challenge.partner_id === userId;
            const isInitiator = challenge.initiator_id === userId;

            if (isCorrect) {
                // If correct, both win and split points
                const splitPoints = Math.ceil(questionPoints / 2);
                userPointsChange = splitPoints;
                pointsChangeDisplay = splitPoints;

                // Update challenge status to won
                await supabaseAdmin
                    .from("coop_challenges")
                    .update({ status: 'won' })
                    .eq("id", challenge.id);

                // We must reward the other person too
                const otherUserId = isPartner ? challenge.initiator_id : challenge.partner_id;
                const { data: otherUser } = await supabaseAdmin.auth.admin.getUserById(otherUserId);
                if (otherUser?.user) {
                    const otherMeta = otherUser.user.user_metadata || {};
                    const otherCurrent = Number(otherMeta.totalPoints) || 0;
                    await supabaseAdmin.auth.admin.updateUserById(otherUserId, {
                        user_metadata: {
                            ...otherMeta,
                            totalPoints: Math.max(0, otherCurrent + splitPoints),
                        }
                    });

                    // Notify the other user of the victory
                    await createNotification({
                        userId: otherUserId,
                        type: 'coop_challenge',
                        title: `Co-op Victory 🏆`,
                        body: `You and @${userMeta.username || userMeta.fullName || 'Player'} successfully recovered the points (+${splitPoints} pts).`,
                        href: `/questions/${questionId}`,
                    });
                }
            } else {
                // Wrong answer in challenge
                const calculatedPenalty = hasNegativeMarking && currentPoints > 0 ? WRONG_ANSWER_PENALTY : 0;
                userPointsChange = -calculatedPenalty;
                pointsChangeDisplay = -calculatedPenalty;

                if (isPartner) {
                    await supabaseAdmin
                        .from("coop_challenges")
                        .update({ partner_attempted: true, status: 'lost' })
                        .eq("id", challenge.id);

                    // Notify initiator that partner failed to save them
                    const { data: partnerUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                    const partnerName = partnerUser?.user?.user_metadata?.fullName || partnerUser?.user?.user_metadata?.username || "Your friend";

                    await createNotification({
                        userId: challenge.initiator_id,
                        type: 'coop_challenge',
                        title: `Co-op Failed ✗`,
                        body: `Co-op attempt unsuccessful. The points were not recovered.`,
                        href: `/questions/${questionId}`,
                    });
                }
            }
        } else {
            // Normal solve logic
            if (isCorrect) {
                userPointsChange = questionPoints;
                pointsChangeDisplay = questionPoints;
            } else {
                if (warId) {
                    // War mode: no wrong-answer penalty
                    userPointsChange = 0;
                    pointsChangeDisplay = 0;
                } else if (hasNegativeMarking && currentPoints > 0) {
                    // Regular feed MCQ: fixed -1 penalty
                    const calculatedPenalty = WRONG_ANSWER_PENALTY;
                    userPointsChange = -calculatedPenalty;
                    pointsChangeDisplay = -calculatedPenalty;
                }
            }
        }

        // Prevent double-dipping or overriding points if already attempted previously before the war
        if (existingAttempt && warId) {
            userPointsChange = 0;
            // The user still sees 0 points change instead of gaining/losing again
            pointsChangeDisplay = 0;
        }

        // --- STREAK & MONTHLY LOGIC ---
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
        const actualCurrentPoints = profile ? Number(profile.total_points) : currentPoints;
        const newTotal = Math.max(0, actualCurrentPoints + userPointsChange);

        // ── Monthly Points Tracker ───────────────────────────────────────
        // We calculate reset points if the month rolled over, then add the new points
        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000); // UTC+5:30
        const currentMonth = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}`;
        
        let dbMonthlyMonth = (profile as any)?.monthly_points_month || null;
        let currentMonthlyPts = Number((profile as any)?.monthly_points) || 0;
        
        if (dbMonthlyMonth !== currentMonth) {
            // Helper logic for getResetPoints since we are in backend
            const getResetPts = (pts: number) => {
              if (pts >= 450) return 200; if (pts >= 350) return 200;
              if (pts >= 250) return 150; if (pts >= 200) return 150;
              if (pts >= 100) return 50;  return 50; // default for any rolled over month
            };
            currentMonthlyPts = dbMonthlyMonth === null ? 0 : getResetPts(currentMonthlyPts);
            dbMonthlyMonth = currentMonth;
        }
        
        const newMonthlyPts = Math.max(0, currentMonthlyPts + userPointsChange);
        // ─────────────────────────────────────────────────────────────────

        // battles_attempted / battles_won live only in auth user_metadata (no DB column)
        const battlesAttempted = (Number(userMeta.battlesAttempted) || 0) + 1;
        const battlesWon = (Number(userMeta.battlesWon) || 0) + (isCorrect ? 1 : 0);

        // ── XP: 2 XP per correct answer (never penalised) ───────────────
        const XP_PER_CORRECT = 2;
        const currentXp = Number(userMeta.xp) || 0;
        const newXp = isCorrect && !existingAttempt ? currentXp + XP_PER_CORRECT : currentXp;

        // ── 2-question-per-day streak engine ─────────────────────────────
        // We use the profiles table (DB) as the source of truth to avoid
        // stale JWT metadata causing double-counts.
        const todayStr = nowIST.toISOString().slice(0, 10);          // "YYYY-MM-DD"

        const dbDailySolveDate  = (profile as any)?.daily_solve_date  || null;
        const dbDailySolveCount = Number((profile as any)?.daily_solve_count) || 0;
        const dbStreakCount     = Number((profile as any)?.streak_count) || 0;
        const dbStreakLongest   = Number((profile as any)?.streak_longest) || 0;
        const dbLastStreakAt    = (profile as any)?.last_streak_at || null;

        // Compute yesterday string to detect a missed day
        const yesterdayIST = new Date(nowIST);
        yesterdayIST.setDate(yesterdayIST.getDate() - 1);
        const yesterdayStr = yesterdayIST.toISOString().slice(0, 10);

        let newDailySolveCount = dbDailySolveCount;
        let newStreakCount     = dbStreakCount;
        let newStreakLongest   = dbStreakLongest;
        let newLastStreakAt    = dbLastStreakAt;
        let lastStreakCount    = Number((profile as any)?.last_streak_count) || dbStreakCount;

        if (dbDailySolveDate === todayStr) {
            // Same day — just increment daily count
            newDailySolveCount = dbDailySolveCount + 1;
        } else {
            // New day — reset daily counter
            newDailySolveCount = 1;

            // If they missed yesterday (last solve wasn't yesterday) → break streak
            if (dbLastStreakAt && dbDailySolveDate !== yesterdayStr && dbDailySolveDate !== todayStr) {
                // Save the streak they had before losing it
                lastStreakCount = dbStreakCount;
                newStreakCount = 0; // streak broken
            }
        }

        // Promote streak when user crosses the 2-question threshold for today
        const DAILY_GOAL = 2;
        if (newDailySolveCount === DAILY_GOAL) {
            // Only increment streak once per day (when they hit exactly the goal)
            if (dbDailySolveDate !== todayStr || dbDailySolveCount < DAILY_GOAL) {
                newStreakCount = newStreakCount + 1;
                newLastStreakAt = new Date().toISOString();
                newStreakLongest = Math.max(newStreakLongest, newStreakCount);
            }
        }
        // ────────────────────────────────────────────────────────────────


        const updatedMeta = {
            ...userMeta,
            totalPoints: newTotal,
            xp: newXp,
            battlesAttempted,
            battlesWon,
            streakCount: newStreakCount,
            streakLongest: newStreakLongest,
            lastStreakAt: newLastStreakAt,
            lastStreakCount,        // ← the streak count before it was lost
            dailySolveCount: newDailySolveCount,
            dailySolveDate: todayStr,
            monthlyPoints: newMonthlyPts,
            monthlyPointsMonth: currentMonth,
        };

        // SYNC BOTH: Auth & Profiles
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updatedMeta });

        await upsertProfile(userId, updatedMeta);
        leaderboardCache.invalidate();


        // 5. Save attempt or update existing if they already solved it previously
        if (existingAttempt) {
            // Only update the attempt if it's NOT a War. For Wars, we preserve their original attempts history!
            if (!warId) {
                await supabaseAdmin.from("question_attempts").update({
                    selected_option: selectedOption,
                    is_correct: isCorrect,
                    time_taken: timeTaken || 0,
                    submitted_at: new Date().toISOString(),
                }).eq("user_id", userId).eq("question_id", questionId);
            }
        } else {
            await supabaseAdmin.from("question_attempts").insert({
                user_id: userId,
                question_id: questionId,
                selected_option: selectedOption,
                is_correct: isCorrect,
                time_taken: timeTaken || 0,
                started_at: startedAt || new Date().toISOString(),
                submitted_at: new Date().toISOString(),
            });
        }

        // ── WAR SUBMISSION ───────────────────────────────
        if (warId && currentWar && mySchoolId) {
            // The school scoreboard normalizes to 10 points per solve for fairness.
            // (Note: The student still gets their personal 'userPointsChange' based on difficulty!)
            const pointsAwarded = isCorrect ? 10 : 0;

            // Insert war submission
            await supabaseAdmin.from("war_submissions").insert({
                war_id: warId,
                school_id: mySchoolId,
                student_id: userId,
                question_id: questionId,
                status: isCorrect ? "correct" : "incorrect",
                points_awarded: pointsAwarded,
            });

            // Check all-correct bonus: if every question assigned to my squad is now correct
            const isChallenger = currentWar.challenger_school_id === mySchoolId;
            const myQuestionIds: string[] = isChallenger ? (currentWar.defender_questions || []) : (currentWar.challenger_questions || []);

            if (myQuestionIds.length > 0) {
                const { data: correctSubs } = await supabaseAdmin
                    .from("war_submissions")
                    .select("question_id")
                    .eq("war_id", warId)
                    .eq("school_id", mySchoolId)
                    .eq("status", "correct");

                const correctIds = new Set((correctSubs || []).map(s => s.question_id));
                const allCorrect = myQuestionIds.every(id => correctIds.has(id));

                if (allCorrect) {
                    // +5 all-correct bonus to every squad member
                    if (mySquadId) {
                        const selectedMemberIds = await getSelectedWarMemberIds(warId, mySchoolId);
                        let recipientIds = selectedMemberIds || [];

                        if (!recipientIds.length) {
                            const { data: squadUsers } = await supabaseAdmin
                                .from("squad_members").select("user_id")
                                .eq("squad_id", mySquadId);
                            recipientIds = (squadUsers || []).map((su: any) => String(su.user_id)).filter(Boolean);
                        }

                        for (const recipientId of recipientIds) {
                            const { data: suResp } = await supabaseAdmin.auth.admin.getUserById(recipientId);
                            if (suResp?.user) {
                                const recipientMeta = suResp.user.user_metadata || {};
                                const newRecipientTotal = Math.max(0, (Number(recipientMeta.totalPoints) || 0) + 5);
                                await supabaseAdmin.auth.admin.updateUserById(recipientId, {
                                    user_metadata: { ...recipientMeta, totalPoints: newRecipientTotal }
                                });
                                // Sync profiles table so public profile & leaderboard stay accurate
                                await upsertProfile(recipientId, { ...recipientMeta, totalPoints: newRecipientTotal });
                            }
                        }
                        leaderboardCache.invalidate();
                    }
                }
            }
        }
        // ────────────────────────────────────────────────

        const streakEarnedToday = newDailySolveCount === 2;

        // ── Level-up detection ────────────────────────────────────────────
        const XP_PER_LEVEL = 50;
        const oldLevel = Math.floor(currentXp / XP_PER_LEVEL) + 1;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        const leveledUp = newLevel > oldLevel;

        const response = NextResponse.json({
            success: true,
            isCorrect,
            correctOption: correctOpt,
            pointsChange: pointsChangeDisplay,
            newTotal,
            xpGained: isCorrect && !existingAttempt ? XP_PER_CORRECT : 0,
            newXp,
            leveledUp,
            newLevel,
            explanation: q.explanation || null,
            streak: {
                current: newStreakCount,
                longest: newStreakLongest,
                dailySolveCount: newDailySolveCount,
                dailyGoal: 2,
                goalMetToday: newDailySolveCount >= 2,
                streakEarnedToday,
            }
        });

        // ── streak_friend notifications ────────────────────────────────────
        // Notify followers who haven't met today's goal that this user just earned
        // their streak. Must be awaited — Vercel kills un-awaited promises on return.
        if (streakEarnedToday) {
            try {
                const todayForNotif = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

                const [{ data: solverProfile }, { data: followerRows }] = await Promise.all([
                    supabaseAdmin.from('profiles').select('full_name, username, avatar_url').eq('id', userId).single(),
                    supabaseAdmin.from('follows').select('follower_id').eq('following_id', userId),
                ]);

                const solverName = solverProfile?.full_name || 'Your friend';
                const solverAvatar = solverProfile?.avatar_url || null;

                if (followerRows && followerRows.length > 0) {
                    const followerIds = followerRows.map((r: any) => r.follower_id);

                    const { data: followerProfiles } = await supabaseAdmin
                        .from('profiles')
                        .select('id, daily_solve_date, daily_solve_count')
                        .in('id', followerIds);

                    const pendingFollowers = (followerProfiles || []).filter((fp: any) => {
                        const metGoal = fp.daily_solve_date === todayForNotif && Number(fp.daily_solve_count) >= 2;
                        return !metGoal;
                    });

                    await Promise.allSettled(pendingFollowers.map((fp: any) =>
                        createNotification({
                            userId: fp.id,
                            type: 'streak_friend',
                            title: `🔥 ${solverName} just earned their streak!`,
                            body: `Don't fall behind — solve 2 questions to keep your streak alive too!`,
                            href: '/streaks',
                            actorId: userId,
                            actorName: solverName,
                            actorAvatar: solverAvatar ?? undefined,
                        })
                    ));
                }
            } catch (e) {
                console.error('[solve] streak_friend notif error:', e);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        // ── PET FEEDING LOGIC ──────────────────────────────────────────────
        if (isCorrect) {
            try {
                const { data: petData } = await supabaseAdmin.from('profiles').select('pet_health').eq('id', userId).single();
                if (petData) {
                    const currentHealth = petData.pet_health || 0;
                    const newHealth = Math.min(100, currentHealth + 15); // +15 health per correct answer
                    await supabaseAdmin.from('profiles').update({
                        pet_health: newHealth,
                        pet_last_fed_at: new Date().toISOString()
                    }).eq('id', userId);
                }
            } catch (e) {
                console.error('[solve] pet feed error:', e);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        return response;
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Failed to submit answer" }, { status: 500 });
    }
}
