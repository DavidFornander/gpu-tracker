import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from './db';

const execPromise = promisify(exec);

/**
 * Initialize database - checks if the database file exists and creates it if needed
 */
export async function initializeDatabase() {
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
          throw new Error('Could not initialize the database');
        }
      }
    }
    
    // Verify database connection
    await prisma.$connect();
    console.log('Database connection verified');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}
