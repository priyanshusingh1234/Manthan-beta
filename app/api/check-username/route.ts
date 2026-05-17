import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isValidUsername, sanitizeUsernameInput } from '@/lib/username';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username');

    if (!rawUsername) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const username = sanitizeUsernameInput(rawUsername);
    if (!username || !isValidUsername(username)) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // We fetch all users to check uniqueness
        // Note: If you have more than 50 users, you'd need to paginate. For now, this limits to 1000.
        const { data: usersData, error } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (error) throw error;

        const isTaken = usersData.users.some(user => {
            const existingUsername = sanitizeUsernameInput(String(user.user_metadata?.username || ''));
            return existingUsername === username;
        });

        return NextResponse.json({ isUnique: !isTaken });
    } catch (err: any) {
        console.error('Error checking username:', err);
        return NextResponse.json({ error: 'Failed to check username' }, { status: 500 });
    }
}
