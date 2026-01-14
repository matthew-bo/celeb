"use client";

/**
 * ToggleList Component
 * 
 * Multi-select toggles for boundaries and practical constraints.
 * Reference: README.md §6 Q9, Q10.
 * WCAG 2.1 AA compliant with proper checkbox semantics.
 */

import { useId } from "react";
import { Check } from "./icons";

interface ToggleOption<T extends string> {
  field: T;
  label: string;
  defaultOn?: boolean;
}

interface ToggleListProps<T extends string> {
  options: ToggleOption<T>[];
  values: Partial<Record<T, boolean>>;
  onChange: (field: T, value: boolean) => void;
  /** Accessible label for the group */
  groupLabel?: string;
}

export function ToggleList<T extends string>({
  options,
  values,
  onChange,
  groupLabel = "Select options",
}: ToggleListProps<T>) {
  const groupId = useId();
  
  // Count selected items for screen reader announcement
  const selectedCount = options.filter(
    (opt) => values[opt.field] ?? opt.defaultOn ?? false
  ).length;

  return (
    <div 
      role="group" 
      aria-labelledby={groupId}
      className="flex flex-col gap-2"
    >
      <span id={groupId} className="sr-only">
        {groupLabel}. {selectedCount} of {options.length} selected.
      </span>
      
      {options.map((option) => {
        const isOn = values[option.field] ?? option.defaultOn ?? false;

        return (
          <button
            key={option.field}
            type="button"
            role="checkbox"
            aria-checked={isOn}
            onClick={() => onChange(option.field, !isOn)}
            className={`
              flex items-center gap-4 px-4 py-4 rounded-xl w-full text-left
              transition-all duration-150 min-h-[56px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2
              ${
                isOn
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
              }
              border border-zinc-200 dark:border-zinc-700
            `}
          >
            {/* Checkbox indicator */}
            <div
              className={`
                flex items-center justify-center w-6 h-6 rounded-md shrink-0
                transition-all duration-150
                ${
                  isOn
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-2 border-zinc-300 dark:border-zinc-600"
                }
              `}
              aria-hidden="true"
            >
              {isOn && <Check className="w-4 h-4" />}
            </div>
            
            {/* Label */}
            <span
              className={`text-base ${
                isOn
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

