'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { type KnowledgeCategory, type CategoryInfo, KNOWLEDGE_CATEGORIES } from '@/types/game.types';

interface CategorySelectorProps {
  /** Currently selected categories */
  selectedCategories: KnowledgeCategory[];
  /** Callback when selection changes */
  onCategoriesChange: (categories: KnowledgeCategory[]) => void;
  /** Custom text for "other" category */
  customCategoryText: string;
  /** Callback when custom text changes */
  onCustomTextChange: (text: string) => void;
}

/**
 * CategorySelector - Multi-select category chooser with colorful cards
 */
export const CategorySelector: FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoriesChange,
  customCategoryText,
  onCustomTextChange,
}) => {
  const handleCategoryToggle = (categoryId: KnowledgeCategory) => {
    if (selectedCategories.includes(categoryId)) {
      // Don't allow deselecting if it's the last one
      if (selectedCategories.length > 1) {
        onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
      }
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleSelectAll = () => {
    onCategoriesChange(KNOWLEDGE_CATEGORIES.map(cat => cat.id));
  };

  const isAllSelected = selectedCategories.length === KNOWLEDGE_CATEGORIES.length;

  return (
    <div className="space-y-4">
      {/* Header with Select All */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          🎯 בחר תחומי ידע
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSelectAll}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isAllSelected 
              ? 'bg-[var(--color-accent)] text-[var(--text-primary)]' 
              : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
          }`}
        >
          {isAllSelected ? '✓ הכל נבחר' : 'בחר הכל'}
        </motion.button>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {KNOWLEDGE_CATEGORIES.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategories.includes(category.id)}
            onToggle={() => handleCategoryToggle(category.id)}
            index={index}
          />
        ))}
      </div>

      {/* Custom text for "other" category */}
      {selectedCategories.includes('other') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          <label 
            htmlFor="custom-category"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
          >
            ✏️ פרט נושאים נוספים (אופציונלי)
          </label>
          <input
            id="custom-category"
            type="text"
            value={customCategoryText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder="למשל: מדע, טבע, גיאוגרפיה..."
            className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[var(--color-blue)] focus:outline-none transition-colors bg-white"
          />
        </motion.div>
      )}
    </div>
  );
};

// Internal CategoryCard component
interface CategoryCardProps {
  category: CategoryInfo;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

const CategoryCard: FC<CategoryCardProps> = ({
  category,
  isSelected,
  onToggle,
  index,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className={`relative p-4 rounded-2xl text-center transition-all ${
        isSelected 
          ? 'shadow-lg' 
          : 'bg-white shadow-md hover:shadow-lg'
      }`}
      style={{
        backgroundColor: isSelected ? category.color : undefined,
        border: isSelected ? 'none' : `3px solid ${category.color}20`,
      }}
    >
      {/* Checkmark indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 start-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <span className="text-sm" style={{ color: category.color }}>✓</span>
        </motion.div>
      )}

      {/* Emoji */}
      <motion.span
        animate={{ 
          scale: isSelected ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
        className="text-4xl block mb-2"
      >
        {category.emoji}
      </motion.span>

      {/* Label */}
      <span 
        className={`font-semibold text-base ${
          isSelected ? 'text-white' : 'text-[var(--text-primary)]'
        }`}
      >
        {category.label}
      </span>
    </motion.button>
  );
};

