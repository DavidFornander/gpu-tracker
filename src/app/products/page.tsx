'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductFilter from '@/components/ProductFilter';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ minPrice: 0, maxPrice: 10000 });
  const [resultsCount, setResultsCount] = useState(0);
  
  // Initial filters from URL params
  const initialFilters = {
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true' ? true : false,
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'price',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  };
  
  const [currentFilters, setCurrentFilters] = useState(initialFilters);
  
  // Function to fetch products with filters
  const fetchProducts = async (filters: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.inStock !== undefined && filters.inStock !== '') params.append('inStock', filters.inStock.toString());
      if (filters.search) params.append('search');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products);
      setBrands(data.meta.brands);
      setPriceRange(data.meta.priceRange);
      setResultsCount(data.meta.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch products on initial load
  useEffect(() => {
    fetchProducts(initialFilters);
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (filters: any) => {
    setCurrentFilters(filters);
    
    // Update URL with filters for bookmarking/sharing
    const params = new URLSearchParams();
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.inStock !== undefined && filters.inStock !== '') params.append('inStock', filters.inStock.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    // Update URL without reload
    router.push(`/products?${params.toString()}`);
    
    // Fetch products with new filters
    fetchProducts(filters);
  };
  
  // Handle export to CSV
  const handleExportCSV = async () => {
    try {
      // Build query string from current filters
      const params = new URLSearchParams();
      if (currentFilters.brand) params.append('brand', currentFilters.brand);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString());
      if (currentFilters.inStock !== undefined && currentFilters.inStock !== '') 
        params.append('inStock', currentFilters.inStock.toString());
      if (currentFilters.search) params.append('search', currentFilters.search);
      
      // Add export format
      params.append('format', 'csv');
      
      // Trigger download
      window.location.href = `/api/products/export?${params.toString()}`;
    } catch (err) {
      console.error('Error exporting to CSV:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GPU Products</h1>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportCSV}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
          >
            Export CSV
          </button>
          <button 
            onClick={() => fetchProducts(currentFilters)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProductFilter 
            brands={brands}
            priceRange={priceRange}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-medium">Products ({resultsCount})</h2>
              <div className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `Showing ${products.length} results`}
              </div>
            </div>
            
            {products.length > 0 ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {isLoading ? (
                  <p>Loading products...</p>
                ) : (
                  <p>No products found matching your criteria.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}