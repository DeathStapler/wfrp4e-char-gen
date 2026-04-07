"use client";

import { useState, useEffect } from "react";
import { useOpenRouterSettings } from "@/hooks/useOpenRouterSettings";
import { useGeminiSettings, GEMINI_MODELS } from "@/hooks/useGeminiSettings";
import { useAIProvider, type AIProvider } from "@/hooks/useAIProvider";
import { Button } from "@/components/ui/Button";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { activeProvider, setActiveProvider } = useAIProvider();
  const [activeTab, setActiveTab] = useState<AIProvider>(activeProvider);

  // OpenRouter state
  const { apiKey: orApiKey, setApiKey: setOrApiKey, model: orModel, setModel: setOrModel, clearSettings: clearOrSettings } = useOpenRouterSettings();
  const [localOrApiKey, setLocalOrApiKey] = useState("");
  const [localOrModel, setLocalOrModel] = useState("");
  const [showOrApiKey, setShowOrApiKey] = useState(false);
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState(false);

  // Gemini state
  const { apiKey: gemApiKey, setApiKey: setGemApiKey, model: gemModel, setModel: setGemModel, clearSettings: clearGemSettings } = useGeminiSettings();
  const [localGemApiKey, setLocalGemApiKey] = useState("");
  const [localGemModel, setLocalGemModel] = useState("");
  const [showGemApiKey, setShowGemApiKey] = useState(false);

  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(activeProvider);
      setLocalOrApiKey(orApiKey);
      setLocalOrModel(orModel);
      setLocalGemApiKey(gemApiKey);
      setLocalGemModel(gemModel);
      setShowSaved(false);

      // Fetch OpenRouter models
      const fetchOrModels = async () => {
        setOrLoading(true);
        setOrError(false);
        try {
          const response = await fetch("https://openrouter.ai/api/v1/models");
          if (!response.ok) throw new Error("Failed to fetch models");
          const data = await response.json();
          setOrModels(data.data || []);
        } catch {
          setOrError(true);
        } finally {
          setOrLoading(false);
        }
      };
      fetchOrModels();
    }
  }, [isOpen, activeProvider, orApiKey, orModel, gemApiKey, gemModel]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setOrApiKey(localOrApiKey);
    setOrModel(localOrModel);
    setGemApiKey(localGemApiKey);
    setGemModel(localGemModel);
    setActiveProvider(activeTab);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleClear = () => {
    if (activeTab === "openrouter") {
      clearOrSettings();
      setLocalOrApiKey("");
      setLocalOrModel("");
    } else {
      clearGemSettings();
      setLocalGemApiKey("");
      setLocalGemModel("");
    }
    setShowSaved(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Sorted OpenRouter models
  const freeModels = orModels
    .filter((m) => m.pricing?.prompt === "0" && m.pricing?.completion === "0")
    .sort((a, b) => a.name.localeCompare(b.name));
  const paidModels = orModels
    .filter((m) => !(m.pricing?.prompt === "0" && m.pricing?.completion === "0"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-serif text-gray-100">AI Settings</h2>
          {showSaved && (
            <span className="text-green-500 text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Provider tabs */}
        <div className="flex gap-1 mb-5 bg-gray-800 rounded p-1">
          <button
            onClick={() => setActiveTab("openrouter")}
            className={`flex-1 py-1.5 text-sm rounded transition-colors ${
              activeTab === "openrouter"
                ? "bg-gray-700 text-amber-400 font-medium"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            OpenRouter
            {activeProvider === "openrouter" && orApiKey && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("gemini")}
            className={`flex-1 py-1.5 text-sm rounded transition-colors ${
              activeTab === "gemini"
                ? "bg-gray-700 text-amber-400 font-medium"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Google Gemini
            {activeProvider === "gemini" && gemApiKey && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />
            )}
          </button>
        </div>

        {/* Active provider indicator */}
        <p className="text-xs text-gray-400 mb-4">
          Active provider:{" "}
          <span className="text-amber-400 font-medium">
            {activeProvider === "openrouter" ? "OpenRouter" : "Google Gemini"}
          </span>
          {activeTab !== activeProvider && (
            <span className="text-gray-500"> — save to switch to {activeTab === "openrouter" ? "OpenRouter" : "Google Gemini"}</span>
          )}
        </p>

        {/* OpenRouter Panel */}
        {activeTab === "openrouter" && (
          <div className="space-y-5">
            <div>
              <label htmlFor="or-api-key" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="or-api-key"
                  type={showOrApiKey ? "text" : "password"}
                  value={localOrApiKey}
                  onChange={(e) => setLocalOrApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-2 pr-20 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowOrApiKey(!showOrApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showOrApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="or-model" className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              {orLoading ? (
                <div className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-400 text-sm">
                  Loading models...
                </div>
              ) : orError ? (
                <input
                  id="or-model"
                  type="text"
                  value={localOrModel}
                  onChange={(e) => setLocalOrModel(e.target.value)}
                  placeholder="Enter model ID (e.g., anthropic/claude-3.5-sonnet)"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              ) : (
                <select
                  id="or-model"
                  value={localOrModel}
                  onChange={(e) => setLocalOrModel(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select a model...</option>
                  {freeModels.length > 0 && (
                    <optgroup label="── Free Models ──">
                      {freeModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Free)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {paidModels.length > 0 && (
                    <optgroup label="── Paid Models ──">
                      {paidModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

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
        )}

        {/* Gemini Panel */}
        {activeTab === "gemini" && (
          <div className="space-y-5">
            <div>
              <label htmlFor="gem-api-key" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="gem-api-key"
                  type={showGemApiKey ? "text" : "password"}
                  value={localGemApiKey}
                  onChange={(e) => setLocalGemApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-4 py-2 pr-20 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowGemApiKey(!showGemApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showGemApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="gem-model" className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              <select
                id="gem-model"
                value={localGemModel}
                onChange={(e) => setLocalGemModel(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select a model...</option>
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-400 italic">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        )}

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
