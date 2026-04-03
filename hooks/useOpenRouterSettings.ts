"use client";

import { useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "openrouter_api_key";
const MODEL_STORAGE_KEY = "openrouter_model";
const API_CALL_COUNT_KEY = "openrouter_api_call_count";
const SETTINGS_CHANGED_EVENT = "openrouter-settings-changed";

interface UseOpenRouterSettingsReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  apiCallCount: number;
  incrementApiCallCount: () => void;
  clearSettings: () => void;
}

function readFromStorage() {
  if (typeof window === "undefined") return { apiKey: "", model: "", apiCallCount: 0 };
  return {
    apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || "",
    model: localStorage.getItem(MODEL_STORAGE_KEY) || "",
    apiCallCount: parseInt(localStorage.getItem(API_CALL_COUNT_KEY) || "0", 10),
  };
}

function notifySettingsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
  }
}

export function useOpenRouterSettings(): UseOpenRouterSettingsReturn {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [model, setModelState] = useState<string>("");
  const [apiCallCount, setApiCallCountState] = useState<number>(0);

  useEffect(() => {
    // Initial read
    const { apiKey: storedKey, model: storedModel, apiCallCount: storedCount } = readFromStorage();
    setApiKeyState(storedKey);
    setModelState(storedModel);
    setApiCallCountState(storedCount);

    // Re-sync whenever any hook instance writes new settings
    function handleSettingsChanged() {
      const { apiKey: k, model: m, apiCallCount: c } = readFromStorage();
      setApiKeyState(k);
      setModelState(m);
      setApiCallCountState(c);
    }

    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      notifySettingsChanged();
    }
  };

  const setModel = (modelId: string) => {
    setModelState(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      notifySettingsChanged();
    }
  };

  const clearSettings = () => {
    setApiKeyState("");
    setModelState("");
    setApiCallCountState(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(MODEL_STORAGE_KEY);
      localStorage.removeItem(API_CALL_COUNT_KEY);
      notifySettingsChanged();
    }
  };

  const incrementApiCallCount = () => {
    if (typeof window !== "undefined") {
      const current = parseInt(localStorage.getItem(API_CALL_COUNT_KEY) || "0", 10);
      const next = current + 1;
      localStorage.setItem(API_CALL_COUNT_KEY, String(next));
      setApiCallCountState(next);
      notifySettingsChanged();
    }
  };

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    apiCallCount,
    incrementApiCallCount,
    clearSettings,
  };
}
