// src/app/alerts/page.tsx
import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Price Alerts</h1>
        <Link 
          href="/alerts/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Alert
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Your Alerts</h2>
        </div>
        
        <div className="p-6 text-center text-gray-500">
          No alerts configured yet. Create an alert to get notified when GPU prices drop.
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="font-medium mb-4">Telegram Integration</h2>
        
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Receive price alerts directly on Telegram. Configure your Telegram bot integration to get notifications when prices drop below your thresholds.
            </p>
            <Link 
              href="/settings/telegram" 
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              Configure Telegram →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}