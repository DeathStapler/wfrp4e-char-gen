/**
 * WFRP 4e Character Share API
 *
 * POST   — save a character JSON to disk, return { shareId }
 * GET    — read a single shared character by ?id=, or list all when no ?id=
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SHARES_DIR = path.join(process.cwd(), "data", "shares");

async function ensureSharesDir() {
  try {
    await fs.mkdir(SHARES_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function sharePath(id: string): string {
  // Sanitise: only allow UUID-like filenames to prevent directory traversal
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, "");
  return path.join(SHARES_DIR, `${safeId}.json`);
}

// ── POST /api/share ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid body: expected JSON object" },
        { status: 400 }
      );
    }

    const shareId = crypto.randomUUID();
    await ensureSharesDir();
    const filePath = sharePath(shareId);
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ shareId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save share" },
      { status: 500 }
    );
  }
}

// ── GET /api/share ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // ── Single share ──────────────────────────────────────────────────────────
  if (id) {
    try {
      const filePath = sharePath(id);
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "Share not found" },
        { status: 404 }
      );
    }
  }

  // ── List all shares ───────────────────────────────────────────────────────
  try {
    await ensureSharesDir();
    const entries = await fs.readdir(SHARES_DIR, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));

    const shares: Array<{
      shareId: string;
      metadata: { name: string; playerName?: string };
      speciesId: string;
      currentCareerId: string;
      currentCareerLevel: number;
    }> = [];

    for (const file of files) {
      const shareId = file.name.replace(/\.json$/, "");
      try {
        const raw = await fs.readFile(
          path.join(SHARES_DIR, file.name),
          "utf-8"
        );
        const parsed = JSON.parse(raw);
        shares.push({
          shareId,
          metadata: {
            name: parsed.metadata?.name ?? "Unnamed",
            playerName: parsed.metadata?.playerName,
          },
          speciesId: parsed.metadata?.speciesId ?? "",
          currentCareerId: parsed.currentCareerId ?? "",
          currentCareerLevel: parsed.currentCareerLevel ?? 1,
        });
      } catch {
        // Skip corrupted files silently
      }
    }

    // Group by player name
    const grouped = shares.reduce<Record<string, typeof shares>>(
      (acc, share) => {
        const key = share.metadata.playerName ?? "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(share);
        return acc;
      },
      {}
    );

    return NextResponse.json({ shares: grouped });
  } catch {
    return NextResponse.json({ shares: {} });
  }
}
