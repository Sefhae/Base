import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'BASE Entertainment | Florida Proposals, Celebrations & Photography',description:'Make your next milestone meaningful with BASE Entertainment. Explore proposals, celebrations, photography and videography in Orlando and Cocoa Beach, Florida.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
