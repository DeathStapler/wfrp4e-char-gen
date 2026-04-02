"use client";

import { useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "openrouter_api_key";
const MODEL_STORAGE_KEY = "openrouter_model";
const SETTINGS_CHANGED_EVENT = "openrouter-settings-changed";

interface UseOpenRouterSettingsReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  clearSettings: () => void;
}

function readFromStorage() {
  if (typeof window === "undefined") return { apiKey: "", model: "" };
  return {
    apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || "",
    model: localStorage.getItem(MODEL_STORAGE_KEY) || "",
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

  useEffect(() => {
    // Initial read
    const { apiKey: storedKey, model: storedModel } = readFromStorage();
    setApiKeyState(storedKey);
    setModelState(storedModel);

    // Re-sync whenever any hook instance writes new settings
    function handleSettingsChanged() {
      const { apiKey: k, model: m } = readFromStorage();
      setApiKeyState(k);
      setModelState(m);
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(MODEL_STORAGE_KEY);
      notifySettingsChanged();
    }
  };

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    clearSettings,
  };
}
