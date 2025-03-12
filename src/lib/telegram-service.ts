import prisma from './db';

/**
 * Send a message to a Telegram chat
 * 
 * @param token Bot token, from @BotFather
 * @param chatId Chat ID to send message to
 * @param message Message text (supports Markdown)
 * @returns Promise with success status and error message if applicable
 */
export async function sendTelegramMessage(
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

/**
 * Send a notification using the configured Telegram bot
 * 
 * @param message Message to send
 * @returns Promise with success status 
 */
export async function sendNotification(message: string): Promise<boolean> {
  try {
    // Get config from database
    const config = await prisma.telegramConfig.findFirst();
    
    // If no config or notifications disabled, skip
    if (!config || !config.isEnabled || !config.chatId) {
      console.log('Telegram notifications not configured or disabled');
      return false;
    }
    
    // Send message
    const result = await sendTelegramMessage(
      config.botToken,
      config.chatId,
      message
    );
    
    return result.success;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}
