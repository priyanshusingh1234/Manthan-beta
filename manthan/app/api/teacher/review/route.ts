import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import supabaseAdmin from '@/lib/supabaseAdmin';

const DATA_PATH = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_PATH, 'teacherApplications.json');

async function readApplications() {
  const raw = await fs.readFile(FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeApplications(apps: any[]) {
  await fs.writeFile(FILE, JSON.stringify(apps, null, 2));
}

function getEmailFromBearer(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return (obj.email || obj?.user_email || obj?.sub || null)?.toString().toLowerCase();
  } catch (err) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // require admin email (server-side) — set ADMIN_EMAILS env var (comma-separated)
    const adminList = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    const auth = req.headers.get('authorization');
    const email = getEmailFromBearer(auth);
    if (!email || !adminList.includes(email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action } = await req.json();
    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
    }

    // If DB available, update there first
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('teacher_applications')
        .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), reviewer: email })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        const msg = (error && (error.message || JSON.stringify(error))) || String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      // If approved and the application is linked to an auth user, mark them as teacher
      if (action === 'approve' && data?.user_id) {
        try {
          // fetch existing metadata if possible, then merge
          let existingMeta: any = {};
          try {
            // @ts-ignore - admin.getUserById may be available
            const { data: fetchedUser } = await supabaseAdmin.auth.admin.getUserById(String(data.user_id));
            existingMeta = fetchedUser?.user?.user_metadata || {};
          } catch {
            existingMeta = {};
          }

          try {
            // @ts-ignore - admin.updateUserById should be available on service-role client
            const { data: updatedUser, error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(String(data.user_id), {
              user_metadata: { ...existingMeta, isTeacher: true, teacherApprovedAt: new Date().toISOString() },
            });
            if (metaErr) console.warn('Failed to update user metadata:', metaErr);
          } catch (metaEx) {
            console.warn('Could not update auth metadata for user_id:', data.user_id, metaEx);
          }
        } catch (e) {
          console.warn('Error while setting teacher metadata:', e);
        }
      }

      // Send optional notification (SendGrid if configured), and mark notified_at
      async function sendNotificationEmail(to: string | null, subject: string, text: string, html?: string) {
        if (!to) return null;
        const sgKey = process.env.SENDGRID_API_KEY;
        if (!sgKey) {
          console.log(`Email not sent (SENDGRID_API_KEY not set). Would send to ${to}: ${subject}`);
          return null;
        }
        try {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to }] }],
              from: { email: process.env.SUPPORT_EMAIL || 'no-reply@manthan.app', name: 'Manthan' },
              subject,
              content: [
                { type: 'text/plain', value: text },
                { type: 'text/html', value: html || text },
              ],
            }),
          });
        } catch (e) {
          console.warn('Failed to send notification email:', e);
        }
      }

      const to = data?.email || null;
      const subject = action === 'approve' ? 'Your teacher application has been approved' : 'Your teacher application has been reviewed';
      const plain = action === 'approve'
        ? `Hi ${data?.name || ''},\n\nYour application to become a teacher has been APPROVED. You now have teacher privileges on Manthan.`
        : `Hi ${data?.name || ''},\n\nYour application has been reviewed and marked as ${data?.status}.`;

      await sendNotificationEmail(to, subject, plain);

      try {
        await supabaseAdmin.from('teacher_applications').update({ notified_at: new Date().toISOString() }).eq('id', data.id);
      } catch (e) {
        console.warn('Failed to update notified_at', e);
      }

      const clientData = {
        id: String(data.id),
        fullName: data.name || data.full_name,
        email: data.email,
        school: data.school,
        schoolEmail: data.school_email,
        subjects: data.main_subject || data.subjects,
        experience: data.experience,
        bio: data.bio,
        status: data.status,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at || null,
        reviewer: data.reviewer || null,
      };

      return NextResponse.json({ success: true, data: clientData });
    }

    // Fallback: update local file
    const apps = await readApplications();
    const idx = apps.findIndex((a: any) => a.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    apps[idx].status = action === 'approve' ? 'approved' : 'rejected';
    apps[idx].reviewedAt = new Date().toISOString();
    apps[idx].reviewer = email;

    await writeApplications(apps);
    return NextResponse.json({ success: true, data: apps[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}