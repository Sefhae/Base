import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Get More Information | BASE Entertainment',
  description:
    'Request packages, details, and availability from BASE Entertainment. Proposals, celebrations, photography and videography based in Orlando and available across Florida.',
};
export default function GetMoreInformationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
