import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GPU Tracker',
  description: 'Track GPU prices and availability across multiple retailers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 mt-12 py-6 px-4">
          <div className="container mx-auto text-center text-gray-500 text-sm">
            GPU Tracker - Open Source Local Application
          </div>
        </footer>
      </body>
    </html>
  );
}
