/**
 * Client-side utilities for sharing characters via the server-side file store.
 */

import type { Character } from "../types/character";

const PLAYER_NAME_KEY = "wfrp-player-name";

// ── Player name helpers ───────────────────────────────────────────────────────

export function getStoredPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setStoredPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

// ── Share API helpers ─────────────────────────────────────────────────────────

export interface ShareResponse {
  shareId: string;
}

export interface ShareListItem {
  shareId: string;
  metadata: { name: string; playerName?: string };
  speciesId: string;
  currentCareerId: string;
  currentCareerLevel: number;
}

export async function createShareLink(
  character: Character
): Promise<string> {
  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(character),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to create share" }));
    throw new Error(error.error ?? "Failed to create share");
  }

  const data = (await response.json()) as ShareResponse;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";
  return `${origin}/character/shared?id=${data.shareId}`;
}

export async function fetchSharedCharacter(
  shareId: string
): Promise<Character | null> {
  const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
  if (!response.ok) return null;
  return (await response.json()) as Character;
}

export async function fetchAllSharedCharacters(): Promise<
  Record<string, ShareListItem[]>
> {
  const response = await fetch("/api/share");
  if (!response.ok) return {};
  const data = await response.json();
  return (data.shares ?? {}) as Record<string, ShareListItem[]>;
}
