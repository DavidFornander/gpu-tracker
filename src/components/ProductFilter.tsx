// src/components/ProductFilter.tsx
'use client';

import { useState, FormEvent } from 'react';

interface ProductFilterProps {
  brands: string[];
  priceRange: { minPrice: number; maxPrice: number };
  onFilterChange: (filters: any) => void;
  isLoading: boolean;
}

export default function ProductFilter({ 
  brands, 
  priceRange, 
  onFilterChange, 
  isLoading 
}: ProductFilterProps) {
  const [filters, setFilters] = useState({
    brand: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    search: '',
    sortBy: 'price',
    sortOrder: 'asc'
  });

  const handleInputChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Convert values to appropriate types
    const processedFilters = {
      ...filters,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice as string) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice as string) : undefined,
    };
    
    onFilterChange(processedFilters);
  };

  const handleReset = () => {
    setFilters({
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      search: '',
      sortBy: 'price',
      sortOrder: 'asc'
    });
    
    onFilterChange({
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      search: '',
      sortBy: 'price',
      sortOrder: 'asc'
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4">Filters</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <select 
            className="w-full border rounded px-3 py-2"
            value={filters.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="number" 
              placeholder={`Min (${priceRange?.minPrice ?? 0})`} 
              className="border rounded px-3 py-2"
              value={filters.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              min={0}
            />
            <input 
              type="number" 
              placeholder={`Max (${priceRange?.maxPrice ?? 10000})`} 
              className="border rounded px-3 py-2"
              value={filters.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              min={0}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Search
          </label>
          <input 
            type="text" 
            placeholder="Search models..." 
            className="w-full border rounded px-3 py-2"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <input 
            id="inStock" 
            type="checkbox" 
            className="h-4 w-4 border-gray-300 rounded"
            checked={filters.inStock}
            onChange={(e) => handleInputChange('inStock', e.target.checked)}
          />
          <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
            In Stock Only
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.sortBy}
              onChange={(e) => handleInputChange('sortBy', e.target.value)}
            >
              <option value="price">Price</option>
              <option value="dateAdded">Date Added</option>
            </select>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.sortOrder}
              onChange={(e) => handleInputChange('sortOrder', e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
            disabled={isLoading}
          >
            Reset Filters
          </button>
        </div>
      </form>
    </div>
  );
}