-- Function to fetch public user metadata
CREATE OR REPLACE FUNCTION public.get_public_profile_metadata(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    meta JSONB;
BEGIN
    SELECT raw_user_meta_data INTO meta
    FROM auth.users
    WHERE id = target_user_id;
    RETURN COALESCE(meta, '{}'::JSONB);
END;
$$;

-- Function to fetch public solved questions
CREATE OR REPLACE FUNCTION public.get_public_solved_questions(target_user_id UUID)
RETURNS TABLE (question_id UUID, is_correct BOOLEAN, created_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT qa.question_id, qa.is_correct, qa.created_at
    FROM question_attempts qa
    WHERE qa.user_id = target_user_id;
END;
$$;

-- ── submit_gauntlet: handles gauntlet submission fully server-side ────────────
-- Inserts test_results, awards bonus points if threshold met, updates profiles.
-- Called from native app with the user's anon JWT — SECURITY DEFINER runs as owner.
CREATE OR REPLACE FUNCTION public.submit_gauntlet(
    p_test_id       TEXT,
    p_answers       JSONB,      -- array of AttemptSnapshot objects
    p_score         INT,
    p_max_score     INT,
    p_time_taken    INT,
    p_accuracy      INT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_user_id           UUID;
    v_existing_id       UUID;
    v_gauntlet          RECORD;
    v_threshold_score   INT;
    v_current_points    INT;
    v_new_total         INT;
    v_bonus_msg         TEXT := NULL;
BEGIN
    -- 1. Identify caller
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    -- 2. Anti-duplicate lock
    SELECT id INTO v_existing_id
    FROM public.test_results
    WHERE user_id = v_user_id AND test_id = p_test_id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Already submitted this Gauntlet.');
    END IF;

    -- 3. Insert result
    INSERT INTO public.test_results (user_id, test_id, score, max_score, time_taken, accuracy, completed_at, metadata)
    VALUES (v_user_id, p_test_id, p_score, p_max_score, p_time_taken, p_accuracy, NOW(), jsonb_build_object('answers_snapshot', p_answers));

    -- 4. Check for bonus points
    SELECT reward_points, reward_threshold_percent, title
    INTO v_gauntlet
    FROM public.gauntlets
    WHERE slug = p_test_id;

    IF v_gauntlet IS NOT NULL AND COALESCE(v_gauntlet.reward_points, 0) > 0 AND COALESCE(v_gauntlet.reward_threshold_percent, 0) > 0 THEN
        v_threshold_score := ROUND((v_gauntlet.reward_threshold_percent::NUMERIC / 100) * p_max_score);
        IF p_score >= v_threshold_score THEN
            -- Update profiles table total_points
            SELECT COALESCE(total_points, 0) INTO v_current_points
            FROM public.profiles
            WHERE id = v_user_id;

            v_new_total := v_current_points + v_gauntlet.reward_points;

            UPDATE public.profiles
            SET total_points = v_new_total
            WHERE id = v_user_id;

            v_bonus_msg := '🎉 You scored above ' || v_gauntlet.reward_threshold_percent || '% and earned +' || v_gauntlet.reward_points || ' bonus points!';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'bonusMessage', v_bonus_msg
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_gauntlet(TEXT, JSONB, INT, INT, INT, INT) TO authenticated;

-- Function to create or retrieve chat rooms
CREATE OR REPLACE FUNCTION public.create_chat_room(target_user_id UUID, current_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    existing_room_id UUID;
    is_private_profile BOOLEAN;
    is_following_target BOOLEAN;
    initial_status TEXT;
    new_room_id UUID;
BEGIN
    -- 1. Check if direct chat room already exists (exactly 2 participants, one is current_user, one is target_user)
    SELECT p1.room_id INTO existing_room_id
    FROM public.chat_participants p1
    JOIN public.chat_participants p2 ON p1.room_id = p2.room_id
    JOIN public.chat_rooms r ON p1.room_id = r.id
    WHERE r.is_group = FALSE
      AND p1.user_id = current_user_id
      AND p2.user_id = target_user_id
      AND (SELECT COUNT(*) FROM public.chat_participants WHERE room_id = p1.room_id) = 2
    LIMIT 1;

    IF existing_room_id IS NOT NULL THEN
        RETURN existing_room_id;
    END IF;

    -- 2. Room doesn't exist, check privacy
    SELECT is_private INTO is_private_profile
    FROM public.profiles
    WHERE id = target_user_id;

    initial_status := 'approved';
    IF is_private_profile = TRUE THEN
        -- Check if current user follows target
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = current_user_id AND following_id = target_user_id
        ) INTO is_following_target;

        IF is_following_target = FALSE THEN
            initial_status := 'pending';
        END IF;
    END IF;

    -- 3. Create room
    new_room_id := gen_random_uuid();
    INSERT INTO public.chat_rooms (id, is_group, created_by, status)
    VALUES (new_room_id, FALSE, current_user_id, initial_status);

    -- 4. Add participants
    INSERT INTO public.chat_participants (id, room_id, user_id)
    VALUES 
        (gen_random_uuid(), new_room_id, current_user_id),
        (gen_random_uuid(), new_room_id, target_user_id);

    RETURN new_room_id;
END;
$$;

