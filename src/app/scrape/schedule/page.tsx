'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import NextScanCountdown from '@/components/NextScanCountdown';
import TaskHistoryModal from '@/components/TaskHistoryModal';
import { ScheduledScrapeTask } from '@/types';
import { executeTask, initializeTaskScheduler } from '@/services/task-runner';

export default function ScheduleScrapePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for task history modal
  const [selectedTask, setSelectedTask] = useState<ScheduledScrapeTask | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Form state with default values
  const [formData, setFormData] = useState({
    retailer: 'NetOnNet',
    sourceUrl: 'https://www.netonnet.se/art/datorkomponenter/grafikkort',
    divSelector: '#productList > div',
    updateFrequency: 60, // Default: run every 60 minutes
    priority: 5 // Default priority: medium (scale 1-10)
  });

  // Scheduled tasks state
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledScrapeTask[]>([]);

  // Load saved tasks on component mount and initialize scheduler
  useEffect(() => {
    loadTasks();
    
    // Initialize task scheduler
    if (typeof window !== 'undefined') {
      initializeTaskScheduler();
    }
    
    // Listen for task execution completions
    const handleTaskUpdate = () => {
      loadTasks();
      // Show a notification when a task completes while the page is open
      if (Notification.permission === 'granted') {
        new Notification('GPU Tracker', {
          body: 'A scheduled task has completed',
          icon: '/favicon.ico'
        });
      }
    };
    
    window.addEventListener('taskExecutionCompleted', handleTaskUpdate);
    
    // Request notification permission if possible
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      window.removeEventListener('taskExecutionCompleted', handleTaskUpdate);
    };
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = localStorage.getItem('scheduledScrapeTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        
        // Ensure all tasks have the required fields
        const updatedTasks = tasks.map((task: any) => ({
          ...task,
          priority: task.priority || 5,
          executions: task.executions || []
        }));
        
        setScheduledTasks(updatedTasks);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const saveTasks = (tasks: ScheduledScrapeTask[]) => {
    localStorage.setItem('scheduledScrapeTasks', JSON.stringify(tasks));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Input validation
      if (formData.updateFrequency < 2) {
        throw new Error('Update frequency must be at least 2 minutes');
      }
      
      if (!formData.retailer.trim()) {
        throw new Error('Retailer name is required');
      }
      
      if (!/^https?:\/\//.test(formData.sourceUrl)) {
        throw new Error('Source URL must be a valid URL starting with http:// or https://');
      }
      
      // Create a new scheduled task
      const newTask: ScheduledScrapeTask = {
        id: crypto.randomUUID(), // Generate a unique ID
        retailer: formData.retailer.trim(),
        sourceUrl: formData.sourceUrl.trim(),
        divSelector: formData.divSelector.trim(),
        updateFrequency: formData.updateFrequency,
        priority: formData.priority,
        isActive: true,
        lastRun: new Date().toISOString(),
        executions: [] // Initialize empty executions array
      };
      
      // Add to the list of tasks
      const updatedTasks = [...scheduledTasks, newTask];
      setScheduledTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      // Show success message
      setSuccess('Task scheduled successfully!');
      
      // Reset form fields
      setFormData({
        ...formData,
        retailer: '',
        sourceUrl: '',
        divSelector: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = scheduledTasks.filter(task => task.id !== taskId);
    setScheduledTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const updatedTasks = scheduledTasks.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, isActive: !task.isActive };
    });
    setScheduledTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleRunNow = async (task: ScheduledScrapeTask) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await executeTask(task);
      loadTasks(); // Reload tasks to get updated execution history
      setSuccess(`Task for ${task.retailer} executed successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run task');
      loadTasks(); // Still reload to get the error record
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowHistory = (task: ScheduledScrapeTask) => {
    setSelectedTask(task);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // Helper function to get status badge color based on execution history
  const getStatusBadgeClass = (task: ScheduledScrapeTask) => {
    if (!task.executions || task.executions.length === 0) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const lastExecution = task.executions[0];
    if (!lastExecution?.success) {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-green-100 text-green-800';
  };

  // Helper function to get status text
  const getStatusText = (task: ScheduledScrapeTask) => {
    if (!task.isActive) return 'Paused';
    if (!task.executions || task.executions.length === 0) return 'Active';
    
    const lastExecution = task.executions[0];
    return lastExecution?.success ? 'Active' : 'Error';
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Schedule Regular Scraping Tasks</h1>
      
      <NextScanCountdown tasks={scheduledTasks} />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="retailer" className="block text-sm font-medium text-gray-700 mb-1">
              Retailer Name
            </label>
            <input
              type="text"
              id="retailer"
              placeholder="e.g. NetOnNet, Komplett, Webhallen"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.retailer}
              onChange={(e) => handleInputChange('retailer', e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              id="sourceUrl"
              placeholder="https://www.retailer.com/gpus"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.sourceUrl}
              onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="divSelector" className="block text-sm font-medium text-gray-700 mb-1">
              Div Selector
            </label>
            <input
              type="text"
              id="divSelector"
              placeholder="e.g. .product-item"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.divSelector}
              onChange={(e) => handleInputChange('divSelector', e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              CSS selector for product container elements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="updateFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                Update Frequency (minutes)
              </label>
              <input
                type="number"
                id="updateFrequency"
                min="2" 
                className="w-full border rounded-md px-4 py-2"
                required
                value={formData.updateFrequency}
                onChange={(e) => handleInputChange('updateFrequency', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">
                How often should this task run? Minimum 2 minutes.
              </p>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                max="10"
                className="w-full border rounded-md px-4 py-2"
                required
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">
                Higher number = higher priority when tasks run simultaneously.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Link
              href="/scrape/html"
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Back to Manual Scrape
            </Link>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Scheduling...' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
      
      {scheduledTasks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-lg font-medium mb-4">Scheduled Tasks</h2>
          
          <div className="w-full overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Retailer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Last Run</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.retailer}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 break-all">{task.sourceUrl}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.updateFrequency} min</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.priority || 5}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.isActive ? getStatusBadgeClass(task) : 'bg-gray-100 text-gray-800'}`}>
                          {getStatusText(task)}
                        </span>
                        
                        {task.executions && task.executions.length > 0 && (
                          <button 
                            onClick={() => handleShowHistory(task)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="View execution history"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`${task.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-md text-sm`}
                        >
                          {task.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRunNow(task)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                          disabled={isLoading}
                        >
                          Run Now
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedTask && (
        <TaskHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistoryModal}
          task={selectedTask}
        />
      )}
    </div>
  );
}
