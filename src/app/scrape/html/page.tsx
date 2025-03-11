'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function ScrapeHtmlPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialResponse, setTrialResponse] = useState<string | null>(null);
  
  // Update with default values for NetOnNet
  const [formData, setFormData] = useState({
    retailer: 'NetOnNet',
    sourceUrl: 'https://www.netonnet.se/art/datorkomponenter/grafikkort?page=1&pageSize=24&filter=259111355',
    divSelector: '#productList > div'
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/extract-div', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retailer: formData.retailer,
          sourceUrl: formData.sourceUrl,
          divSelector: formData.divSelector
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract products from the website HTML');
      }
      
      // Redirect to products page after successful extraction
      router.push('/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrial = async () => {
    setIsLoading(true);
    setError(null);
    setTrialResponse(null);
    try {
      const response = await fetch('/api/extract-div', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retailer: formData.retailer,
          sourceUrl: formData.sourceUrl,
          divSelector: formData.divSelector
        }),
      });
      const data = await response.json();
      setTrialResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setTrialResponse(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scrape Website for Products</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="retailer" className="block text-sm font-medium text-gray-700 mb-1">
              Retailer Name
            </label>
            <input
              type="text"
              id="retailer"
              placeholder="e.g. Newegg, Amazon, Best Buy"
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
              Tag for the container div to grab from the website automatically.
              <br />
              To obtain this tag, right-click the container element on the website, choose &quot;Inspect&quot;, and copy its CSS selector.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
              onClick={handleTrial}
              disabled={isLoading}
            >
              Trail Request
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Extract Products'}
            </button>
          </div>
        </form>
        {trialResponse && (
          <div className="mt-4 p-4 bg-gray-100 border rounded">
            <pre>{trialResponse}</pre>
          </div>
        )}
      </div>
    </div>
  );
}