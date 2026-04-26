import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({
  weight: '400',                  // Press Start 2P only ships in 400
  subsets: ['latin'],
  display: 'swap',                // FOUND-04 requirement (RESEARCH A8: swap wins over PITFALLS block recommendation)
  variable: '--font-pixel',       // Exposes CSS var consumed by @theme + :root in globals.css
  preload: true,
});

export const metadata: Metadata = {
  title: '[In]terfaces — Demo',
  description: 'Arcologia Casting-7. 4 encontros. Sobreviva.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={pressStart.variable}>
      <body>{children}</body>
    </html>
  );
}
