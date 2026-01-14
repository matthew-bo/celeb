"use client";

/**
 * PhotoUpload Component
 * 
 * Camera/gallery picker for optional photo upload.
 * Reference: README.md §1 - Q12 Photo Upload decision.
 * "We don't store your photo" - privacy messaging.
 */

import { useState, useRef } from "react";
import { Camera, X } from "./icons";

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
  onSkip: () => void;
  isProcessing?: boolean;
}

export function PhotoUpload({
  onPhotoSelected,
  onSkip,
  isProcessing = false,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onPhotoSelected(file);
  };

  const handleClear = () => {
    if (isProcessing) return; // Don't allow clearing while processing
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleTriggerUpload = () => {
    if (isProcessing) return;
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload photo"
        disabled={isProcessing}
      />

      {/* Upload area or preview */}
      {preview ? (
        <div className="relative">
          <div className={`aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden border-2 ${isProcessing ? 'border-amber-400 dark:border-amber-500' : 'border-zinc-200 dark:border-zinc-700'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your uploaded photo"
              className={`w-full h-full object-cover ${isProcessing ? 'opacity-75' : ''}`}
            />
            
            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-sm font-medium">Analyzing...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Clear button - hidden while processing */}
          {!isProcessing && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
        </div>
      ) : (
        <button
          onClick={handleTriggerUpload}
          disabled={isProcessing}
          className="flex flex-col items-center gap-4 px-8 py-12 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-10 h-10" />
          <div className="text-center">
            <p className="font-medium text-base">Tap to add a photo</p>
            <p className="text-sm mt-1 text-zinc-400 dark:text-zinc-500">
              We&apos;ll match your hair, glasses, facial hair
            </p>
          </div>
        </button>
      )}

      {/* Privacy note */}
      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
        🔒 We don&apos;t store your photo. It&apos;s processed and immediately discarded.
      </p>

      {/* Skip button - disabled while processing */}
      <button
        onClick={onSkip}
        disabled={isProcessing}
        className="text-base text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing photo..." : "Skip this step"}
      </button>
    </div>
  );
}

