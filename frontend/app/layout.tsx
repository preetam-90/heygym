import type { Metadata } from 'next';
import { Inter, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'GymPlatform - Find Your Perfect Gym',
  description: 'Discover gyms, compare membership plans, and start your fitness journey today.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${barlow.variable} min-h-screen flex flex-col bg-[#09090B] text-zinc-100`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}