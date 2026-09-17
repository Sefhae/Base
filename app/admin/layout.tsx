import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup catalog | BASE Entertainment',
  // The panel is for staff only. It is protected by the Supabase login and by
  // the row level security policies, but there is no reason for it to be in
  // anyone's search results either.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
