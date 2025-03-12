import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '@/lib/db';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found. Creating a new one...');
      
      try {
        // Run Prisma migrations to create the database and tables
        await execPromise('npx prisma migrate deploy');
        console.log('Database migrations applied successfully');
      } catch (migrateError) {
        console.error('Failed to apply migrations:', migrateError);
        
        // Fallback approach: Try direct database generation
        try {
          await execPromise('npx prisma db push');
          console.log('Database schema pushed successfully');
        } catch (pushError) {
          console.error('Failed to push schema:', pushError);
          return NextResponse.json({
            success: false,
            error: 'Could not initialize the database'
          }, { status: 500 });
        }
      }
    }
    
    // Verify database connection
    await prisma.$connect();
    console.log('Database connection verified');
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
