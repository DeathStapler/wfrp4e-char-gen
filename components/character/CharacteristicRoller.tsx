"use client";

import { useState } from "react";
import type { Species, CharacteristicKey } from "@/lib/types/rules";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";

const CHARACTERISTIC_KEYS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

const CHARACTERISTIC_FULL_NAMES: Record<CharacteristicKey, string> = {
  WS: "Weapon Skill",
  BS: "Ballistic Skill",
  S: "Strength",
  T: "Toughness",
  I: "Initiative",
  Ag: "Agility",
  Dex: "Dexterity",
  Int: "Intelligence",
  WP: "Willpower",
  Fel: "Fellowship",
};

function roll2d10(): number {
  return (
    Math.floor(Math.random() * 10) + 1 + Math.floor(Math.random() * 10) + 1
  );
}

function totalColour(value: number): string {
  if (value >= 50) return "text-amber-400 font-bold";
  if (value >= 40) return "text-amber-300";
  if (value <= 20) return "text-red-400";
  return "text-gray-100";
}

function getCompleteRolls(
  rolls: Partial<Record<CharacteristicKey, number>>
): Record<CharacteristicKey, number> | null {
  for (const key of CHARACTERISTIC_KEYS) {
    if (rolls[key] === undefined) return null;
  }
  return rolls as Record<CharacteristicKey, number>;
}

interface CharacteristicRollerProps {
  species: Species;
  initialRolls: Partial<Record<CharacteristicKey, number>>;
  onBack: () => void;
  onNext: (rolls: Record<CharacteristicKey, number>) => void;
  onChange?: (rolls: Partial<Record<CharacteristicKey, number>>) => void;
}

export function CharacteristicRoller({
  species,
  initialRolls,
  onBack,
  onNext,
  onChange,
}: CharacteristicRollerProps) {
  const [rolls, setRolls] =
    useState<Partial<Record<CharacteristicKey, number>>>(initialRolls);

  function rollAll() {
    const newRolls = {} as Record<CharacteristicKey, number>;
    for (const key of CHARACTERISTIC_KEYS) {
      newRolls[key] = roll2d10();
    }
    setRolls(newRolls);
    onChange?.(newRolls);
  }

  function rerollOne(key: CharacteristicKey) {
    const newVal = roll2d10();
    const nextRolls = { ...rolls, [key]: newVal };
    setRolls(nextRolls);
    onChange?.(nextRolls);
  }

  const completeRolls = getCompleteRolls(rolls);
  const rolledCount = CHARACTERISTIC_KEYS.filter(
    (k) => rolls[k] !== undefined
  ).length;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <StepIndicator
          currentStep={3}
          totalSteps={8}
          stepLabel="Roll Your Characteristics"
        />

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-gray-100">
              Roll Your Characteristics
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Roll 2d10 for each characteristic and add your{" "}
              <span className="text-amber-400">{species.name}</span> species base to
              get your starting values. You can re-roll individual characteristics
              or roll them all at once.
            </p>
          </div>
          <Button variant="primary" onClick={rollAll} className="shrink-0">
            🎲 Roll All
          </Button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 pb-2 text-[10px] uppercase tracking-widest text-gray-400">
          <div className="w-28 shrink-0" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 text-center">Base</div>
            <div className="w-4" />
            <div className="w-12 text-center">Roll</div>
            <div className="w-4" />
            <div className="w-16 text-center">Total</div>
            <div className="w-10 text-center">Bonus</div>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        <div className="space-y-2">
          {CHARACTERISTIC_KEYS.map((key) => {
            const base = species.characteristics[key];
            const roll = rolls[key];
            const total = roll !== undefined ? base + roll : undefined;
            const bonus = total !== undefined ? Math.floor(total / 10) : undefined;

            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-3"
              >
                {/* Characteristic name */}
                <div className="w-28 shrink-0">
                  <span className="font-semibold text-amber-400 text-sm">
                    {key}
                  </span>
                  <span className="block text-xs text-gray-400 leading-tight mt-0.5">
                    {CHARACTERISTIC_FULL_NAMES[key]}
                  </span>
                </div>

                {/* Values row */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 text-center">
                    <span className="text-base font-mono text-gray-300 tabular-nums">
                      {base}
                    </span>
                  </div>

                  <span className="text-gray-400 text-sm w-4 text-center">+</span>

                  <div className="w-12 text-center">
                    <span
                      className={`text-base font-mono tabular-nums ${
                        roll !== undefined ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {roll !== undefined ? roll : "—"}
                    </span>
                  </div>

                  <span className="text-gray-400 text-sm w-4 text-center">=</span>

                  <div className="w-16 text-center">
                    <span
                      className={`text-xl font-bold tabular-nums ${
                        total !== undefined
                          ? totalColour(total)
                          : "text-gray-400"
                      }`}
                    >
                      {total !== undefined ? total : "—"}
                    </span>
                  </div>

                  <div className="w-10 text-center">
                    <span
                      className={`text-sm tabular-nums ${
                        bonus !== undefined ? "text-gray-400" : "text-gray-400"
                      }`}
                      title={`${key} Bonus`}
                    >
                      {bonus !== undefined ? bonus : "—"}
                    </span>
                  </div>
                </div>

                {/* Re-roll button */}
                <button
                  onClick={() => rerollOne(key)}
                  className="w-10 shrink-0 rounded px-2 py-1.5 text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors text-center"
                  title={`Re-roll ${key}`}
                >
                  🎲
                </button>
              </div>
            );
          })}
        </div>

        {rolledCount > 0 && rolledCount < CHARACTERISTIC_KEYS.length && (
          <p className="mt-4 text-xs text-amber-600 text-center">
            {CHARACTERISTIC_KEYS.length - rolledCount} characteristic
            {CHARACTERISTIC_KEYS.length - rolledCount !== 1 ? "s" : ""} still to
            roll
          </p>
        )}

        <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!completeRolls}
            onClick={() => completeRolls && onNext(completeRolls)}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
