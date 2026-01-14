"use client";

/**
 * QuestionCard Component
 * 
 * Container for quiz questions with headline + subline.
 * Editorial styling per README.md §5, §9.
 */

import { ReactNode } from "react";

interface QuestionCardProps {
  headline: string;
  subline: string;
  children: ReactNode;
  optional?: boolean;
}

export function QuestionCard({
  headline,
  subline,
  children,
  optional,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto px-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        {optional && (
          <span className="inline-block text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-500 mb-1">
            Optional
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          {headline}
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {subline}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
