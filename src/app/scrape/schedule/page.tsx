'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';

// Define the type for a scheduled scrape task
interface ScheduledScrapeTask {
  id: string;
  retailer: string;
  sourceUrl: string;
  divSelector: string;
  updateFrequency: number; // in minutes
  lastRun?: string;
  isActive: boolean;
}

export default function ScheduleScrapePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state with default values
  const [formData, setFormData] = useState({
    retailer: 'NetOnNet',
    sourceUrl: 'https://www.netonnet.se/art/datorkomponenter/grafikkort',
    divSelector: '#productList > div',
    updateFrequency: 60 // Default: run every 60 minutes
  });

  // Scheduled tasks state
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledScrapeTask[]>([]);

  // Load saved tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // In the future, this would be an API call to load saved tasks
      // For now, we'll load from localStorage
      const savedTasks = localStorage.getItem('scheduledScrapeTasks');
      if (savedTasks) {
        setScheduledTasks(JSON.parse(savedTasks));
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const saveTasks = (tasks: ScheduledScrapeTask[]) => {
    // In the future, this would be an API call to save tasks
    // For now, we'll save to localStorage
    localStorage.setItem('scheduledScrapeTasks', JSON.stringify(tasks));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a new scheduled task
      const newTask: ScheduledScrapeTask = {
        id: crypto.randomUUID(), // Generate a unique ID
        retailer: formData.retailer,
        sourceUrl: formData.sourceUrl,
        divSelector: formData.divSelector,
        updateFrequency: formData.updateFrequency,
        isActive: true,
        lastRun: new Date().toISOString()
      };
      
      // Add to the list of tasks
      const updatedTasks = [...scheduledTasks, newTask];
      setScheduledTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      // Show success message
      setSuccess('Task scheduled successfully!');
      
      // Reset form (optional)
      // setFormData({...});
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
      if (task.id === taskId) {
        return { ...task, isActive: !task.isActive };
      }
      return task;
    });
    setScheduledTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleRunNow = async (task: ScheduledScrapeTask) => {
    setIsLoading(true);
    try {
      // Make API call to run the scrape task immediately
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
        throw new Error('Failed to run task');
      }
      
      // Update last run time
      const updatedTasks = scheduledTasks.map(t => {
        if (t.id === task.id) {
          return { ...t, lastRun: new Date().toISOString() };
        }
        return t;
      });
      
      setScheduledTasks(updatedTasks);
      saveTasks(updatedTasks);
      setSuccess(`Task for ${task.retailer} executed successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Update to full width with no max-width constraint
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Schedule Regular Scraping Tasks</h1>
      
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
          
          <div>
            <label htmlFor="updateFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              Update Frequency (minutes)
            </label>
            <input
              type="number"
              id="updateFrequency"
              min="15"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.updateFrequency}
              onChange={(e) => handleInputChange('updateFrequency', parseInt(e.target.value))}
            />
            <p className="mt-1 text-xs text-gray-500">
              How often should this task run? Minimum 15 minutes.
            </p>
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
          
          {/* Fix table overflow with proper container settings */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  {/* Make Retailer column narrower */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Retailer</th>
                  {/* Allow URL column to wrap text */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">URL</th>
                  {/* Make frequency column narrower */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Last Run</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.retailer}</td>
                    {/* Allow URL text to wrap */}
                    <td className="px-4 py-3 text-sm text-gray-500 break-all">{task.sourceUrl}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.updateFrequency} min</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {task.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {/* Adjust button layout to fit better */}
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
    </div>
  );
}
