import { ScheduledScrapeTask } from '@/types';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ScheduledScrapeTask;
}

export default function TaskHistoryModal({ isOpen, onClose, task }: TaskHistoryModalProps) {
  if (!isOpen) return null;
  
  // Calculate statistics for the task executions
  const executions = task.executions || [];
  const successRate = executions.length > 0 
    ? Math.round((executions.filter(e => e.success).length / executions.length) * 100)
    : 0;
  
  const avgProductsFound = executions.length > 0
    ? Math.round(executions.reduce((sum, e) => sum + e.productsFound, 0) / executions.length)
    : 0;
  
  const avgDuration = executions.length > 0
    ? Math.round(executions.reduce((sum, e) => sum + e.duration, 0) / executions.length) / 1000
    : 0;
  
  // Rest of the component's render code...
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      {/* Modal content */}
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Modal header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Execution History: {task.retailer}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* No executions message or table */}
        {(!executions.length) ? (
          <p className="text-gray-600">No execution history available.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Showing the last {task.executions.length} executions</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products Found</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {task.executions.map((exec, index) => (
                    <tr key={index} className={exec.success ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(exec.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${exec.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {exec.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {exec.productsFound}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {(exec.duration / 1000).toFixed(2)}s
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {exec.errorMessage || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary stats */}
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Success Rate</h3>
                <p className="text-xl font-bold mt-1">
                  {successRate}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Avg. Products Found</h3>
                <p className="text-xl font-bold mt-1">
                  {avgProductsFound}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Avg. Duration</h3>
                <p className="text-xl font-bold mt-1">
                  {avgDuration.toFixed(2)}s
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
