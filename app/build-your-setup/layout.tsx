import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Build Your Dream | BASE Entertainment',
  description:
    'Design your own celebration in 3D. Place arches, candles, balloons and lighting, then send the plan to BASE Entertainment.',
};
export default function BuildYourSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
