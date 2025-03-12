// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { initializeDatabase } from './db-init';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Initialize the database when this module is imported
// This runs only on server side
if (typeof window === 'undefined') {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('Database initialization completed');
      } else {
        console.error('Database initialization failed - application may not function correctly');
      }
    })
    .catch(error => {
      console.error('Unexpected error during database initialization:', error);
    });
}

export default prisma;