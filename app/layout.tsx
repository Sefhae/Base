import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'BASE Entertainment | Florida Proposals, Celebrations & Photography',
  description:
    'Make your next milestone meaningful with BASE Entertainment. Proposals, celebrations, photography and videography based in Orlando and available across Florida.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
