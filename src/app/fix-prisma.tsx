'use client';

import { useState } from 'react';

export default function FixPrisma() {
  const [status, setStatus] = useState('Click the button to run migrations');
  const [loading, setLoading] = useState(false);
  // Define a proper type for the result
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    details?: string;
    generateOutput?: string;
    migrateOutput?: string;
  } | null>(null);

  const runMigration = async () => {
    try {
      setLoading(true);
      setStatus('Running migration...');
      
      const response = await fetch('/api/migrate');
      const data = await response.json();
      
      setResult(data);
      setStatus(data.success ? 'Migration completed successfully!' : 'Migration failed!');
    } catch (error) {
      setStatus('Error running migration');
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Fix Prisma Client</h1>
      <p className="mb-4">
        This will regenerate your Prisma client and apply the NotificationRule model schema changes.
      </p>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="font-medium">Status: {status}</p>
      </div>
      
      <button
        onClick={runMigration}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Prisma Generate & Migrate'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded max-h-96 overflow-auto">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
