import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import CountdownManager from '@/components/CountdownManager';

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
        <Navbar />
        {/* Make container full width with max constraint and better padding */}
        <main className="w-full max-w-[1920px] mx-auto px-5 md:px-8 lg:px-12 py-8">
          {/* Add the background countdown manager */}
          <CountdownManager />
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
