import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'HeyGym Admin',
  description: 'HeyGym internal admin platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[#09090B] text-zinc-100">
          <header className="border-b border-white/10">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <span className="text-sm font-bold tracking-widest uppercase">
                HeyGym <span className="text-volt">Admin</span>
              </span>
              <span className="text-xs text-zinc-500">Internal only</span>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">
            <AuthProvider>{children}</AuthProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
