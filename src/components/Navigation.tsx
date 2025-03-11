'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  children: React.ReactNode;
}

function NavItem({ href, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'bg-gray-900 text-white' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navigation() {
  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white text-xl font-bold">GPU Tracker</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavItem href="/">Dashboard</NavItem>
                <NavItem href="/products">Products</NavItem>
                <NavItem href="/scrape">Add Source</NavItem>
                <NavItem href="/alerts">Alerts</NavItem>
                <NavItem href="/settings">Settings</NavItem>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}