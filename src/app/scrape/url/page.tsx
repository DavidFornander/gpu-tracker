'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function ScrapeUrlPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    url: '',
    retailer: '',
    selectors: {
      itemContainer: '.product-item',
      brand: '.product-brand',
      model: '.product-name',
      price: '.product-price',
      stockStatus: '.product-stock'
    },
    updateFrequency: 60 // Default update frequency in minutes
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scrape/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to scrape URL (Status: ${response.status})`);
      }
      
      // Redirect to products page after successful scraping
      router.push('/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process URL');
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

  const handleSelectorChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      selectors: {
        ...formData.selectors,
        [field]: value
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add URL for Scraping</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Retailer URL
            </label>
            <input
              type="url"
              id="url"
              placeholder="https://www.retailer.com/gpus"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL that already has filters applied for in-stock GPUs
            </p>
          </div>
          
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selector Configuration
            </label>
            <div className="space-y-4 border rounded-md p-4 bg-gray-50">
              <div>
                <label htmlFor="itemContainer" className="block text-xs font-medium text-gray-500 mb-1">
                  Item Container Selector
                </label>
                <input
                  type="text"
                  id="itemContainer"
                  placeholder=".product-item"
                  className="w-full border rounded-md px-4 py-2 text-sm"
                  value={formData.selectors.itemContainer}
                  onChange={(e) => handleSelectorChange('itemContainer', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brandSelector" className="block text-xs font-medium text-gray-500 mb-1">
                    Brand Selector
                  </label>
                  <input
                    type="text"
                    id="brandSelector"
                    placeholder=".product-brand"
                    className="w-full border rounded-md px-4 py-2 text-sm"
                    value={formData.selectors.brand}
                    onChange={(e) => handleSelectorChange('brand', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="modelSelector" className="block text-xs font-medium text-gray-500 mb-1">
                    Model Selector
                  </label>
                  <input
                    type="text"
                    id="modelSelector"
                    placeholder=".product-name"
                    className="w-full border rounded-md px-4 py-2 text-sm"
                    value={formData.selectors.model}
                    onChange={(e) => handleSelectorChange('model', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="priceSelector" className="block text-xs font-medium text-gray-500 mb-1">
                    Price Selector
                  </label>
                  <input
                    type="text"
                    id="priceSelector"
                    placeholder=".product-price"
                    className="w-full border rounded-md px-4 py-2 text-sm"
                    value={formData.selectors.price}
                    onChange={(e) => handleSelectorChange('price', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="stockSelector" className="block text-xs font-medium text-gray-500 mb-1">
                    Stock Status Selector
                  </label>
                  <input
                    type="text"
                    id="stockSelector"
                    placeholder=".product-stock"
                    className="w-full border rounded-md px-4 py-2 text-sm"
                    value={formData.selectors.stockStatus}
                    onChange={(e) => handleSelectorChange('stockStatus', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="updateFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              Update Frequency (minutes)
            </label>
            <input
              type="number"
              id="updateFrequency"
              min="5"
              className="w-full border rounded-md px-4 py-2"
              value={formData.updateFrequency}
              onChange={(e) => handleInputChange('updateFrequency', parseInt(e.target.value))}
            />
            <p className="mt-1 text-xs text-gray-500">
              How often to check for price and availability updates
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}