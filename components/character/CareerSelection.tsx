"use client";

import { useState } from "react";
import type { Career, CareerClass, StatusTier, Species } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import { rollRandomCareerWithDie } from "@/lib/rules/careers";

type CareerChoiceMethod = "random" | "rolled3pick1" | "chosen";

const STATUS_TIER_STYLES: Record<StatusTier, string> = {
  Gold: "text-yellow-400 bg-yellow-400/10 border border-yellow-500/30",
  Silver: "text-gray-300 bg-gray-300/10 border border-gray-500/40",
  Brass: "text-orange-400 bg-orange-400/10 border border-orange-500/30",
};

interface CareerCardProps {
  career: Career;
  selected: boolean;
  onSelect: () => void;
  xpBadge?: string;
  locked?: boolean;
}

function CareerCard({ career, selected, onSelect, xpBadge, locked }: CareerCardProps) {
  const level1 = career.levels[0];
  const { tier, standing } = level1.status;

  return (
    <Card selected={selected} onClick={locked ? () => {} : onSelect}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-lg text-gray-100 leading-tight">
          {career.name}
        </h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {selected && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-gray-950">
              Selected
            </span>
          )}
          {selected && xpBadge && (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-100">
              {xpBadge}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3 italic">{level1.title}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-400">
          {career.careerClass}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_TIER_STYLES[tier]}`}
        >
          {tier} {standing}
        </span>
      </div>
    </Card>
  );
}

interface CareerSelectionProps {
  allCareers: Career[];
  initialSelectedId?: string | null;
  initialChoiceMethod?: CareerChoiceMethod;
  characterCharacteristics: Characteristics;
  careerSkillAllocation: CareerSkillAllocation[];
  species?: Species | null;
  onBack: () => void;
  onNext: (careerId: string, method: CareerChoiceMethod) => void;
}

export function CareerSelection({
  allCareers,
  initialSelectedId,
  initialChoiceMethod,
  characterCharacteristics,
  careerSkillAllocation,
  species = null,
  onBack,
  onNext,
}: CareerSelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null
  );
  const [choiceMode, setChoiceMode] = useState<CareerChoiceMethod>(
    initialChoiceMethod ?? "chosen"
  );
  const [rolledCareers, setRolledCareers] = useState<Career[]>(() => {
    // On re-entry with rolled3pick1, restore the previously selected career as the option
    if (initialChoiceMethod === "rolled3pick1" && initialSelectedId) {
      const c = allCareers.find((c) => c.id === initialSelectedId);
      return c ? [c] : [];
    }
    return [];
  });

  const [activeClass, setActiveClass] = useState<CareerClass | "All">("All");

  // Lock state — each roll button can only be clicked once
  const [hasRolledRandom, setHasRolledRandom] = useState(initialChoiceMethod === "random");
  const [hasRolled3Pick1, setHasRolled3Pick1] = useState(initialChoiceMethod === "rolled3pick1");

  // Roll result display
  const [randomRollDisplay, setRandomRollDisplay] = useState<{ dieValue: number; careerName: string } | null>(null);
  const [roll3Dice, setRoll3Dice] = useState<number[]>([]);

  const availableClasses = Array.from(
    new Set(allCareers.map((c) => c.careerClass))
  ).sort() as CareerClass[];

  const classCounts = Object.fromEntries(
    availableClasses.map((cls) => [
      cls,
      allCareers.filter((c) => c.careerClass === cls).length,
    ])
  ) as Record<CareerClass, number>;

  const filteredCareers =
    activeClass === "All"
      ? allCareers
      : allCareers.filter((c) => c.careerClass === activeClass);

  // Get career characteristics for selected/highlighted career
  const selectedCareer = selectedId ? allCareers.find((c) => c.id === selectedId) : null;
  const careerCharacteristics = selectedCareer ? selectedCareer.levels[0].characteristics : [];

  function handleRollRandom() {
    const { roll, career } = rollRandomCareerWithDie(allCareers);
    setSelectedId(career.id);
    setChoiceMode("random");
    setRolledCareers([]);
    setHasRolledRandom(true);
    setRandomRollDisplay({ dieValue: roll, careerName: career.name });
  }

  function handleRoll3Pick1() {
    const picked: Array<{ roll: number; career: Career }> = [];
    const usedIds = new Set<string>();
    while (picked.length < 3) {
      const result = rollRandomCareerWithDie(allCareers);
      if (!usedIds.has(result.career.id)) {
        usedIds.add(result.career.id);
        picked.push(result);
      }
    }
    setRolledCareers(picked.map((p) => p.career));
    setRoll3Dice(picked.map((p) => p.roll));
    setSelectedId(null);
    setChoiceMode("rolled3pick1");
    setHasRolled3Pick1(true);
  }

  function handleChooseFreely() {
    setChoiceMode("chosen");
    setRolledCareers([]);
    setSelectedId(null);
  }

  const modeButtonBase =
    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors";

  const lockedBadgeClass =
    "flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed select-none";

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator currentStep={2} totalSteps={8} stepLabel="Choose Your Career" />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={careerCharacteristics}
              careerSkills={selectedCareer ? selectedCareer.levels[0].skills.map(s => 
                s.specialisation ? `${s.skill} (${s.specialisation})`
                : s.anySpecialisation ? `${s.skill} (any)`
                : s.skill
              ) : []}
              careerSkillAllocation={careerSkillAllocation}
              career={selectedCareer}
              species={species}
            />
          </aside>

          {/* Right column: step content (~2/3 width) */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl text-gray-100 mb-2">
              Choose Your Career
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          Your career defines your place in Old World society, your advancement path, and the skills and
          talents available to you. Each career has four levels of increasing prestige.
        </p>

        {/* Choice mode buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {hasRolledRandom ? (
            <span className={lockedBadgeClass}>
              🎲 Rolled
              <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-400">
                +50 XP
              </span>
            </span>
          ) : (
            <button
              onClick={handleRollRandom}
              className={`${modeButtonBase} ${
                choiceMode === "random"
                  ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                  : "border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-600 hover:bg-gray-900"
              }`}
            >
              🎲 Roll Randomly
              <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                +50 XP
              </span>
            </button>
          )}

          {hasRolled3Pick1 ? (
            <span className={lockedBadgeClass}>
              🎲 Rolled ×3
              <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-400">
                +25 XP
              </span>
            </span>
          ) : (
            <button
              onClick={handleRoll3Pick1}
              className={`${modeButtonBase} ${
                choiceMode === "rolled3pick1"
                  ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                  : "border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-600 hover:bg-gray-900"
              }`}
            >
              🎲 Roll 3×, Pick One
              <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                +25 XP
              </span>
            </button>
          )}

          <button
            onClick={handleChooseFreely}
            className={`${modeButtonBase} ${
              choiceMode === "chosen"
                ? "border-amber-600 bg-amber-900/20 text-amber-300"
                : "border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-600 hover:bg-gray-900"
            }`}
          >
            Choose Freely
          </button>
        </div>

        {/* Random roll result display */}
        {randomRollDisplay && choiceMode === "random" && (
          <p className="mb-4 text-xs text-amber-400 font-mono">
            Rolled: {randomRollDisplay.dieValue} → {randomRollDisplay.careerName}
          </p>
        )}

        {/* Roll 3× dice display */}
        {roll3Dice.length > 0 && choiceMode === "rolled3pick1" && (
          <p className="mb-4 text-xs text-amber-400 font-mono">
            Rolled: {roll3Dice.join(", ")}
          </p>
        )}

        {/* Random roll result */}
        {choiceMode === "random" && selectedId && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3 italic">
              The dice have spoken — this career is binding.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allCareers
                .filter((c) => c.id === selectedId)
                .map((career) => (
                  <CareerCard
                    key={career.id}
                    career={career}
                    selected
                    onSelect={() => {}}
                    xpBadge="+50 XP"
                    locked
                  />
                ))}
            </div>
          </div>
        )}

        {/* Rolled 3, pick one */}
        {choiceMode === "rolled3pick1" && rolledCareers.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3 italic">
              {selectedId
                ? "You've made your choice."
                : "Three fates before you — pick one."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rolledCareers.map((career) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  selected={selectedId === career.id}
                  onSelect={() => setSelectedId(career.id)}
                  xpBadge="+25 XP"
                />
              ))}
            </div>
          </div>
        )}

        {choiceMode === "rolled3pick1" && rolledCareers.length === 0 && (
          <p className="mb-6 text-xs text-gray-400 italic">
            Click &ldquo;Roll 3×, Pick One&rdquo; above to roll your career options.
          </p>
        )}

        {/* Freely chosen: class filter tabs + career grid */}
        {choiceMode === "chosen" && (
          <>
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveClass("All")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeClass === "All"
                    ? "bg-amber-500 text-gray-950"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                All{" "}
                <span
                  className={`ml-1 text-[10px] ${
                    activeClass === "All" ? "opacity-70" : "opacity-50"
                  }`}
                >
                  {allCareers.length}
                </span>
              </button>
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setActiveClass(cls)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeClass === cls
                      ? "bg-amber-500 text-gray-950"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                  }`}
                >
                  {cls}{" "}
                  <span
                    className={`ml-1 text-[10px] ${
                      activeClass === cls ? "opacity-70" : "opacity-50"
                    }`}
                  >
                    {classCounts[cls]}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {filteredCareers.map((career) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  selected={selectedId === career.id}
                  onSelect={() =>
                    setSelectedId(selectedId === career.id ? null : career.id)
                  }
                />
              ))}
            </div>
            </>
          )}

        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!selectedId}
            onClick={() => selectedId && onNext(selectedId, choiceMode)}
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
