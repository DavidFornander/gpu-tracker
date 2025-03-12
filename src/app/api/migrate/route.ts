import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('Running Prisma migrations...');
    
    // Generate Prisma client with the updated schema
    const { stdout: generateOutput, stderr: generateError } = await execAsync('npx prisma generate');
    if (generateError) {
      console.error('Error generating Prisma client:', generateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate Prisma client',
        details: generateError
      }, { status: 500 });
    }
    
    console.log('Prisma client generated:', generateOutput);
    
    // Run migrations
    const { stdout: migrateOutput, stderr: migrateError } = await execAsync('npx prisma migrate dev --name add_notification_rules');
    if (migrateError) {
      console.error('Warning during migration (may still be successful):', migrateError);
    }
    
    console.log('Migration applied:', migrateOutput);
    
    return NextResponse.json({
      success: true,
      message: 'Database schema updated with notification rules table',
      generateOutput,
      migrateOutput
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run migrations',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
