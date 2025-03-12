import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeDatabase } from './lib/db-init';

let isInitialized = false;

export async function middleware(request: NextRequest) {
  // Only run the initialization once
  if (!isInitialized && typeof window === 'undefined') {
    isInitialized = true;
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Database initialization failed in middleware:', error);
    }
  }
  
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
