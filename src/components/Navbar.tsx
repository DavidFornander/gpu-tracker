import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">GPU Tracker</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/products" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                  Products
                </Link>
                <Link href="/scrape/html" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                  Manual Scrape
                </Link>
                <Link href="/scrape/schedule" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                  Scheduled Scrapes
                </Link>
                <Link href="/notifications" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                  Notifications
                </Link>
                <Link href="/settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
