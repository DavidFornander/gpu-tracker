import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
// Check if migrations have been applied
async function checkMigrationsApplied() {
  try {
    // Try to access the table - if it doesn't exist, will throw error
    await prisma.$queryRaw`SELECT 1 FROM NotificationRule LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    // Check if the table exists first
    if (!await checkMigrationsApplied()) {
      return NextResponse.json({ 
        rules: [],
        needsMigration: true
      });
    }
    
    // Table exists, safely query it
    const rules = await prisma.$queryRaw`SELECT * FROM NotificationRule ORDER BY createdAt DESC`;
    
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching notification rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, conditions, isActive = true } = body;
    
    if (!name || !conditions) {
      return NextResponse.json(
        { error: 'Name and conditions are required' },
        { status: 400 }
      );
    }
    
    // Check if migrations have been applied
    if (!await checkMigrationsApplied()) {
      return NextResponse.json(
        { error: 'Database schema needs migration. Please visit /fix-prisma first.' },
        { status: 400 }
      );
    }
    
    // Create rule using raw SQL to avoid model not found errors
    const id = uuidv4();
    const now = new Date().toISOString();
    const conditionsJson = JSON.stringify(conditions);
    
    await prisma.$executeRaw`
      INSERT INTO NotificationRule (id, name, conditions, isActive, createdAt) 
      VALUES (${id}, ${name}, ${conditionsJson}, ${isActive}, ${now})
    `;
    
    return NextResponse.json({ 
      rule: {
        id,
        name,
        conditions,
        isActive,
        createdAt: now
      } 
    });
  } catch (error) {
    console.error('Error creating notification rule:', error);
    return NextResponse.json(
      { error: 'Failed to create notification rule. Visit /fix-prisma to update the database schema.' },
      { status: 500 }
    );
  }
}
