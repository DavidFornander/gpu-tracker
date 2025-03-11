import { PrismaClient, ScrapeConfig } from '@prisma/client';
import { scrapeUrl } from './url-scraper';
import { SelectorConfig } from '@/types';

const prisma = new PrismaClient();

// Map to track interval IDs
const taskIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Initialize the task scheduler by setting up intervals for all active scrape configs
 */
export async function initializeScheduler() {
  console.log('[Scheduler] Initializing task scheduler...');
  
  // Clear any existing intervals
  for (const intervalId of taskIntervals.values()) {
    clearInterval(intervalId);
  }
  taskIntervals.clear();
  
  // Get all active scrape configs
  const activeTasks = await prisma.scrapeConfig.findMany({
    where: { 
      isActive: true,
      name: { startsWith: 'Scheduled:' }
    }
  });
  
  console.log(`[Scheduler] Found ${activeTasks.length} active tasks`);
  
  // Set up intervals for each task
  for (const task of activeTasks) {
    scheduleTask(task);
  }
}

/**
 * Schedule a task to run at regular intervals
 */
function scheduleTask(task: ScrapeConfig) {
  // Convert minutes to milliseconds
  const intervalMs = task.updateFrequency * 60 * 1000;
  
  console.log(`[Scheduler] Scheduling task ${task.id} to run every ${task.updateFrequency} minutes`);
  
  // Create an interval
  const intervalId = setInterval(async () => {
    try {
      // Check if task is still active
      const currentTask = await prisma.scrapeConfig.findUnique({
        where: { id: task.id }
      });
      
      if (!currentTask || !currentTask.isActive) {
        console.log(`[Scheduler] Task ${task.id} is no longer active, removing schedule`);
        clearInterval(intervalId);
        taskIntervals.delete(task.id);
        return;
      }
      
      console.log(`[Scheduler] Running scheduled task: ${task.name}`);
      
      // Extract the appropriate selector
      const selectors: SelectorConfig = {
        itemContainer: ((task.selectors as Record<string, unknown>)?.itemContainer as string) || '',
        brand: '',
        model: '',
        price: '',
        stockStatus: ''
      };
      
      // Run the scrape
      const retailerName = task.name.replace('Scheduled: ', '');
      const result = await scrapeUrl(task.url || '', selectors, retailerName);
      
      // Update last run time
      await prisma.scrapeConfig.update({
        where: { id: task.id },
        data: { lastRun: new Date() }
      });
      
      console.log(`[Scheduler] Completed task ${task.id}, found ${result.products.length} products`);
    } catch (error) {
      console.error(`[Scheduler] Error running scheduled task ${task.id}:`, error);
    }
  }, intervalMs);
  
  // Store the interval ID
  taskIntervals.set(task.id, intervalId);
}

/**
 * Add or update a scheduled task
 */
export async function updateTaskSchedule(taskId: string) {
  // Remove any existing schedule
  if (taskIntervals.has(taskId)) {
    clearInterval(taskIntervals.get(taskId)!);
    taskIntervals.delete(taskId);
  }
  
  // Get the task
  const task = await prisma.scrapeConfig.findUnique({
    where: { id: taskId }
  });
  
  // Schedule it if active
  if (task && task.isActive) {
    scheduleTask(task);
  }
}

/**
 * Remove a task from the scheduler
 */
export function removeTaskSchedule(taskId: string) {
  if (taskIntervals.has(taskId)) {
    clearInterval(taskIntervals.get(taskId)!);
    taskIntervals.delete(taskId);
    console.log(`[Scheduler] Removed schedule for task ${taskId}`);
  }
}

// Initialize the scheduler on import
if (typeof window === 'undefined') { // Only run on server
  initializeScheduler()
    .catch(error => console.error('[Scheduler] Failed to initialize scheduler:', error));
}
