"use client";

import { useState, useEffect } from "react";
import { useOpenRouterSettings } from "./useOpenRouterSettings";
import { useGeminiSettings, DEFAULT_GEMINI_MODEL } from "./useGeminiSettings";

export type AIProvider = "openrouter" | "gemini";

const ACTIVE_PROVIDER_KEY = "ai_active_provider";
const PROVIDER_CHANGED_EVENT = "ai-provider-changed";

export interface CallAIOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface UseAIProviderReturn {
  activeProvider: AIProvider;
  setActiveProvider: (provider: AIProvider) => void;
  apiKey: string;
  model: string;
  apiCallCount: number;
  incrementApiCallCount: () => void;
  hasApiKey: boolean;
  callAI: (prompt: string, options?: CallAIOptions) => Promise<string>;
}

function readActiveProvider(): AIProvider {
  if (typeof window === "undefined") return "openrouter";
  const stored = localStorage.getItem(ACTIVE_PROVIDER_KEY);
  return stored === "gemini" ? "gemini" : "openrouter";
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  options: CallAIOptions
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wfrp-char-gen.local",
      "X-Title": "WFRP Character Generator",
    },
    body: JSON.stringify({
      model: model || "meta-llama/llama-3.1-8b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens ?? 1000,
      temperature: options.temperature ?? 0.9,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit reached — wait a moment and try again");
    if (response.status === 401) throw new Error("Invalid API key — check your settings");
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No content returned from API");
  return content;
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  options: CallAIOptions
): Promise<string> {
  const resolvedModel = model || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1/models/${resolvedModel}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 1000,
        temperature: options.temperature ?? 0.9,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit reached — wait a moment and try again");
    if (response.status === 400) throw new Error("Invalid request — check your model and API key");
    if (response.status === 403) throw new Error("Invalid API key — check your settings");
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!content) throw new Error("No content returned from API");
  return content;
}

export function useAIProvider(): UseAIProviderReturn {
  const [activeProvider, setActiveProviderState] = useState<AIProvider>("openrouter");
  const openRouter = useOpenRouterSettings();
  const gemini = useGeminiSettings();

  useEffect(() => {
    setActiveProviderState(readActiveProvider());

    function handleProviderChanged() {
      setActiveProviderState(readActiveProvider());
    }

    window.addEventListener(PROVIDER_CHANGED_EVENT, handleProviderChanged);
    return () => window.removeEventListener(PROVIDER_CHANGED_EVENT, handleProviderChanged);
  }, []);

  const setActiveProvider = (provider: AIProvider) => {
    setActiveProviderState(provider);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
      window.dispatchEvent(new CustomEvent(PROVIDER_CHANGED_EVENT));
    }
  };

  const apiKey = activeProvider === "gemini" ? gemini.apiKey : openRouter.apiKey;
  const model = activeProvider === "gemini" ? gemini.model : openRouter.model;
  const apiCallCount = openRouter.apiCallCount;
  const incrementApiCallCount = openRouter.incrementApiCallCount;

  const callAI = async (prompt: string, options: CallAIOptions = {}): Promise<string> => {
    if (!apiKey) throw new Error("No API key configured — open settings to add one");
    if (activeProvider === "gemini") {
      return callGemini(apiKey, model, prompt, options);
    }
    return callOpenRouter(apiKey, model, prompt, options);
  };

  return {
    activeProvider,
    setActiveProvider,
    apiKey,
    model,
    apiCallCount,
    incrementApiCallCount,
    hasApiKey: apiKey.length > 0,
    callAI,
  };
}
