"use client";

/**
 * SingleSelect Component
 * 
 * Radio-button style single selection.
 * Styled as cards for better mobile tap targets.
 * WCAG 2.1 AA compliant with proper radiogroup semantics.
 */

import { useId } from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SingleSelectProps<T extends string> {
  options: SelectOption<T>[];
  selected: T | undefined;
  onChange: (value: T) => void;
  /** Accessible label for the group */
  groupLabel?: string;
}

export function SingleSelect<T extends string>({
  options,
  selected,
  onChange,
  groupLabel = "Select an option",
}: SingleSelectProps<T>) {
  const groupId = useId();
  
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;
    
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
        break;
    }
    
    if (nextIndex !== null) {
      onChange(options[nextIndex].value);
      // Focus the next option
      const nextButton = document.querySelector(
        `[data-radio-index="${nextIndex}"]`
      ) as HTMLButtonElement;
      nextButton?.focus();
    }
  };
  
  return (
    <div 
      role="radiogroup" 
      aria-labelledby={groupId}
      className="flex flex-col gap-3"
    >
      <span id={groupId} className="sr-only">{groupLabel}</span>
      
      {options.map((option, index) => {
        const isSelected = selected === option.value;
        const optionId = `${groupId}-option-${index}`;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-radio-index={index}
            tabIndex={isSelected || (!selected && index === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative flex flex-col items-start text-left px-5 py-4 rounded-2xl
              transition-all duration-150 min-h-[56px] w-full
              border-2
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2
              ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-500"
              }
            `}
          >
            <span className="font-medium text-base">{option.label}</span>
            {option.description && (
              <span
                className={`text-sm mt-1 ${
                  isSelected
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

