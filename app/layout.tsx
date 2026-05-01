import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dino Friend',
  description: 'A 3D dino pet you take care of.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#88c47a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 h-dvh w-dvw overflow-hidden bg-sky-200 text-slate-900 antialiased select-none touch-none">
        {children}
      </body>
    </html>
  );
}
