"use client";

import { useState } from "react";
import type { Species, CharacteristicKey } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import { rollRandomSpeciesWithDie } from "@/lib/rules/species";

type SpeciesChoiceMethod = "random" | "chosen";

const CHARACTERISTIC_LABELS: Record<CharacteristicKey, string> = {
  WS: "WS",
  BS: "BS",
  S: "S",
  T: "T",
  I: "I",
  Ag: "Ag",
  Dex: "Dex",
  Int: "Int",
  WP: "WP",
  Fel: "Fel",
};

const CHARACTERISTIC_KEYS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

function statColour(value: number): string {
  if (value >= 40) return "text-amber-400 font-bold";
  if (value >= 30) return "text-amber-300";
  if (value <= 10) return "text-red-500";
  return "text-gray-400";
}

interface SpeciesCardProps {
  species: Species;
  selected: boolean;
  onSelect: () => void;
  showXpBadge?: boolean;
}

function SpeciesCard({ species, selected, onSelect, showXpBadge }: SpeciesCardProps) {
  return (
    <Card selected={selected} onClick={onSelect}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-serif text-xl text-gray-100 leading-tight">
          {species.name}
        </h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {selected && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-gray-950">
              Selected
            </span>
          )}
          {selected && showXpBadge && (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-100">
              +20 XP
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">
        {species.description}
      </p>

      <div className="grid grid-cols-5 gap-1 mb-3">
        {CHARACTERISTIC_KEYS.map((key) => (
          <div key={key} className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {CHARACTERISTIC_LABELS[key]}
            </span>
            <span className={`text-sm tabular-nums ${statColour(species.characteristics[key])}`}>
              {species.characteristics[key]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400 border-t border-gray-800 pt-3">
        <span>Move {species.movement}</span>
        <span>Size: {species.size}</span>
        <span>Fate {species.fate}</span>
        <span>Resilience {species.resilience}</span>
        {(species as any).extraPoints > 0 && (
          <span className="text-emerald-500">Extra Points: {(species as any).extraPoints}</span>
        )}
        {species.extraWounds > 0 && (
          <span className="text-amber-600">+{species.extraWounds} Wounds</span>
        )}
      </div>
    </Card>
  );
}

interface SpeciesSelectionProps {
  allSpecies: Species[];
  initialSelectedId?: string | null;
  initialChoiceMethod?: SpeciesChoiceMethod;
  characterCharacteristics: Characteristics;
  onNext: (speciesId: string, method: SpeciesChoiceMethod) => void;
}

export function SpeciesSelection({ 
  allSpecies, 
  initialSelectedId, 
  initialChoiceMethod, 
  characterCharacteristics,
  onNext 
}: SpeciesSelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [choiceMethod, setChoiceMethod] = useState<SpeciesChoiceMethod>(initialChoiceMethod ?? "chosen");
  const [hasRolled, setHasRolled] = useState(initialChoiceMethod === "random");
  const [rollDisplay, setRollDisplay] = useState<{ dieValue: number; speciesName: string } | null>(null);

  function handleRandomRoll() {
    const { roll, speciesId } = rollRandomSpeciesWithDie();
    const matched = allSpecies.find((s) => s.id === speciesId) ?? allSpecies[Math.floor(Math.random() * allSpecies.length)];
    setSelectedId(matched.id);
    setChoiceMethod("random");
    setHasRolled(true);
    setRollDisplay({ dieValue: roll, speciesName: matched.name });
  }

  function handleManualSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    setChoiceMethod("chosen");
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator currentStep={1} totalSteps={8} stepLabel="Choose Your Species" />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={[]}
              careerSkills={[]}
              careerSkillAllocation={[]}
              speciesSkills={[]}
              species={selectedId ? allSpecies.find(s => s.id === selectedId) ?? null : null}
            />
          </aside>

          {/* Right column: step content (~2/3 width) */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl text-gray-100 mb-2">
              Choose Your Species
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          Your species shapes your starting characteristics and skills. Choose wisely —
          the Old World rewards no second chances.
        </p>

        {/* Random roll button */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          {hasRolled ? (
            <span className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed select-none">
              🎲 Rolled
              <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-400">
                +20 XP
              </span>
            </span>
          ) : (
            <button
              onClick={handleRandomRoll}
              className="flex items-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-900/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
            >
              🎲 Roll Randomly
              <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                +20 XP
              </span>
            </button>
          )}
          {rollDisplay && choiceMethod === "random" && (
            <span className="text-xs text-amber-400 font-mono">
              Rolled: {rollDisplay.dieValue} → {rollDisplay.speciesName}
            </span>
          )}
          {!rollDisplay && choiceMethod === "random" && (
            <span className="text-xs text-gray-400 italic">
              Randomly rolled — or pick a species below to choose freely
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {allSpecies.map((species) => (
            <SpeciesCard
              key={species.id}
              species={species}
              selected={selectedId === species.id}
              showXpBadge={choiceMethod === "random"}
              onSelect={() => handleManualSelect(species.id)}
            />
            ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          <Button variant="ghost" href="/">
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!selectedId}
            onClick={() => selectedId && onNext(selectedId, choiceMethod)}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}
