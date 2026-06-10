'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3 } from 'lucide-react';

export default function DashboardButton({ profileUserId }: { profileUserId: string }) {
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const checkOwner = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === profileUserId) {
                setIsOwner(true);
            }
        };
        checkOwner();
    }, [profileUserId]);

    if (!isOwner) return null;

    return (
        <Link href="/insights/dashboard" className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all w-fit bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/50">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                Professional Dashboard
            </span>
        </Link>
    );
}
