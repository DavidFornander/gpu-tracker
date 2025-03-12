'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Telegram config state
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    isEnabled: false
  });

  // Load existing config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/telegram/config');
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setTelegramConfig(data.config);
          }
        }
      } catch (err) {
        console.error('Failed to load Telegram config:', err);
      }
    };
    
    loadConfig();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          isEnabled: telegramConfig.isEnabled
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      setSuccess('Telegram settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test connection failed');
      }
      
      setSuccess('Test message sent successfully! Check your Telegram.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInputChange = (field: keyof TelegramConfig, value: string | boolean) => {
    setTelegramConfig({
      ...telegramConfig,
      [field]: value
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Telegram Notifications</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-1">
              Bot Token
            </label>
            <input
              type="text"
              id="botToken"
              placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full border rounded-md px-4 py-2"
              value={telegramConfig.botToken}
              onChange={(e) => handleInputChange('botToken', e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Create a bot using <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@BotFather</a> and paste the token here.
            </p>
          </div>
          
          <div>
            <label htmlFor="chatId" className="block text-sm font-medium text-gray-700 mb-1">
              Chat ID
            </label>
            <input
              type="text"
              id="chatId"
              placeholder="123456789"
              className="w-full border rounded-md px-4 py-2"
              value={telegramConfig.chatId}
              onChange={(e) => handleInputChange('chatId', e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@userinfobot</a> on Telegram to get your Chat ID.
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEnabled"
              checked={telegramConfig.isEnabled}
              onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-700">
              Enable Telegram notifications
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || !telegramConfig.botToken || !telegramConfig.chatId}
              className="px-4 py-2 bg-gray-500 text-white rounded-md disabled:opacity-50 hover:bg-gray-600"
            >
              {testingConnection ? 'Sending...' : 'Test Connection'}
            </button>
            
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        <p className="text-gray-600 mb-4">Configure when you want to receive notifications.</p>
        
        <Link 
          href="/notifications"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-block"
        >
          Manage Notification Rules
        </Link>
      </div>
    </div>
  );
}