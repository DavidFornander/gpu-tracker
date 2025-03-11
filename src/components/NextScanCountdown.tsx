'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  tasks: Array<{
    id: string;
    retailer: string;  // Added retailer name for better display
    updateFrequency: number;
    lastRun?: string;
    isActive: boolean;
  }>;
}

export default function NextScanCountdown({ tasks }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextTaskInfo, setNextTaskInfo] = useState<{retailer: string, time: Date} | null>(null);
  
  useEffect(() => {
    // Find next scheduled task
    const calculateNextScan = () => {
      // Filter only active tasks
      const activeTasks = tasks.filter(task => task.isActive);
      
      if (activeTasks.length === 0) {
        setTimeLeft('No active tasks');
        setNextTaskInfo(null);
        return;
      }
      
      let nextScanTime: Date | null = null;
      let nextTask: any = null;
      
      // Calculate next run time for each task
      activeTasks.forEach(task => {
        if (task.lastRun) {
          const lastRun = new Date(task.lastRun);
          const nextRun = new Date(lastRun.getTime() + (task.updateFrequency * 60 * 1000));
          
          if (!nextScanTime || nextRun < nextScanTime) {
            nextScanTime = nextRun;
            nextTask = task;
          }
        }
      });
      
      if (!nextScanTime || !nextTask) {
        setTimeLeft('Will run soon');
        setNextTaskInfo(null);
        return;
      }
      
      // Calculate time left
      const now = new Date();
      const diffMs = nextScanTime.getTime() - now.getTime();
      
      // Set next task info
      setNextTaskInfo({
        retailer: nextTask.retailer,
        time: nextScanTime
      });
      
      if (diffMs <= 0) {
        setTimeLeft('Running now...');
        return;
      }
      
      // Format time remaining
      const diffSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    // Initial calculation
    calculateNextScan();
    
    // Update every second
    const interval = setInterval(calculateNextScan, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [tasks]);
  
  if (!timeLeft) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          <span className="font-medium">Next automatic scan in:</span>
        </div>
        <div className="text-lg font-bold tracking-wider">{timeLeft}</div>
      </div>
      
      {nextTaskInfo && (
        <div className="mt-2 text-sm text-blue-600">
          Next task: {nextTaskInfo.retailer} at {nextTaskInfo.time.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
