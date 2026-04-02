"use client";

import { useEffect } from "react";

interface NamePickerModalProps {
  names: string[];
  isLoading: boolean;
  error: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function NamePickerModal({
  names,
  isLoading,
  error,
  onSelect,
  onClose,
}: NamePickerModalProps) {
  // Dismiss on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a Name"
    >
      <div
        className="relative w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-amber-400">Choose a Name</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:border-gray-600 hover:text-gray-200 transition-colors"
            aria-label="Cancel"
          >
            ✕ Cancel
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">
            <span className="animate-pulse">Generating names…</span>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <p className="py-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Name list */}
        {!isLoading && !error && names.length > 0 && (
          <ul className="space-y-1.5">
            {names.map((name, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2.5 text-left text-sm text-gray-100 transition-colors hover:border-amber-600 hover:bg-amber-900/20 hover:text-amber-300"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
