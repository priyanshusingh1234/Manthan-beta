import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poetry Competition',
  description: 'Unleash your creativity in the Grand Poetry Face-off!',
  openGraph: {
    title: 'Grand Poetry Face-off',
    description: 'Participate in the poetry competition and show the community your poetic brilliance!',
    images: [
      {
        url: '/poetry_og_image.png',
        width: 1200,
        height: 630,
        alt: 'Grand Poetry Face-off',
      },
    ],
  },
};

export default function PoetryCompetitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
