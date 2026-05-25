import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

let cachedAdminIds: string[] | null = null;
let lastFetchTime = 0;

export async function GET() {
  try {
    const now = Date.now();
    // Cache for 5 minutes
    if (cachedAdminIds && now - lastFetchTime < 5 * 60 * 1000) {
      return NextResponse.json({ adminIds: cachedAdminIds });
    }

    const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const adminEmails = [...envAdmins].filter(Boolean);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    if (error) {
      throw error;
    }

    const adminIds = users
      .filter(u => u.email && adminEmails.includes(u.email.toLowerCase()))
      .map(u => u.id);

    cachedAdminIds = adminIds;
    lastFetchTime = now;

    return NextResponse.json({ adminIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, adminIds: [] }, { status: 500 });
  }
}
