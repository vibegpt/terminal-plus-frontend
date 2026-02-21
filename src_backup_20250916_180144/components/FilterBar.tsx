import React from 'react';
import type { FilterBarProps } from '../types/component.types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Search } from 'lucide-react';

// Helper function to count active filters properly
const getActiveFilterCount = (filters: FilterBarProps['filters']): number => {
  let count = 0;
  if (filters.categories.length > 0) count++;
  if (filters.terminals.length > 0) count++;
  if (filters.priceRange) count++;
  if (filters.accessibility) count++;
  if (filters.searchQuery && filters.searchQuery.trim()) count++;
  if (filters.rating && filters.rating > 0) count++;
  return count;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  availableCategories,
  availableTerminals,
  onFilterChange,
  onReset,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <Input
            placeholder="Search amenities..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Category Filter */}
        <Select
          placeholder="Categories"
          multiple
          value={filters.categories}
          onChange={(value: any) => onFilterChange('categories', value as string[])}
          options={availableCategories.map(cat => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1)
          }))}
        />
        {/* Terminal Filter */}
        <Select
          placeholder="Terminals"
          multiple
          value={filters.terminals}
          onChange={(value: any) => onFilterChange('terminals', value as string[])}
          options={availableTerminals.map(term => ({
            value: term,
            label: term
          }))}
        />
        {/* Price Range Filter */}
        <Select
          placeholder="Price Range"
          value={filters.priceRange || ''}
          onChange={(value: any) => onFilterChange('priceRange', value as any)}
          options={[
            { value: 'budget', label: 'Budget' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'premium', label: 'Premium' }
          ]}
        />
        {/* Accessibility Filter */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="accessibility"
            checked={filters.accessibility || false}
            onChange={(checked: boolean) => onFilterChange('accessibility', checked)}
          />
          <label htmlFor="accessibility" className="text-sm font-medium">
            Accessibility Features
          </label>
        </div>
      </div>
      {/* Filter Actions */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <span className="text-sm text-gray-500">
          Active filters: {getActiveFilterCount(filters)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}; 