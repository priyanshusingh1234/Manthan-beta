import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Duel Room — Dheeyudha',
    description: '1v1 MCQ challenge between students',
};

export default function DuelLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
