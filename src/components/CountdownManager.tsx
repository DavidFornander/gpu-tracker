'use client';

import { useEffect } from 'react';

interface ScheduledTask {
  id: string;
  retailer: string;
  sourceUrl: string;
  divSelector: string;
  updateFrequency: number;
  lastRun?: string;
  isActive: boolean;
}

export default function CountdownManager() {
  useEffect(() => {
    // Check for due tasks every minute
    const checkInterval = setInterval(async () => {
      try {
        // Get tasks from localStorage
        const savedTasksStr = localStorage.getItem('scheduledScrapeTasks');
        if (!savedTasksStr) return;
        
        const tasks: ScheduledTask[] = JSON.parse(savedTasksStr);
        const now = new Date();
        let tasksUpdated = false;
        
        // Check each active task
        for (const task of tasks.filter(t => t.isActive)) {
          if (!task.lastRun) {
            // Task has never run, run it now
            await executeTask(task);
            tasksUpdated = true;
            continue;
          }
          
          const lastRun = new Date(task.lastRun);
          const nextRunTime = new Date(lastRun.getTime() + (task.updateFrequency * 60 * 1000));
          
          // If task is due to run
          if (nextRunTime <= now) {
            console.log(`Task ${task.id} (${task.retailer}) is due to run`);
            await executeTask(task);
            tasksUpdated = true;
          }
        }
        
        // If any tasks were updated, save back to localStorage
        if (tasksUpdated) {
          localStorage.setItem('scheduledScrapeTasks', JSON.stringify(tasks));
        }
        
      } catch (error) {
        console.error('Error checking scheduled tasks:', error);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Function to execute a task
  async function executeTask(task: ScheduledTask) {
    console.log(`Executing task for ${task.retailer}`);
    try {
      const response = await fetch('/api/extract-div', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retailer: task.retailer,
          sourceUrl: task.sourceUrl,
          divSelector: task.divSelector
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run task: ${response.statusText}`);
      }
      
      // Update the last run time
      task.lastRun = new Date().toISOString();
      console.log(`Task for ${task.retailer} completed successfully`);
      
    } catch (error) {
      console.error(`Error executing task for ${task.retailer}:`, error);
    }
  }
  
  // This is a background component, it doesn't render anything
  return null;
}
