import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that doesn't use Node.js specific modules or import any server components
export function middleware(request: NextRequest) {
  // Just pass through the request without any database operations
  return NextResponse.next();
}

// Limit middleware execution to specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
