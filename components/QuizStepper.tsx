"use client";

/**
 * QuizStepper Component
 * 
 * Progress indicator "5/12" + back button.
 * Reference: README.md §5.2 - Progress indicator, back button always available.
 * WCAG 2.1 AA compliant with proper progress semantics.
 */

import { useId } from "react";
import { ChevronLeft } from "./icons";

interface QuizStepperProps {
  currentQuestion: number;
  totalQuestions: number;
  onBack: () => void;
  canGoBack: boolean;
}

export function QuizStepper({
  currentQuestion,
  totalQuestions,
  onBack,
  canGoBack,
}: QuizStepperProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const progressId = useId();
  const progressLabelId = useId();

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-4 w-full max-w-lg mx-auto px-4 py-3">
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center justify-center w-11 h-11 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none transition-all touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
          aria-label="Go back to previous question"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Progress Section */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Progress Bar */}
          <div 
            id={progressId}
            role="progressbar"
            aria-valuenow={currentQuestion}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            aria-labelledby={progressLabelId}
            className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          
          {/* Step Counter - also serves as progress label */}
          <span 
            id={progressLabelId}
            className="text-xs font-medium text-zinc-400 dark:text-zinc-500 tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
      </div>
    </div>
  );
}
