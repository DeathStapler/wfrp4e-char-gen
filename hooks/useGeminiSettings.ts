"use client";

import { useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "gemini_api_key";
const MODEL_STORAGE_KEY = "gemini_model";
const SETTINGS_CHANGED_EVENT = "gemini-settings-changed";

export const GEMINI_MODELS = [
  { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro Preview" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B" },
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

interface UseGeminiSettingsReturn {
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

export function useGeminiSettings(): UseGeminiSettingsReturn {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [model, setModelState] = useState<string>("");

  useEffect(() => {
    const { apiKey: storedKey, model: storedModel } = readFromStorage();
    setApiKeyState(storedKey);
    setModelState(storedModel);

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

  return { apiKey, setApiKey, model, setModel, clearSettings };
}
