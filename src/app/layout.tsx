import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import CountdownManager from '@/components/CountdownManager';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GPU Tracker',
  description: 'Track GPU prices and availability across multiple retailers',
};

// This function runs on the server
async function initDatabase() {
  try {
    const cookieStore = cookies();
    const dbInitialized = cookieStore.get('db-initialized');
    
    // Only initialize once per session
    if (!dbInitialized) {
      // Use relative URL to ensure it works in all environments
      const url = '/api/init-db';
      const response = await fetch(new URL(url, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), { 
        method: 'GET',
        cache: 'no-store'  // Don't cache this response
      });
      
      if (response.ok) {
        console.log('Database initialized successfully');
        // Set cookie to avoid repeated initialization
        cookies().set('db-initialized', 'true', { maxAge: 3600 });
      } else {
        console.error('Failed to initialize database');
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize database when the app starts
  await initDatabase();
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="w-full max-w-[1920px] mx-auto px-5 md:px-8 lg:px-12 py-8">
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
