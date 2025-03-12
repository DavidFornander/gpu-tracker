import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Fix: Make params awaitable by using async function and proper typing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Extract id first
  
  try {
    const rule = await prisma.notificationRule.findUnique({
      where: { id }
    });
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error fetching notification rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Extract id first
  
  try {
    const body = await request.json();
    const { name, conditions, isActive } = body;
    
    if (!name || !conditions) {
      return NextResponse.json(
        { error: 'Name and conditions are required' },
        { status: 400 }
      );
    }
    
    const updatedRule = await prisma.notificationRule.update({
      where: { id },
      data: {
        name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conditions: conditions as any, // Type casting for Prisma JSON field
        isActive
      }
    });
    
    return NextResponse.json({ rule: updatedRule });
  } catch (error) {
    console.error('Error updating notification rule:', error);
    return NextResponse.json(
      { error: 'Failed to update notification rule' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Extract id first
  
  try {
    const body = await request.json();
    
    const updatedRule = await prisma.notificationRule.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json({ rule: updatedRule });
  } catch (error) {
    console.error('Error updating notification rule:', error);
    return NextResponse.json(
      { error: 'Failed to update notification rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Extract id first
  
  try {
    await prisma.notificationRule.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification rule' },
      { status: 500 }
    );
  }
}
