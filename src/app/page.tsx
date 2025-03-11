import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">GPU Tracker Dashboard</h1>
        <p className="text-gray-600">
          Track GPU prices and availability across multiple retailers.
        </p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New GPU Source</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">URL Scraping</h3>
              <p className="text-sm text-gray-500 mb-2">
                Add a retailer URL with pre-set filters for in-stock items.
              </p>
              <Link 
                href="/scrape/url" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add URL Source
              </Link>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">HTML Snippet</h3>
              <p className="text-sm text-gray-500 mb-2">
                Paste HTML snippet containing GPU products.
              </p>
              <Link 
                href="/scrape/html" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add HTML Source
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="space-y-4">
            <Link 
              href="/products" 
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <span className="font-medium">View All GPUs</span>
              <span className="text-blue-500">→</span>
            </Link>
            <Link 
              href="/alerts" 
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <span className="font-medium">Manage Alerts</span>
              <span className="text-blue-500">→</span>
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <span className="font-medium">Settings</span>
              <span className="text-blue-500">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
