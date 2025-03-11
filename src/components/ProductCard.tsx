// src/components/ProductCard.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    price: number;
    currency: string;
    inStock: boolean;
    retailer: string;
    url: string;
    dateAdded: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  }).format(product.price);
  
  const dateAdded = new Date(product.dateAdded);
  const timeAgo = formatDistanceToNow(dateAdded, { addSuffix: true });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={`px-4 py-2 ${product.inStock ? 'bg-green-50' : 'bg-red-50'} border-b`}>
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
          product.inStock 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
        <span className="float-right text-sm text-gray-500">
          {product.retailer}
        </span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {product.brand}
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formattedPrice}
          </span>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-3 line-clamp-2" title={product.model}>
          {product.model}
        </h3>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500" title={dateAdded.toLocaleString()}>
            Added {timeAgo}
          </span>
          
          <Link
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}