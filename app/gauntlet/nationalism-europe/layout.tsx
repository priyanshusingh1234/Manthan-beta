import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dheeyudha.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const chapter = 'Rise of Nationalism in Europe';
  const ogImageUrl = `${BASE_URL}/api/gauntlet/og-image?chapter=${encodeURIComponent(chapter)}&level=1&total=10`;

  return {
    title: `${chapter} — Chapter Gauntlet | Dheeyudha`,
    description: `Battle through 10 levels of in-depth study notes and MCQs on "${chapter}". Earn XP, defeat the boss, and prove your mastery!`,
    openGraph: {
      title: `${chapter} — Chapter Gauntlet`,
      description: 'Earn XP, conquer levels, and defeat the final boss. Can you master this chapter?',
      url: `${BASE_URL}/gauntlet/nationalism-europe`,
      siteName: 'Dheeyudha',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${chapter} Gauntlet Progress Card`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${chapter} — Chapter Gauntlet | Dheeyudha`,
      description: 'Can you defeat the boss and master this chapter? 🔥',
      images: [ogImageUrl],
    },
  };
}

export default function GauntletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
