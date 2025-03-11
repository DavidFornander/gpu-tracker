'use client';

import { useEffect } from 'react';
import { ScheduledScrapeTask, TaskExecution } from '@/types';

export default function CountdownManager() {
  useEffect(() => {
    // Check for due tasks every minute
    const checkInterval = setInterval(async () => {
      try {
        // Get tasks from localStorage
        const savedTasksStr = localStorage.getItem('scheduledScrapeTasks');
        if (!savedTasksStr) return;
        
        const tasks: ScheduledScrapeTask[] = JSON.parse(savedTasksStr);
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
  async function executeTask(task: ScheduledScrapeTask) {
    console.log(`Executing task for ${task.retailer}`);
    try {
      const startTime = Date.now();
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
      
      const result = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create execution record
      const execution: TaskExecution = {
        timestamp: new Date().toISOString(),
        success: response.ok,
        productsFound: result.products?.length || 0,
        errorMessage: response.ok ? undefined : (result.error || 'Unknown error'),
        duration
      };
      
      // Add to task's execution history
      if (!task.executions) task.executions = [];
      task.executions.unshift(execution);
      
      // Limit history size
      if (task.executions.length > 10) {
        task.executions = task.executions.slice(0, 10);
      }
      
      // Update the last run time
      task.lastRun = new Date().toISOString();
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('taskExecutionCompleted', { 
        detail: { taskId: task.id } 
      }));
      
    } catch (error) {
      console.error(`Error executing task for ${task.retailer}:`, error);
      
      // Record the failure
      const execution: TaskExecution = {
        timestamp: new Date().toISOString(),
        success: false,
        productsFound: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration: 0
      };
      
      // Add to task's execution history
      if (!task.executions) task.executions = [];
      task.executions.unshift(execution);
      
      // Update the last run time despite error
      task.lastRun = new Date().toISOString();
    }
  }
  
  // This is a background component, it doesn't render anything
  return null;
}
