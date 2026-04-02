import React from 'react';
import StreakClient from './StreakClient';

export const dynamic = 'force-dynamic';

export default function StreaksPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <StreakClient />
    </div>
  );
}
