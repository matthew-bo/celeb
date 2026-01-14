"use client";

/**
 * ChoiceChips Component
 * 
 * Multi-select chips with optional max selection limit.
 * Reference: README.md §6 Q1 - max 2 selection.
 * WCAG 2.1 AA compliant.
 */

import { useId } from "react";
import { Check } from "./icons";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceChipsProps<T extends string> {
  options: ChipOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  maxSelect?: number;
  /** Accessible label for the group */
  groupLabel?: string;
}

export function ChoiceChips<T extends string>({
  options,
  selected,
  onChange,
  maxSelect,
  groupLabel = "Select options",
}: ChoiceChipsProps<T>) {
  const groupId = useId();
  const instructionsId = useId();
  
  const handleToggle = (value: T) => {
    const isSelected = selected.includes(value);
    
    if (isSelected) {
      // Remove from selection
      onChange(selected.filter((v) => v !== value));
    } else {
      // Add to selection (respecting max)
      if (maxSelect && selected.length >= maxSelect) {
        // Replace oldest selection with new one
        onChange([...selected.slice(1), value]);
      } else {
        onChange([...selected, value]);
      }
    }
  };

  const atMaxSelection = maxSelect !== undefined && selected.length >= maxSelect;
  const selectedCount = selected.length;
  const selectionStatus = maxSelect 
    ? `${selectedCount} of ${maxSelect} selected` 
    : `${selectedCount} selected`;

  return (
    <div 
      role="group" 
      aria-labelledby={groupId}
      aria-describedby={maxSelect ? instructionsId : undefined}
      className="flex flex-wrap gap-2 sm:gap-3"
    >
      {/* Hidden label for screen readers */}
      <span id={groupId} className="sr-only">{groupLabel}. {selectionStatus}</span>
      
      {options.map((option) => {
        const isSelected = selected.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-sm sm:text-base font-medium
              transition-all duration-150 min-h-[44px] touch-manipulation active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2
              ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-2 ring-zinc-900 dark:ring-zinc-100"
                  : atMaxSelection && !isSelected
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }
            `}
            aria-pressed={isSelected}
            aria-label={`${option.label}${isSelected ? ", selected" : ""}`}
          >
            {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
      
      {maxSelect && (
        <p 
          id={instructionsId}
          className="w-full text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 mt-1"
          aria-live="polite"
        >
          {atMaxSelection 
            ? "Tap another to swap" 
            : `Pick up to ${maxSelect}`}
        </p>
      )}
    </div>
  );
}

