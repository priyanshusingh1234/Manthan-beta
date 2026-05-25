import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poetry Competition',
  description: 'Unleash your creativity in the Grand Poetry Face-off!',
  openGraph: {
    title: 'Grand Poetry Face-off',
    description: 'Participate in the poetry competition and show the community your poetic brilliance!',
  },
};

export default function PoetryCompetitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
