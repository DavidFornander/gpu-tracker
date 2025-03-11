// src/app/scrape/page.tsx
import Link from 'next/link';

export default function ScrapePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add GPU Source</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/scrape/url" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">URL Scraping</h2>
            <p className="text-gray-600 mb-4">
              Add a retailer URL with pre-set filters for in-stock items. The system will visit the page and extract all GPU products.
            </p>
            <div className="flex justify-end">
              <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded">
                Add URL Source
              </span>
            </div>
          </div>
        </Link>
        
        <Link href="/scrape/html" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">HTML Snippet</h2>
            <p className="text-gray-600 mb-4">
              Paste HTML snippet containing GPU products. This is useful if you have already loaded the page and want to extract data from specific elements.
            </p>
            <div className="flex justify-end">
              <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded">
                Add HTML Source
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}