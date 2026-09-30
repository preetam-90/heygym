import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/lib/auth-context';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'HeyGym — Find the gym that\'s right for you',
    template: '%s · HeyGym',
  },
  description: 'Discover gyms around you, compare facilities, pricing, equipment, and verified reviews — all in one place with zero hidden fees.',
  themeColor: '#0c0e10',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.className} ${jakarta.variable} flex min-h-screen flex-col bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-fixed`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
