import { NextResponse } from 'next/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app';

export function GET(req: Request) {
    // Redirect to APK download
    return NextResponse.redirect(`${baseUrl}/app-debug.apk`, { status: 302 });
}

export async function POST(req: Request) {
    // Return version info + download link
    return NextResponse.json({
        version: '0.0.3',
        min_version: '0.0.3',
        name: 'v0.0.3 Native Update',
        description: 'Native Android optimization with haptic feedback. Improved war battle experience with compact native UI.',
        downloadUrl: `${baseUrl}/app-debug.apk`,
        force_update: true,
        release_date: '2026-03-30',
        success: true
    });
}
