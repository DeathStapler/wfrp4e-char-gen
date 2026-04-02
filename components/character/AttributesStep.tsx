"use client";

import { useState, useEffect } from "react";
import type { Species, CharacteristicKey, Career } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { AttributeChoiceMethod } from "@/lib/rules/creation-xp";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";

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

export type AttributeMethod = AttributeChoiceMethod;

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

interface AttributesStepProps {
  species: Species;
  initialMethod: AttributeMethod | null;
  initialRolls: Partial<Record<CharacteristicKey, number>>;
  careerCharacteristics: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  career?: Career | null;
  onBack: () => void;
  onNext: (
    method: AttributeMethod,
    rolls: Record<CharacteristicKey, number>
  ) => void;
  onChange?: (rolls: Partial<Record<CharacteristicKey, number>>) => void;
}

export function AttributesStep({
  species,
  initialMethod,
  initialRolls,
  careerCharacteristics,
  careerSkillAllocation,
  career = null,
  onBack,
  onNext,
  onChange,
}: AttributesStepProps) {
  const [method, setMethod] = useState<AttributeMethod | null>(initialMethod);
  const [rolls, setRolls] =
    useState<Partial<Record<CharacteristicKey, number>>>(initialRolls);
  const [locked, setLocked] = useState(
    initialMethod === "random-keep" && Object.keys(initialRolls).length === 10
  );
  const [manualValues, setManualValues] = useState<
    Partial<Record<CharacteristicKey, number>>
  >(() => {
    if (initialMethod === "manual") {
      return initialRolls;
    }
    return {};
  });

  // Track assignments for rearrange mode
  const [assignments, setAssignments] = useState<
    Partial<Record<CharacteristicKey, number>>
  >(() => {
    if (initialMethod === "random-rearrange") {
      return initialRolls;
    }
    return {};
  });

  const hasRolled = Object.keys(rolls).length === 10;

  // Build current characteristics for stats panel
  const currentCharacteristics: Characteristics = Object.fromEntries(
    CHARACTERISTIC_KEYS.map((k) => [k, (species.characteristics[k] ?? 0) + (rolls[k] ?? 0)])
  ) as Characteristics;

  function handleMethodSelect(selectedMethod: AttributeMethod) {
    setMethod(selectedMethod);
    if (selectedMethod === "manual") {
      // Initialize manual values with minimums (4 per characteristic)
      const initial: Partial<Record<CharacteristicKey, number>> = {};
      CHARACTERISTIC_KEYS.forEach((k) => {
        initial[k] = 4;
      });
      setManualValues(initial);
    } else if (selectedMethod === "random-keep" && hasRolled) {
      // If we already have rolls and switching to keep, lock them
      setLocked(true);
    }
  }

  function rollAll() {
    const newRolls = {} as Record<CharacteristicKey, number>;
    for (const key of CHARACTERISTIC_KEYS) {
      newRolls[key] = roll2d10();
    }
    setRolls(newRolls);
    onChange?.(newRolls);

    if (method === "random-keep") {
      setLocked(true);
    } else if (method === "random-rearrange") {
      // Initialize assignments with rolled values
      setAssignments({ ...newRolls });
    }
  }

  function handleManualChange(key: CharacteristicKey, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(4, Math.min(18, num));
    setManualValues((prev) => ({ ...prev, [key]: clamped }));
  }

  function handleAssignmentChange(key: CharacteristicKey, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setAssignments((prev) => ({ ...prev, [key]: num }));
  }

  const rollValues = Object.values(rolls);
  const assignedValues = Object.values(assignments);
  const availableRolls = rollValues.filter(
    (v) => !assignedValues.includes(v)
  );

  // Check if all rolls are assigned in rearrange mode
  const allAssigned =
    method === "random-rearrange" &&
    hasRolled &&
    Object.keys(assignments).length === 10 &&
    new Set(assignedValues).size === 10 &&
    assignedValues.every((v) => rollValues.includes(v));

  // Check manual allocation total
  const manualTotal = Object.values(manualValues).reduce(
    (sum, v) => sum + (v || 0),
    0
  );
  const manualValid = method === "manual" && manualTotal === 100;

  const canProceed =
    (method === "random-keep" && locked && hasRolled) ||
    allAssigned ||
    manualValid;

  function handleNext() {
    if (!method) return;

    let finalRolls: Record<CharacteristicKey, number>;
    if (method === "random-keep") {
      finalRolls = rolls as Record<CharacteristicKey, number>;
    } else if (method === "random-rearrange") {
      finalRolls = assignments as Record<CharacteristicKey, number>;
    } else {
      finalRolls = manualValues as Record<CharacteristicKey, number>;
    }

    onNext(method, finalRolls);
  }

  const xpBonus =
    method === "random-keep" ? 50 : method === "random-rearrange" ? 25 : 0;

  if (!method) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <StepIndicator
            currentStep={3}
            totalSteps={8}
            stepLabel="Choose Characteristic Method"
          />

          <h1 className="font-serif text-3xl text-gray-100 mb-2">
            Choose Your Method
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            Select how you want to generate your starting characteristics for
            your <span className="text-amber-400">{species.name}</span>.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleMethodSelect("random-keep")}
              className="w-full text-left rounded-lg border-2 border-gray-800 bg-gray-900/60 p-6 hover:border-amber-500 hover:bg-gray-900 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-serif text-xl text-amber-400 group-hover:text-amber-300">
                  Roll & Keep
                </h3>
                <span className="text-emerald-400 font-bold text-lg">
                  +50 XP
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Roll 2d10 for each characteristic once and keep the results as
                shown. No re-rolls, no changes — fate decides your character.
              </p>
            </button>

            <button
              onClick={() => handleMethodSelect("random-rearrange")}
              className="w-full text-left rounded-lg border-2 border-gray-800 bg-gray-900/60 p-6 hover:border-amber-500 hover:bg-gray-900 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-serif text-xl text-amber-400 group-hover:text-amber-300">
                  Roll & Rearrange
                </h3>
                <span className="text-emerald-400 font-bold text-lg">
                  +25 XP
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Roll 2d10 for each characteristic, then assign each roll value
                to the characteristic of your choice. Each value must be used
                exactly once.
              </p>
            </button>

            <button
              onClick={() => handleMethodSelect("manual")}
              className="w-full text-left rounded-lg border-2 border-gray-800 bg-gray-900/60 p-6 hover:border-amber-500 hover:bg-gray-900 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-serif text-xl text-amber-400 group-hover:text-amber-300">
                  Manual Allocation
                </h3>
                <span className="text-gray-400 font-bold text-lg">No XP</span>
              </div>
              <p className="text-gray-400 text-sm">
                Distribute exactly 100 points across all 10 characteristics.
                Minimum 4, maximum 18 per characteristic. Full control, no luck
                required.
              </p>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-8">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (method === "random-keep") {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <StepIndicator
            currentStep={3}
            totalSteps={8}
            stepLabel="Roll & Keep"
          />

          {/* Two-column layout: left stats panel + right content */}
          <div className="flex gap-6 items-start">
            {/* Left column: sticky stats panel (~1/3 width) */}
            <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
              <CurrentStatsPanel
                characteristics={currentCharacteristics}
                careerCharacteristics={careerCharacteristics}
                careerSkills={[]}
                careerSkillAllocation={careerSkillAllocation}
                career={career}
                species={species}
              />
            </aside>

            {/* Right column: step content (~2/3 width) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif text-3xl text-gray-100">
                    Roll & Keep
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                Roll 2d10 for each characteristic and add your{" "}
                <span className="text-amber-400">{species.name}</span> base.
                Once rolled, these values are locked.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-emerald-400 font-bold text-lg">+50 XP</div>
                <div className="text-xs text-gray-400">Creation Bonus</div>
              </div>
            </div>

          {!hasRolled && (
            <div className="mb-6">
              <Button variant="primary" onClick={rollAll} className="w-full">
                🎲 Roll All Characteristics
              </Button>
            </div>
          )}

          {hasRolled && (
            <>
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
              </div>

              <div className="space-y-2">
                {CHARACTERISTIC_KEYS.map((key) => {
                  const base = species.characteristics[key];
                  const roll = rolls[key];
                  const total = roll !== undefined ? base + roll : undefined;
                  const bonus =
                    total !== undefined ? Math.floor(total / 10) : undefined;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-3"
                    >
                      <div className="w-28 shrink-0">
                        <span className="font-semibold text-amber-400 text-sm">
                          {key}
                        </span>
                        <span className="block text-xs text-gray-400 leading-tight mt-0.5">
                          {CHARACTERISTIC_FULL_NAMES[key]}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 text-center">
                          <span className="text-base font-mono text-gray-300 tabular-nums">
                            {base}
                          </span>
                        </div>

                        <span className="text-gray-400 text-sm w-4 text-center">
                          +
                        </span>

                        <div className="w-12 text-center">
                          <span className="text-base font-mono tabular-nums text-gray-300">
                            {roll}
                          </span>
                        </div>

                        <span className="text-gray-400 text-sm w-4 text-center">
                          =
                        </span>

                        <div className="w-16 text-center">
                          <span
                            className={`text-xl font-bold tabular-nums ${totalColour(
                              total!
                            )}`}
                          >
                            {total}
                          </span>
                        </div>

                        <div className="w-10 text-center">
                          <span
                            className="text-sm tabular-nums text-gray-400"
                            title={`${key} Bonus`}
                          >
                            {bonus}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-6">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button
              variant="primary"
              disabled={!canProceed}
              onClick={handleNext}
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

  if (method === "random-rearrange") {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <StepIndicator
            currentStep={3}
            totalSteps={8}
            stepLabel="Roll & Rearrange"
          />

          {/* Two-column layout: left stats panel + right content */}
          <div className="flex gap-6 items-start">
            {/* Left column: sticky stats panel (~1/3 width) */}
            <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
              <CurrentStatsPanel
                characteristics={currentCharacteristics}
                careerCharacteristics={careerCharacteristics}
                careerSkills={[]}
                careerSkillAllocation={careerSkillAllocation}
                career={career}
                species={species}
              />
            </aside>

            {/* Right column: step content (~2/3 width) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif text-3xl text-gray-100">
                    Roll & Rearrange
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                Roll 2d10 for each characteristic, then assign each value to
                any characteristic. Each roll must be used exactly once.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-emerald-400 font-bold text-lg">+25 XP</div>
                <div className="text-xs text-gray-400">Creation Bonus</div>
              </div>
            </div>

          {!hasRolled && (
            <div className="mb-6">
              <Button variant="primary" onClick={rollAll} className="w-full">
                🎲 Roll All Characteristics
              </Button>
            </div>
          )}

          {hasRolled && (
            <>
              <div className="mb-6 rounded-lg border border-amber-900/30 bg-amber-950/20 p-4">
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-2">
                  Your Rolled Values
                </div>
                <div className="flex flex-wrap gap-2">
                  {rollValues.map((val, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded bg-gray-900 border border-gray-700 font-mono text-sm text-gray-300"
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 pb-2 text-[10px] uppercase tracking-widest text-gray-400">
                <div className="w-28 shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 text-center">Base</div>
                  <div className="w-4" />
                  <div className="w-32 text-center">Assigned Roll</div>
                  <div className="w-4" />
                  <div className="w-16 text-center">Total</div>
                  <div className="w-10 text-center">Bonus</div>
                </div>
              </div>

              <div className="space-y-2">
                {CHARACTERISTIC_KEYS.map((key) => {
                  const base = species.characteristics[key];
                  const assigned = assignments[key];
                  const total =
                    assigned !== undefined ? base + assigned : undefined;
                  const bonus =
                    total !== undefined ? Math.floor(total / 10) : undefined;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-3"
                    >
                      <div className="w-28 shrink-0">
                        <span className="font-semibold text-amber-400 text-sm">
                          {key}
                        </span>
                        <span className="block text-xs text-gray-400 leading-tight mt-0.5">
                          {CHARACTERISTIC_FULL_NAMES[key]}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 text-center">
                          <span className="text-base font-mono text-gray-300 tabular-nums">
                            {base}
                          </span>
                        </div>

                        <span className="text-gray-400 text-sm w-4 text-center">
                          +
                        </span>

                        <div className="w-32">
                          <select
                            value={assigned ?? ""}
                            onChange={(e) =>
                              handleAssignmentChange(key, e.target.value)
                            }
                            className="w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:border-amber-500"
                          >
                            <option value="">— Select —</option>
                            {rollValues.map((val) => {
                              const isAvailable =
                                val === assigned ||
                                !assignedValues.includes(val);
                              return (
                                <option
                                  key={val}
                                  value={val}
                                  disabled={!isAvailable}
                                >
                                  {val}
                                  {!isAvailable ? " (used)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <span className="text-gray-400 text-sm w-4 text-center">
                          =
                        </span>

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
                              bonus !== undefined
                                ? "text-gray-400"
                                : "text-gray-400"
                            }`}
                            title={`${key} Bonus`}
                          >
                            {bonus !== undefined ? bonus : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allAssigned && (
                <p className="mt-4 text-xs text-amber-600 text-center">
                  Assign all roll values to proceed
                </p>
              )}
            </>
          )}

          <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-6">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button
              variant="primary"
              disabled={!canProceed}
              onClick={handleNext}
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

  // method === "manual"
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator
          currentStep={3}
          totalSteps={8}
          stepLabel="Manual Allocation"
        />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={currentCharacteristics}
              careerCharacteristics={careerCharacteristics}
              careerSkills={[]}
              careerSkillAllocation={careerSkillAllocation}
              career={career}
              species={species}
            />
          </aside>

          {/* Right column: step content (~2/3 width) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="font-serif text-3xl text-gray-100">
                  Manual Allocation
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Distribute exactly 100 points across all 10 characteristics.
              Minimum 4, maximum 18 per characteristic.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div
              className={`font-bold text-lg ${
                manualTotal === 100 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {manualTotal} / 100
            </div>
            <div className="text-xs text-gray-400">Points Allocated</div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 pb-2 text-[10px] uppercase tracking-widest text-gray-400">
          <div className="w-28 shrink-0" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 text-center">Base</div>
            <div className="w-4" />
            <div className="w-20 text-center">Allocated</div>
            <div className="w-4" />
            <div className="w-16 text-center">Total</div>
            <div className="w-10 text-center">Bonus</div>
          </div>
        </div>

        <div className="space-y-2">
          {CHARACTERISTIC_KEYS.map((key) => {
            const base = species.characteristics[key];
            const allocated = manualValues[key] ?? 4;
            const total = base + allocated;
            const bonus = Math.floor(total / 10);

            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-3"
              >
                <div className="w-28 shrink-0">
                  <span className="font-semibold text-amber-400 text-sm">
                    {key}
                  </span>
                  <span className="block text-xs text-gray-400 leading-tight mt-0.5">
                    {CHARACTERISTIC_FULL_NAMES[key]}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 text-center">
                    <span className="text-base font-mono text-gray-300 tabular-nums">
                      {base}
                    </span>
                  </div>

                  <span className="text-gray-400 text-sm w-4 text-center">
                    +
                  </span>

                  <div className="w-20">
                    <input
                      type="number"
                      min={4}
                      max={18}
                      value={allocated}
                      onChange={(e) => handleManualChange(key, e.target.value)}
                      className="w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 text-sm text-center font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <span className="text-gray-400 text-sm w-4 text-center">
                    =
                  </span>

                  <div className="w-16 text-center">
                    <span
                      className={`text-xl font-bold tabular-nums ${totalColour(
                        total
                      )}`}
                    >
                      {total}
                    </span>
                  </div>

                  <div className="w-10 text-center">
                    <span
                      className="text-sm tabular-nums text-gray-400"
                      title={`${key} Bonus`}
                    >
                      {bonus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {manualTotal !== 100 && (
          <p
            className={`mt-4 text-xs text-center ${
              manualTotal > 100 ? "text-red-400" : "text-amber-600"
            }`}
          >
            {manualTotal > 100
              ? `${manualTotal - 100} points over budget`
              : `${100 - manualTotal} points remaining`}
          </p>
          )}

        <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!canProceed}
            onClick={handleNext}
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
