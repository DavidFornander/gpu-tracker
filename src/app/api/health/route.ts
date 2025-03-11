// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'API is running and database is connected' 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'API health check failed' },
      { status: 500 }
    );
  }
}