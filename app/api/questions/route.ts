import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import supabaseAdmin from '@/lib/supabaseAdmin';

const DATA_PATH = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_PATH, 'questions.json');

async function ensureStorage() {
  try {
    await fs.mkdir(DATA_PATH, { recursive: true });
    try { await fs.access(FILE); } catch { await fs.writeFile(FILE, JSON.stringify([])); }
  } catch (err) {
    console.error('Error ensuring storage:', err);
  }
}

function parseJwtField(bearer?: string | null, field = 'sub') {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj?.[field] ?? null;
  } catch (err) {
    return null;
  }
}

async function readLocal() {
  await ensureStorage();
  const raw = await fs.readFile(FILE, 'utf8');
  return JSON.parse(raw || '[]');
}
async function writeLocal(items: any[]) {
  await ensureStorage();
  await fs.writeFile(FILE, JSON.stringify(items, null, 2));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subject = url.searchParams.get('subject');
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 500);

    // Prefer DB when service role configured
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      let builder: any = supabaseAdmin.from('questions').select('*').order('created_at', { ascending: false }).limit(limit);
      // Only apply server-side subject filter when explicitly requested AND it's an exact known value
      // (browse page sends no subject filter and does fuzzy matching client-side)
      if (subject) builder = builder.ilike('subject', `${subject}%`);

      const { data, error } = await builder;
      if (error) return NextResponse.json({ error: (error && (error.message || JSON.stringify(error))) || String(error) }, { status: 500 });

      // fetch poster names + avatars for each unique creator id (best-effort using admin.getUserById)
      const rows = (data || []);
      const userIds = Array.from(new Set(rows.map((r: any) => r.created_by).filter(Boolean))) as string[];

      const userInfoMap: Record<string, { name: string; avatar?: string | null; username?: string | null }> = {};
      await Promise.all(userIds.map(async (id) => {
        try {
          // @ts-ignore - admin.getUserById exists on the admin client in supported SDKs
          const { data: fetchedUser } = await supabaseAdmin.auth.admin.getUserById(String(id));
          const meta = (fetchedUser as any)?.user_metadata ?? (fetchedUser as any)?.user?.user_metadata ?? {};
          const name = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || 'Teacher';
          const avatar = meta?.avatar_url || meta?.avatar || null;
          const username = meta?.username || null;
          userInfoMap[String(id)] = { name, avatar, username };
        } catch (err) {
          // swallow — we'll show a generic fallback
          userInfoMap[String(id)] = { name: 'Teacher', avatar: null, username: null };
        }
      }));

      // Fetch attempt counts for these questions
      const questionIds = rows.map((r: any) => r.id);
      let attemptsMap: Record<string, { total: number; solved: number }> = {};

      // Attempt tracking for the current user
      const authHeader = req.headers.get('authorization');
      const currentUserId = parseJwtField(authHeader, 'sub') || parseJwtField(authHeader, 'user_id');

      let userAttempts = new Set<string>();
      let userWrittenSubmissions: Record<string, string> = {};

      if (questionIds.length > 0) {
        // Aggregate attempt stats
        const { data: attempts } = await supabaseAdmin
          .from('question_attempts')
          .select('question_id, is_correct, user_id')
          .in('question_id', questionIds);

        if (attempts) {
          attempts.forEach((att: any) => {
            const qid = String(att.question_id);
            if (!attemptsMap[qid]) attemptsMap[qid] = { total: 0, solved: 0 };
            attemptsMap[qid].total += 1;
            if (att.is_correct) attemptsMap[qid].solved += 1;

            // Check if user attempted it
            if (currentUserId && att.user_id === currentUserId) {
              userAttempts.add(qid);
            }
          });
        }

        // Also fetch written submissions if logged in
        if (currentUserId) {
          const { data: wSubs } = await supabaseAdmin
            .from('written_submissions')
            .select('id, question_id')
            .eq('student_id', currentUserId)
            .in('question_id', questionIds);

          wSubs?.forEach((s: any) => {
            userWrittenSubmissions[String(s.question_id)] = String(s.id);
          });
        }
      }

      const apps = rows.map((r: any) => ({
        id: String(r.id),
        createdBy: r.created_by ? String(r.created_by) : null,
        createdByName: r.created_by ? (userInfoMap[String(r.created_by)]?.name || 'Teacher') : 'Teacher',
        createdByAvatar: r.created_by ? (userInfoMap[String(r.created_by)]?.avatar || null) : null,
        createdByUsername: r.created_by ? (userInfoMap[String(r.created_by)]?.username || null) : null,
        title: r.title,
        body: r.body,
        subject: r.subject,
        classGrade: r.class_grade,
        points: r.points,
        timeLimit: r.time_limit,
        difficulty: r.difficulty || null,
        options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options || null,
        correctOption: typeof r.correct_option === 'number' ? r.correct_option : null,
        totalAttempts: attemptsMap[String(r.id)]?.total || 0,
        solvedCount: attemptsMap[String(r.id)]?.solved || 0,
        hasAttempted: userAttempts.has(String(r.id)),
        hasWrittenSubmission: !!userWrittenSubmissions[String(r.id)],
        userSubmissionId: userWrittenSubmissions[String(r.id)] || null,
        imagePath: r.image_path || null,
        imageUrl: r.image_url || null,
        createdAt: r.created_at,
      }));

      return NextResponse.json({ questions: apps });
    }

    // fallback to local file — ensure `createdByName` and avatar exist for each item
    const list = await readLocal();
    const filtered = Array.isArray(list) ? list.slice(0, limit).map((it: any) => ({
      ...it,
      createdByName: it.createdByName || 'Teacher',
      createdByAvatar: it.createdByAvatar || null,
    })) : [];
    return NextResponse.json({ questions: filtered });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Could not read questions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const userId = parseJwtField(auth, 'sub') || parseJwtField(auth, 'user_id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const { title, body: questionBody, subject, classGrade, points, timeLimit, difficulty, options, correctOption, imagePath, imageUrl } = body || {};

    // Basic validation server-side
    if (!title || !subject || (!classGrade && subject !== 'English') || !points || !timeLimit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }
    if (!Number.isFinite(points) || points < 1 || points > 25) {
      return NextResponse.json({ error: 'Points must be between 1 and 25' }, { status: 422 });
    }

    // if options are provided, require a correctOption index
    const providedOptions = Array.isArray(options) ? options.filter((o) => typeof o === 'string' && o.trim() !== '') : [];
    if (providedOptions.length > 0) {
      if (correctOption === undefined || correctOption === null || !Number.isInteger(correctOption) || correctOption < 0 || correctOption >= providedOptions.length) {
        return NextResponse.json({ error: 'When options are provided you must select the correct option' }, { status: 422 });
      }
    }

    // If DB available, require service role and check that requester is a verified teacher
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // verify user's metadata using admin API and also capture poster name + avatar for the response
      let posterName: string | null = null;
      let posterAvatar: string | null = null;
      let posterUsername: string | null = null;
      try {
        // @ts-ignore - admin.getUserById may be available and shapes vary between SDK versions
        const { data: fetchedUser } = await supabaseAdmin.auth.admin.getUserById(String(userId));
        const meta = (fetchedUser as any)?.user_metadata ?? (fetchedUser as any)?.user?.user_metadata ?? {};
        const isTeacher = meta?.isTeacher;
        posterName = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || null;
        posterAvatar = meta?.avatar_url || meta?.avatar || null;
        posterUsername = meta?.username || null;
        if (!isTeacher) return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
      } catch (err) {
        console.warn('Could not verify user metadata:', err);
      }

      const insertPayload: any = {
        created_by: userId,
        title: title || null,
        body: questionBody || null,
        subject: subject || null,
        class_grade: (subject === 'English' ? 'All' : String(classGrade)) || null,
        points: Number(points) || 0,
        time_limit: Number(timeLimit) || 0,
        difficulty: difficulty || null,
        options: Array.isArray(options) && options.length ? options : null,
        correct_option: (typeof correctOption === 'number') ? Number(correctOption) : null,
        image_path: imagePath || null,
        image_url: imageUrl || null,
      };

      // attempt insert; if DB schema is missing `correct_option`, retry without it
      let warning: string | null = null;
      let { data, error } = await supabaseAdmin.from('questions').insert(insertPayload).select().single();
      if (error) {
        const msg = (error && (error.message || JSON.stringify(error))) || String(error);
        const missingCorrect = msg.includes("Could not find the 'correct_option'") || (error?.code === 'PGRST204');
        if (missingCorrect) {
          // retry without correct_option so app keeps working while DB is migrated
          const payload2 = { ...insertPayload };
          delete payload2.correct_option;
          const retry = await supabaseAdmin.from('questions').insert(payload2).select().single();
          if (retry.error) {
            const msg2 = (retry.error && (retry.error.message || JSON.stringify(retry.error))) || String(retry.error);
            return NextResponse.json({ error: `DB insert failed: ${msg2}` }, { status: 500 });
          }
          data = retry.data;
          warning = "DB missing 'correct_option' column — saved without correct option. Run SQL migration to add the column.";
        } else {
          return NextResponse.json({ error: `DB insert failed: ${msg}` }, { status: 500 });
        }
      }

      const clientData: any = {
        id: String(data.id),
        createdBy: data.created_by ? String(data.created_by) : null,
        createdByName: posterName || null,
        createdByAvatar: posterAvatar || null,
        createdByUsername: posterUsername || null,
        title: data.title,
        body: data.body,
        subject: data.subject,
        classGrade: data.class_grade,
        points: data.points,
        timeLimit: data.time_limit,
        difficulty: data.difficulty || null,
        options: data.options || null,
        correctOption: typeof data.correct_option === 'number' ? data.correct_option : null,
        imagePath: data.image_path || null,
        imageUrl: data.image_url || null,
        createdAt: data.created_at,
      };

      const resp: any = { success: true, data: clientData };
      if (warning) resp.warning = warning;
      return NextResponse.json(resp, { status: 201 });
    }

    // Fallback: local storage (development)
    const list = await readLocal();
    const newItem = {
      id: (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdBy: userId,
      createdByName: 'Teacher',
      createdByAvatar: null,
      title,
      body: questionBody || null,
      subject,
      classGrade: String(classGrade),
      points: Number(points),
      timeLimit: Number(timeLimit),
      difficulty: difficulty || null,
      options: Array.isArray(options) ? options : null,
      correctOption: (typeof correctOption === 'number') ? Number(correctOption) : null,
      imagePath: imagePath || null,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    await writeLocal(list);
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const userId = parseJwtField(auth, 'sub') || parseJwtField(auth, 'user_id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id, imagePath } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // confirm ownership and get image path
      const { data: q, error: fetchErr } = await supabaseAdmin
        .from('questions')
        .select('created_by, image_path')
        .eq('id', id)
        .single();

      if (fetchErr) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      if (q.created_by !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // delete record
      const { error: delErr } = await supabaseAdmin.from('questions').delete().eq('id', id);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

      // delete image if exists (using path from DB)
      if (q.image_path) {
        try {
          await supabaseAdmin.storage.from('question-images').remove([q.image_path]);
        } catch (e) {
          console.warn('Failed to delete storage image:', e);
        }
      }

      return NextResponse.json({ success: true });
    }

    // fallback for local development
    const list = await readLocal();
    const idx = list.findIndex((x: any) => String(x.id) === String(id) && x.createdBy === userId);
    if (idx === -1) {
      // either not found or not owner
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }
    list.splice(idx, 1);
    await writeLocal(list);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
