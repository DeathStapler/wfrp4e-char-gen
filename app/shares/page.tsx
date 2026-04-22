"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAllSharedCharacters, type ShareListItem } from "@/lib/utils/share-character";
import speciesData from "@/data/species.json";
import careersData from "@/data/careers.json";

export default function SharesPage() {
  const [grouped, setGrouped] = useState<Record<string, ShareListItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSharedCharacters()
      .then((data) => setGrouped(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading shared characters…</p>
      </div>
    );
  }

  const players = Object.keys(grouped).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl text-amber-400 mb-4">
            Shared Characters
          </h1>
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-lg">
            <p className="font-serif text-2xl text-gray-400 mb-2">
              No shared characters yet.
            </p>
            <p className="text-gray-400 text-sm">
              When players share their characters, they will appear here grouped by player name.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-3xl text-amber-400 mb-8">
          Shared Characters
        </h1>

        {players.map((playerName) => (
          <section key={playerName} className="mb-10">
            <h2 className="text-lg text-gray-300 font-semibold mb-4 border-b border-gray-800 pb-2">
              {playerName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[playerName].map((share) => (
                <ShareCard key={share.shareId} share={share} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ShareCard({ share }: { share: ShareListItem }) {
  const species = (speciesData as Array<{ id: string; name: string }>).find(
    (s) => s.id === share.speciesId
  );

  const career = (
    careersData as Array<{
      id: string;
      name: string;
      levels: Array<{ title: string; status: { tier: string; standing: number } }>;
    }>
  ).find((c) => c.id === share.currentCareerId);

  const level = career?.levels[share.currentCareerLevel - 1];

  return (
    <Link
      href={`/character/shared?id=${share.shareId}`}
      className="block group"
    >
      <div className="h-full rounded-lg border border-gray-800 bg-gray-900 p-5 transition-colors group-hover:border-amber-700/60 group-hover:bg-gray-900/80">
        <h3 className="font-serif text-xl text-amber-400 mb-2 leading-tight truncate">
          {share.metadata.name}
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          {species && (
            <p className="text-gray-400">{species.name}</p>
          )}
          {career && level && (
            <p>
              {career.name}
              <span className="text-gray-400 mx-1">·</span>
              <span className="italic text-gray-400">{level.title}</span>
            </p>
          )}
          {level && (
            <p
              className={`text-xs ${
                level.status.tier === "Gold"
                  ? "text-yellow-400"
                  : level.status.tier === "Silver"
                  ? "text-gray-300"
                  : "text-orange-400"
              }`}
            >
              {level.status.tier} {level.status.standing}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
