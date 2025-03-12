'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { NotificationRule, NotificationConditions } from '@/types';

export default function NotificationsPage() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    conditions: NotificationConditions;
    isActive: boolean;
  }>({
    name: '',
    conditions: {
      brandMatches: [],
      modelContains: [],
      minPrice: undefined,
      maxPrice: undefined,
      mustBeInStock: true,
      retailerIs: []
    },
    isActive: true
  });

  // Load existing notification rules
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      } else {
        console.error('Failed to load notification rules');
      }
    } catch (err) {
      console.error('Error loading notification rules:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Rule name is required');
      }
      
      // At least one condition must be set
      const hasConditions = 
        (formData.conditions.brandMatches && formData.conditions.brandMatches.length > 0) ||
        (formData.conditions.modelContains && formData.conditions.modelContains.length > 0) ||
        formData.conditions.minPrice !== undefined ||
        formData.conditions.maxPrice !== undefined ||
        (formData.conditions.retailerIs && formData.conditions.retailerIs.length > 0);
        
      if (!hasConditions) {
        throw new Error('At least one condition must be set');
      }
      
      // Clean up empty arrays
      const conditions = { ...formData.conditions };
      if (conditions.brandMatches?.length === 0) delete conditions.brandMatches;
      if (conditions.modelContains?.length === 0) delete conditions.modelContains;
      if (conditions.retailerIs?.length === 0) delete conditions.retailerIs;
      
      const apiEndpoint = isEditing ? `/api/notifications/${editingRuleId}` : '/api/notifications';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          conditions,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notification rule');
      }
      
      // Success - reset form and reload rules
      setSuccess(`Notification rule ${isEditing ? 'updated' : 'created'} successfully!`);
      resetForm();
      loadRules();
      
      if (isEditing) {
        setIsEditing(false);
        setEditingRuleId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rule: NotificationRule) => {
    setFormData({
      name: rule.name,
      conditions: rule.conditions,
      isActive: rule.isActive
    });
    setIsEditing(true);
    setEditingRuleId(rule.id);
    
    // Scroll to form
    document.getElementById('notification-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification rule?')) return;
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification rule');
      }
      
      setSuccess('Notification rule deleted successfully!');
      loadRules();
      
      // If editing this rule, reset form
      if (editingRuleId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification rule');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification status');
      }
      
      loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      conditions: {
        brandMatches: [],
        modelContains: [],
        minPrice: undefined,
        maxPrice: undefined,
        mustBeInStock: true,
        retailerIs: []
      },
      isActive: true
    });
    setIsEditing(false);
    setEditingRuleId(null);
  };

  // Fix the any type by using a proper type
  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => {
      if (field.startsWith('conditions.')) {
        const conditionField = field.split('.')[1];
        return {
          ...prev,
          conditions: {
            ...prev.conditions,
            [conditionField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleArrayInputChange = (field: keyof NotificationConditions, value: string) => {
    if (!field.endsWith('Matches') && !field.endsWith('Contains') && !field.endsWith('Is')) return;
    
    setFormData(prev => {
      // Split by commas and trim each value, then filter out empty strings
      const values = value.split(',').map(v => v.trim()).filter(v => v !== '');
      
      return {
        ...prev,
        conditions: {
          ...prev.conditions,
          [field]: values
        }
      };
    });
  };

  // Convert array values back to comma-separated string for input display
  const getArrayFieldValue = (field: keyof NotificationConditions): string => {
    const values = formData.conditions[field] as string[] | undefined;
    return values ? values.join(', ') : '';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notification Rules</h1>
        <Link href="/settings" className="text-blue-500 hover:text-blue-600">
          Back to Settings
        </Link>
      </div>
      
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
      
      <div id="notification-form" className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Notification Rule' : 'Create Notification Rule'}
        </h2>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g. RTX 4090 Under 10000 SEK"
              className="w-full border rounded-md px-4 py-2"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-3">Conditions</h3>
            <p className="text-sm text-gray-500 mb-4">
              Define when you want to receive notifications. A notification will be sent when ALL conditions are met.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brandMatches" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Matches (comma separated)
                </label>
                <input
                  type="text"
                  id="brandMatches"
                  placeholder="e.g. ASUS, MSI, Gigabyte"
                  className="w-full border rounded-md px-4 py-2"
                  value={getArrayFieldValue('brandMatches')}
                  onChange={(e) => handleArrayInputChange('brandMatches', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="modelContains" className="block text-sm font-medium text-gray-700 mb-1">
                  Model Contains (comma separated)
                </label>
                <input
                  type="text"
                  id="modelContains"
                  placeholder="e.g. 4090, 7900 XTX, STRIX"
                  className="w-full border rounded-md px-4 py-2"
                  value={getArrayFieldValue('modelContains')}
                  onChange={(e) => handleArrayInputChange('modelContains', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Price
                </label>
                <input
                  type="number"
                  id="minPrice"
                  placeholder="e.g. 5000"
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.conditions.minPrice || ''}
                  onChange={(e) => handleInputChange('conditions.minPrice', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  placeholder="e.g. 10000"
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.conditions.maxPrice || ''}
                  onChange={(e) => handleInputChange('conditions.maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <label htmlFor="retailerIs" className="block text-sm font-medium text-gray-700 mb-1">
                  Retailer Is (comma separated)
                </label>
                <input
                  type="text"
                  id="retailerIs"
                  placeholder="e.g. NetOnNet, Webhallen"
                  className="w-full border rounded-md px-4 py-2"
                  value={getArrayFieldValue('retailerIs')}
                  onChange={(e) => handleArrayInputChange('retailerIs', e.target.value)}
                />
              </div>
              
              <div className="flex items-center mt-5">
                <input
                  type="checkbox"
                  id="mustBeInStock"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.conditions.mustBeInStock || false}
                  onChange={(e) => handleInputChange('conditions.mustBeInStock', e.target.checked)}
                />
                <label htmlFor="mustBeInStock" className="ml-2 block text-sm text-gray-700">
                  Must be in stock
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Rule is active
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Rule' 
                  : 'Create Rule'
              }
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your Notification Rules</h2>
        
        {rules.length === 0 ? (
          <p className="text-gray-500">You haven&apos;t created any notification rules yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      {rule.lastTriggered && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        {(() => {
                          // Extract and type-safe check brandMatches
                          const brandMatches = rule.conditions.brandMatches;
                          if (brandMatches && brandMatches.length > 0) {
                            return (
                              <p><span className="font-medium">Brand:</span> {brandMatches.join(', ')}</p>
                            );
                          }
                          return null;
                        })()}

                        {(() => {
                          // Extract and type-safe check modelContains
                          const modelContains = rule.conditions.modelContains;
                          if (modelContains && modelContains.length > 0) {
                            return (
                              <p><span className="font-medium">Model contains:</span> {modelContains.join(', ')}</p>
                            );
                          }
                          return null;
                        })()}
                        
                        {rule.conditions.minPrice !== undefined && (
                          <p><span className="font-medium">Min price:</span> {rule.conditions.minPrice}</p>
                        )}
                        
                        {rule.conditions.maxPrice !== undefined && (
                          <p><span className="font-medium">Max price:</span> {rule.conditions.maxPrice}</p>
                        )}
                        
                        {(() => {
                          // Extract and type-safe check retailerIs
                          const retailerIs = rule.conditions.retailerIs;
                          if (retailerIs && retailerIs.length > 0) {
                            return (
                              <p><span className="font-medium">Retailer:</span> {retailerIs.join(', ')}</p>
                            );
                          }
                          return null;
                        })()}
                        
                        {rule.conditions.mustBeInStock && (
                          <p><span className="font-medium">Stock:</span> Must be in stock</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                          className={`${rule.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-md text-sm`}
                        >
                          {rule.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEdit(rule)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
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
        )}
      </div>
    </div>
  );
}
