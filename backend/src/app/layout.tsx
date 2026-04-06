import type { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'AOE Launcher API',
  description: 'Backend API for AOE I Online Multiplayer Launcher',
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