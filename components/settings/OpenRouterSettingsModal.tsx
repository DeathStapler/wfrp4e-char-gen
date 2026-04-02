"use client";

import { useState, useEffect } from "react";
import { useOpenRouterSettings } from "@/hooks/useOpenRouterSettings";
import { Button } from "@/components/ui/Button";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface OpenRouterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenRouterSettingsModal({ isOpen, onClose }: OpenRouterSettingsModalProps) {
  const { apiKey, setApiKey, model, setModel, clearSettings } = useOpenRouterSettings();
  const [localApiKey, setLocalApiKey] = useState("");
  const [localModel, setLocalModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(apiKey);
      setLocalModel(model);
      setShowSaved(false);
      
      // Fetch models from OpenRouter API
      const fetchModels = async () => {
        setLoading(true);
        setError(false);
        try {
          const response = await fetch("https://openrouter.ai/api/v1/models");
          if (!response.ok) {
            throw new Error("Failed to fetch models");
          }
          const data = await response.json();
          setModels(data.data || []);
        } catch (err) {
          console.error("Error fetching models:", err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      
      fetchModels();
    }
  }, [isOpen, apiKey, model]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleClear = () => {
    clearSettings();
    setLocalApiKey("");
    setLocalModel("");
    setShowSaved(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-gray-100">OpenRouter Settings</h2>
          {showSaved && (
            <span className="text-green-500 text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Saved</span>
            </span>
          )}
        </div>

        <div className="space-y-5">
          {/* API Key Field */}
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-2 pr-20 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            {loading ? (
              <div className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-400 text-sm">
                Loading models...
              </div>
            ) : error ? (
              <input
                id="model"
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                placeholder="Enter model ID (e.g., anthropic/claude-3.5-sonnet)"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            ) : (
              <select
                id="model"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select a model...</option>
                {(() => {
                  // Separate free and paid models
                  const freeModels = models.filter(
                    (m) => m.pricing?.prompt === "0" && m.pricing?.completion === "0"
                  );
                  const paidModels = models.filter(
                    (m) => !(m.pricing?.prompt === "0" && m.pricing?.completion === "0")
                  );
                  
                  // Sort each group alphabetically by name
                  const sortedFree = freeModels.sort((a, b) => a.name.localeCompare(b.name));
                  const sortedPaid = paidModels.sort((a, b) => a.name.localeCompare(b.name));
                  
                  return (
                    <>
                      {sortedFree.length > 0 && (
                        <optgroup label="── Free Models ──">
                          {sortedFree.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Free)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {sortedPaid.length > 0 && (
                        <optgroup label="── Paid Models ──">
                          {sortedPaid.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            )}
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-400 italic">
            Get your API key from{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 gap-3">
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
