"use client";

/**
 * Slider Component
 * 
 * 1-10 range slider with labels.
 * WCAG 2.1 AA compliant with proper ARIA attributes.
 */

import { useId } from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel: string;
  rightLabel: string;
  centerLabel?: string;
  /** Accessible name for the slider - describes what's being selected */
  name?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  leftLabel,
  rightLabel,
  centerLabel,
  name,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const sliderId = useId();
  const descriptionId = useId();
  
  // Build descriptive aria-label
  const ariaLabel = name || `Select a value from ${leftLabel} to ${rightLabel}`;
  
  // Build value text for screen readers
  const getValueText = () => {
    const normalizedValue = (value - min) / (max - min);
    if (normalizedValue <= 0.3) return `${value}: ${leftLabel}`;
    if (normalizedValue >= 0.7) return `${value}: ${rightLabel}`;
    if (centerLabel) return `${value}: ${centerLabel}`;
    return `${value}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full" role="group" aria-labelledby={descriptionId}>
      {/* Slider Track */}
      <div className="relative pt-2 pb-8">
        <div className="relative">
          {/* Track background */}
          <div className="absolute inset-0 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          
          {/* Filled track */}
          <div 
            className="absolute h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-100"
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          />
          
          {/* Native input for interaction */}
          <input
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="relative w-full h-2 appearance-none cursor-pointer bg-transparent slider-thumb z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 rounded-full"
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={getValueText()}
          />
        </div>
        
        {/* Value indicator */}
        <div 
          className="absolute top-10 transform -translate-x-1/2 text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-all duration-100"
          style={{ left: `${percentage}%` }}
          aria-hidden="true"
        >
          {value}
        </div>
      </div>

      {/* Labels */}
      <div 
        id={descriptionId}
        className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400"
      >
        <span className="max-w-[30%] text-left">{leftLabel}</span>
        {centerLabel && (
          <span className="max-w-[30%] text-center">{centerLabel}</span>
        )}
        <span className="max-w-[30%] text-right">{rightLabel}</span>
      </div>
    </div>
  );
}
