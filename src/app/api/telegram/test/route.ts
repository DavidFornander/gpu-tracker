import { NextRequest, NextResponse } from 'next/server';

// Create the missing telegram-service functions directly in this file
async function sendTelegramMessage(
  token: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description || 'Unknown Telegram API error' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send Telegram message' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId } = body;
    
    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    // Send test message
    const result = await sendTelegramMessage(
      botToken, 
      chatId, 
      '🔔 *GPU Tracker Test Message*\n\nYour Telegram notifications are working correctly!'
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send test message' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test Telegram connection' },
      { status: 500 }
    );
  }
}
