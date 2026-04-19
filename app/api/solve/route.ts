import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";
import { createNotification } from "@/lib/createNotification";
import { upsertProfile } from "@/lib/profiles";
import { getSelectedWarMemberIds } from "@/lib/warRoster";

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

        const { questionId, selectedOption, startedAt, timeTaken, challengeId, warId } = await req.json();

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
        const correctOpt = typeof q.correct_option === 'number' ? q.correct_option : null;
        const isCorrect = correctOpt !== null && selectedOption === correctOpt;
        const questionPoints = q.points || 0;

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
                const calculatedPenalty = currentPoints > 0 ? Math.floor(questionPoints / 5) : 0;
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
                } else if (currentPoints > 0) {
                    // Regular feed: points÷5 penalty
                    const calculatedPenalty = Math.floor(questionPoints / 5);
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

        // --- STREAK LOGIC ---
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
        const actualCurrentPoints = profile ? Number(profile.total_points) : currentPoints;
        const newTotal = Math.max(0, actualCurrentPoints + userPointsChange);

        // battles_attempted / battles_won live only in auth user_metadata (no DB column)
        const battlesAttempted = (Number(userMeta.battlesAttempted) || 0) + 1;
        const battlesWon = (Number(userMeta.battlesWon) || 0) + (isCorrect ? 1 : 0);

        // SYNC BOTH: Auth & Profiles
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...userMeta,
                totalPoints: newTotal,
                battlesAttempted,
                battlesWon
            }
        });

        await upsertProfile(userId, { 
            ...userMeta, 
            totalPoints: newTotal, 
            battlesAttempted, 
            battlesWon
        });
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
            const pointsAwarded = isCorrect ? (q.points || 0) : 0;

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

        return NextResponse.json({
            success: true,
            isCorrect,
            correctOption: correctOpt,
            pointsChange: pointsChangeDisplay,
            newTotal
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Failed to submit answer" }, { status: 500 });
    }
}
