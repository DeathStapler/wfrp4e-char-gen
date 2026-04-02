"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Character } from "@/lib/types/character";
import { loadAllCharacters, deleteCharacter } from "@/lib/storage/character-storage";
import { Button } from "@/components/ui/Button";
import speciesData from "@/data/species.json";
import careersData from "@/data/careers.json";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[] | undefined>(
    undefined
  );

  const loadCharacters = () => {
    setCharacters(loadAllCharacters());
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  if (characters === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-amber-400">
              Your Characters
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {characters.length === 0
                ? "No characters yet"
                : `${characters.length} character${characters.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
          <Button variant="primary" href="/character/new">
            + Create New
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-lg">
            <p className="font-serif text-5xl text-amber-900 mb-4">☠</p>
            <p className="font-serif text-2xl text-gray-400 mb-2">
              No characters yet.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Create your first one and begin your journey into the Old World.
            </p>
            <Button variant="secondary" href="/character/new">
              Begin Your Journey
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                onDelete={loadCharacters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  onDelete,
}: {
  character: Character;
  onDelete: () => void;
}) {
  const species = (speciesData as Array<{ id: string; name: string }>).find(
    (s) => s.id === character.metadata.speciesId
  );
  const career = (
    careersData as Array<{
      id: string;
      name: string;
      levels: Array<{ title: string; status: { tier: string; standing: number } }>;
    }>
  ).find((c) => c.id === character.currentCareerId);
  const level = career?.levels[character.currentCareerLevel - 1];

  const statusColour =
    level?.status.tier === "Gold"
      ? "text-yellow-400"
      : level?.status.tier === "Silver"
      ? "text-gray-300"
      : "text-orange-400";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (
      confirm(
        `Delete ${character.metadata.name}? This cannot be undone.`
      )
    ) {
      deleteCharacter(character.id);
      onDelete();
    }
  };

  return (
    <Link href={`/character/${character.id}`} className="block group">
      <div className="h-full relative rounded-lg border border-gray-800 bg-gray-900 p-5 transition-colors group-hover:border-amber-700/60 group-hover:bg-gray-900/80">
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 rounded p-1"
          aria-label="Delete character"
          title="Delete character"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="font-serif text-xl text-amber-400 mb-2 leading-tight truncate">
          {character.metadata.name}
        </h2>
        <div className="space-y-1 text-sm text-gray-400 mb-4">
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
            <p className={`text-xs ${statusColour}`}>
              {level.status.tier} {level.status.standing}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 border-t border-gray-800 pt-3 mt-auto">
          Created {new Date(character.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
