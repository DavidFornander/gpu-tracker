import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Get existing config
    const config = await prisma.telegramConfig.findFirst();
    
    return NextResponse.json({ 
      config: config ? {
        botToken: config.botToken,
        chatId: config.chatId || '',
        isEnabled: config.isEnabled
      } : null 
    });
  } catch (error) {
    console.error('Error fetching Telegram config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId, isEnabled } = body;
    
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token is required' },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await prisma.telegramConfig.findFirst();
    
    // Fixed: No need to store the result if we don't use it later
    if (existingConfig) {
      // Update existing config
      await prisma.telegramConfig.update({
        where: { id: existingConfig.id },
        data: {
          botToken,
          chatId: chatId || null,
          isEnabled: isEnabled || false,
        }
      });
    } else {
      // Create new config
      await prisma.telegramConfig.create({
        data: {
          botToken,
          chatId: chatId || null,
          isEnabled: isEnabled || false,
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Telegram config:', error);
    return NextResponse.json(
      { error: 'Failed to save Telegram configuration' },
      { status: 500 }
    );
  }
}
