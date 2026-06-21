-- 1. Create `tests` table
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create `test_questions` table
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mcq', 'written')),
    question_text TEXT NOT NULL,
    options JSONB, -- Array of strings for MCQs
    correct_answer TEXT, -- Only for MCQs
    marks INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create `test_submissions` table
CREATE TABLE IF NOT EXISTS public.test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'grading' CHECK (status IN ('grading', 'completed')),
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(test_id, user_id)
);

-- 4. Create `test_answers` table
CREATE TABLE IF NOT EXISTS public.test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.test_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    image_url TEXT,
    marks_awarded INTEGER DEFAULT 0,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(submission_id, question_id)
);

-- Enable RLS
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tests" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Anyone can view test questions" ON public.test_questions FOR SELECT USING (true);

CREATE POLICY "Users can view their own submissions" ON public.test_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own answers" ON public.test_answers FOR SELECT USING (
    submission_id IN (SELECT id FROM public.test_submissions WHERE user_id = auth.uid())
);

-- Note: Inserts/Updates to submissions & answers will be handled via the trusted backend API (supabaseAdmin),
-- bypassing RLS, so we don't need INSERT/UPDATE policies for clients.


-- ==========================================
-- SEED DATA: Class 10 Unit Test
-- ==========================================

DO $$ 
DECLARE
    v_test_id UUID;
BEGIN
    -- Insert Test
    INSERT INTO public.tests (title, description) 
    VALUES ('Class 10 History Unit Test', 'The Rise of Nationalism in Europe')
    RETURNING id INTO v_test_id;

    -- Q1 (MCQ)
    INSERT INTO public.test_questions (test_id, type, question_text, options, correct_answer, marks, order_index)
    VALUES (v_test_id, 'mcq', 'Arrange the following events in right chronological order:
(i) France became a republic
(ii) The Civil Code was launched
(iii) Napoleon entered France
(iv) The battle of Waterloo', 
    '["(i), (ii), (iii), (iv)", "(iii), (ii), (iv), (i)", "(iii), (i), (ii), (iv)", "(i), (iii), (ii), (iv)"]', 
    '"(iii), (ii), (iv), (i)"', 1, 1);

    -- Q2 (MCQ)
    INSERT INTO public.test_questions (test_id, type, question_text, options, correct_answer, marks, order_index)
    VALUES (v_test_id, 'mcq', 'Which language did the aristocrats of Europe speak during the mid-18th century?', 
    '["Gaelic", "Polish", "French", "German"]', '"French"', 1, 2);

    -- Q3 (MCQ)
    INSERT INTO public.test_questions (test_id, type, question_text, options, correct_answer, marks, order_index)
    VALUES (v_test_id, 'mcq', 'Garibaldi was inspired by:', 
    '["Giuseppe Mazzini", "Lord Byron", "Otto Von Bismarck", "Gandhi Ji"]', '"Giuseppe Mazzini"', 1, 3);

    -- Q4 (MCQ)
    INSERT INTO public.test_questions (test_id, type, question_text, options, correct_answer, marks, order_index)
    VALUES (v_test_id, 'mcq', 'Which of the following regions became a part of unified Italy in 1866?', 
    '["Venetia", "Sicily", "Papal State", "Piedmont"]', '"Venetia"', 1, 4);

    -- Q5 (MCQ)
    INSERT INTO public.test_questions (test_id, type, question_text, options, correct_answer, marks, order_index)
    VALUES (v_test_id, 'mcq', 'Which of the following happened earlier?', 
    '["Battle of Waterloo", "Greek War of Independence", "Battle of Leipzig", "Unification of Italy"]', '"Battle of Leipzig"', 1, 5);

    -- Q6 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'Assertion and Reason type question:
Assertion: Revolutionaries went underground during the 1815s.
Reason: The new Conservative government was suppressing them.', 2, 6);

    -- Q7 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'Why was the case of Britain strange? Compare it with Italy.', 3, 7);

    -- Q8 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'Why did there emerge a new group of people in Europe during the industrial revolution?', 3, 8);

    -- Q9 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'What was the purpose of the formation of the Zollverein?', 2, 9);

    -- Q10 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'Briefly describe the Greek War of Independence. What declared Greece as an independent nation?', 3, 10);

    -- Q11 (Written)
    INSERT INTO public.test_questions (test_id, type, question_text, marks, order_index)
    VALUES (v_test_id, 'written', 'Napoleon was still a monarch even though he was supporting equality before the law. Do you think Monarchy can be a good way of ruling? If not, state why. If yes, tell why.', 5, 11);

END $$;
