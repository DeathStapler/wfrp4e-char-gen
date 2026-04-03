"use client";

import { useState } from "react";
import Link from "next/link";
import { useOpenRouterSettings } from "@/hooks/useOpenRouterSettings";
import { OpenRouterSettingsModal } from "@/components/settings/OpenRouterSettingsModal";

export function AppHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { apiKey, model, apiCallCount } = useOpenRouterSettings();
  const hasApiKey = apiKey.length > 0;

  // Derive a short display name from the model ID
  // e.g. "meta-llama/llama-3.1-8b-instruct:free" → "llama-3.1-8b-instruct"
  const modelLabel = model
    ? model.split("/").pop()?.replace(/:free$/, "") ?? model
    : null;

  return (
    <>
      {/* Decorative top bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-amber-500 hover:text-amber-400 font-serif text-lg transition-colors"
          >
            WFRP 4e
          </Link>

          <div className="flex items-center gap-3">
            {/* Active model badge — shown when API key + model are set */}
            {hasApiKey && modelLabel && (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 rounded border border-amber-800/50 bg-gray-900/80 px-2 py-0.5 text-xs text-amber-400 font-mono max-w-[260px] truncate"
                title={model}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                {modelLabel}
                {apiCallCount > 0 && (
                  <span className="text-gray-500 shrink-0">· {apiCallCount}</span>
                )}
              </span>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="relative p-2 text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded"
              aria-label="Settings"
              title="OpenRouter Settings"
            >
              {/* Gear Icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>

              {/* Indicator Dot */}
              {hasApiKey && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-green-500 rounded-full border border-gray-950" />
              )}
            </button>
          </div>
        </div>
      </header>

      <OpenRouterSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
