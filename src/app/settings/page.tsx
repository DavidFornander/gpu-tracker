// src/app/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-white rounded-lg shadow divide-y">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">General Settings</h2>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="defaultUpdateFreq" className="block text-sm font-medium text-gray-700 mb-1">
                Default Update Frequency (minutes)
              </label>
              <input
                type="number"
                id="defaultUpdateFreq"
                defaultValue={60}
                min={5}
                className="border rounded-md px-3 py-2 w-full max-w-xs"
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Telegram Integration</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Configure Telegram integration to receive price alerts on your mobile device.
            </p>
          </div>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="telegramToken" className="block text-sm font-medium text-gray-700 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                id="telegramToken"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="border rounded-md px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label htmlFor="telegramChatId" className="block text-sm font-medium text-gray-700 mb-1">
                Telegram Chat ID
              </label>
              <input
                type="text"
                id="telegramChatId"
                placeholder="Your Chat ID"
                className="border rounded-md px-3 py-2 w-full max-w-xs"
              />
            </div>
            
            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
              >
                Test Connection
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save Telegram Settings
              </button>
            </div>
          </form>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Data Management</h2>
          
          <div className="flex space-x-2">
            <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded">
              Export Data (CSV)
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded">
              Import Data
            </button>
            <button className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}