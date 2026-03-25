import React from "react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 mb-4">
      <button
        className={`px-4 py-1 rounded-full border text-sm whitespace-nowrap transition-all ${selectedCategory === 'All Categories' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'}`}
        onClick={() => onSelect('All Categories')}
      >
        All Categories
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`px-4 py-1 rounded-full border text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter; 