import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

// The BASE wordmark is set in Poppins ExtraBold, matching the supplied logo
// artwork. next/font self-hosts the files at build time, so there is no runtime
// request to Google and no flash of a fallback typeface before it loads.
// 800 = ExtraBold for the wordmark, 500 = the ENTERTAINMENT line beneath it.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '800'],
  variable: '--font-logo',
  display: 'swap',
});
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
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
