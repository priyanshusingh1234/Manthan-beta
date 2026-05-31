// app/clips/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import ClipsClient from './ClipsClient';

export const metadata: Metadata = {
    title: 'Clips | Dheeyudha',
    description: 'Watch the latest short clips from the Dheeyudha Academy.',
};

export default function ClipsPage() {
    return (
        <Suspense fallback={<View className="bg-black min-h-screen" />}>
            <ClipsClient />
        </Suspense>
    );
}
