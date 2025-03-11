'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextScanCountdown from '@/components/NextScanCountdown';
import { ScheduledScrapeTask } from '@/types'; // Import the correct type from types file

export default function Home() {
  // Update type to match the expected interface with priority and executions
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledScrapeTask[]>([]);
  
  // Load scheduled tasks from localStorage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('scheduledScrapeTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        // Ensure all tasks have the required fields for ScheduledScrapeTask
        const enhancedTasks = tasks.map((task: any) => ({
          ...task,
          priority: task.priority || 5, // Default priority if missing
          executions: task.executions || [] // Default empty executions array if missing
        }));
        setScheduledTasks(enhancedTasks);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">GPU Price Tracker</h1>
      
      {/* Only show countdown if there are active tasks */}
      {scheduledTasks.length > 0 && scheduledTasks.some(task => task.isActive) && (
        <NextScanCountdown tasks={scheduledTasks} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/products" 
          className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-all">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">View Products</h2>
          <p className="text-gray-600">See all tracked GPUs and their current prices</p>
        </Link>
        
        <Link href="/scrape/html" 
          className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-all">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Manual Scrape</h2>
          <p className="text-gray-600">Extract products from a website right now</p>
        </Link>
        
        <Link href="/scrape/schedule" 
          className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-all">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold mb-2">Scheduled Scrapes</h2>
          <p className="text-gray-600">Set up automatic tracking of GPU prices</p>
        </Link>
        
        <Link href="/settings" 
          className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-all">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold mb-2">Settings</h2>
          <p className="text-gray-600">Configure application settings</p>
        </Link>
      </div>
    </div>
  );
}
