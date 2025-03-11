import { ScheduledScrapeTask, TaskExecution, QueuedTask } from '@/types';

// Task execution queue
let taskQueue: QueuedTask[] = [];
let isProcessingQueue = false;

// Constants
const TASK_CHECK_INTERVAL = 30000; // Check for tasks every 30 seconds
const MAX_CONCURRENT_TASKS = 2; // Maximum number of concurrent tasks
const STORAGE_KEY = 'scheduledScrapeTasks';
const HISTORY_MAX_ITEMS = 10; // Maximum number of history items to keep per task

/**
 * Initialize the task scheduler
 */
export function initializeTaskScheduler() {
  // Set up periodic task checking
  if (typeof window !== 'undefined') {
    // Register service worker if available
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/task-worker.js')
          .then(registration => {
            console.log('Task Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Task Service Worker registration failed:', error);
          });
      });
    }
    
    // Set up recurring checks using both intervals and worker messages
    setInterval(checkScheduledTasks, TASK_CHECK_INTERVAL);
    
    // Also store timestamps in localStorage for when the page is reloaded
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('lastTaskCheck', new Date().toISOString());
    });
    
    // On page load, check if we missed any tasks
    const lastCheck = localStorage.getItem('lastTaskCheck');
    if (lastCheck) {
      const timeSinceLastCheck = Date.now() - new Date(lastCheck).getTime();
      if (timeSinceLastCheck > TASK_CHECK_INTERVAL) {
        checkScheduledTasks();
      }
    }
    
    // Register for visibility change events
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkScheduledTasks();
      }
    });
  }
}

/**
 * Check for tasks that need to be run
 */
export async function checkScheduledTasks() {
  try {
    const tasksData = localStorage.getItem(STORAGE_KEY);
    if (!tasksData) return;
    
    const tasks = JSON.parse(tasksData) as ScheduledScrapeTask[];
    const now = new Date();
    
    // Find tasks that need to be run
    for (const task of tasks) {
      if (!task.isActive) continue;
      
      const lastRun = task.lastRun ? new Date(task.lastRun) : null;
      if (!lastRun || now.getTime() - lastRun.getTime() >= task.updateFrequency * 60 * 1000) {
        // Add to execution queue if not already queued
        if (!taskQueue.some(queuedTask => queuedTask.taskId === task.id)) {
          taskQueue.push({
            taskId: task.id,
            retailer: task.retailer,
            scheduledTime: now,
            priority: task.priority || 5 // Default priority: 5 (medium)
          });
        }
      }
    }
    
    // Sort queue by priority (higher first) and then by scheduled time (earlier first)
    taskQueue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.scheduledTime.getTime() - b.scheduledTime.getTime(); // Earlier time first
    });
    
    // Process queue if not already doing so
    if (!isProcessingQueue && taskQueue.length > 0) {
      processTaskQueue(tasks);
    }
    
  } catch (error) {
    console.error('Error checking scheduled tasks:', error);
  }
}

/**
 * Process the task queue
 */
async function processTaskQueue(tasks: ScheduledScrapeTask[]) {
  if (taskQueue.length === 0 || isProcessingQueue) return;
  
  isProcessingQueue = true;
  
  try {
    // Process up to MAX_CONCURRENT_TASKS
    const tasksToProcess = taskQueue.slice(0, MAX_CONCURRENT_TASKS);
    const remainingTasks = taskQueue.slice(MAX_CONCURRENT_TASKS);
    taskQueue = remainingTasks;
    
    // Execute tasks in parallel
    await Promise.all(tasksToProcess.map(queuedTask => {
      const task = tasks.find(t => t.id === queuedTask.taskId);
      if (task) {
        return executeTask(task);
      }
      return Promise.resolve();
    }));
    
    // Continue processing remaining tasks
    if (taskQueue.length > 0) {
      processTaskQueue(tasks);
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Execute a single task
 */
export async function executeTask(task: ScheduledScrapeTask): Promise<void> {
  console.log(`Executing task: ${task.retailer}`);
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/extract-div', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        retailer: task.retailer,
        sourceUrl: task.sourceUrl,
        divSelector: task.divSelector
      })
    });
    
    const result = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Create execution record
    const execution: TaskExecution = {
      timestamp: new Date().toISOString(),
      success: response.ok,
      productsFound: result.products?.length || 0,
      duration
    };
    
    if (!response.ok) {
      execution.errorMessage = result.error || result.message || 'Unknown error';
    }
    
    // Update task in storage
    await updateTaskExecution(task.id, execution);
    
    return;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Create failed execution record
    const execution: TaskExecution = {
      timestamp: new Date().toISOString(),
      success: false,
      productsFound: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
    
    // Update task in storage
    await updateTaskExecution(task.id, execution);
    
    throw error;
  }
}

/**
 * Update task execution history
 */
async function updateTaskExecution(taskId: string, execution: TaskExecution): Promise<void> {
  const tasksData = localStorage.getItem(STORAGE_KEY);
  if (!tasksData) return;
  
  const tasks = JSON.parse(tasksData) as ScheduledScrapeTask[];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex >= 0) {
    const task = tasks[taskIndex];
    
    // Initialize executions array if it doesn't exist
    if (!task.executions) {
      task.executions = [];
    }
    
    // Add the new execution and limit history size
    task.executions.unshift(execution);
    if (task.executions.length > HISTORY_MAX_ITEMS) {
      task.executions = task.executions.slice(0, HISTORY_MAX_ITEMS);
    }
    
    // Update last run time
    task.lastRun = execution.timestamp;
    
    // Update tasks in storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    
    // Broadcast an event to update any open UIs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskExecutionCompleted', { 
        detail: { taskId, execution } 
      }));
    }
  }
}

// Initialize the scheduler
initializeTaskScheduler();
