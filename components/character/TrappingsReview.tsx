"use client";

import { useState } from "react";
import type { Career, StatusStanding, Species } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { Wealth } from "@/lib/rules/wealth";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import type { SpeciesSkillSelection } from "@/lib/rules/species";
import { getStartingWealthFormula, rollStartingWealth } from "@/lib/rules/wealth";
import { Button } from "@/components/ui/Button";
import { WealthDisplay } from "@/components/ui/WealthDisplay";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import trappingsData from "@/data/trappings.json";

interface TrappingsReviewProps {
  career: Career;
  careerLevelStatus: StatusStanding;
  initialWealth: Wealth | null;
  characterCharacteristics: Characteristics;
  careerCharacteristics: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  speciesSkillSelections: SpeciesSkillSelection[];
  talentIds: string[];
  species?: Species | null;
  onBack: () => void;
  onNext: (wealth: Wealth) => void;
}

export function TrappingsReview({
  career,
  careerLevelStatus,
  initialWealth,
  characterCharacteristics,
  careerCharacteristics,
  careerSkillAllocation,
  speciesSkillSelections,
  talentIds,
  species = null,
  onBack,
  onNext,
}: TrappingsReviewProps) {
  const careerLevel = career.levels[0];
  const [rolledWealth, setRolledWealth] = useState<Wealth | null>(initialWealth);

  const statusString = `${careerLevelStatus.tier} ${careerLevelStatus.standing}`;
  const formula = getStartingWealthFormula(statusString);

  const classTrappings =
    (trappingsData.classStartingTrappings as Record<string, string[]>)[
      career.careerClass
    ] ?? [];

  function handleRoll() {
    setRolledWealth(rollStartingWealth(statusString));
  }

  function handleNext() {
    onNext(rolledWealth ?? { gold: 0, silver: 0, brass: 0 });
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator
          currentStep={5}
          totalSteps={8}
          stepLabel="Starting Equipment"
        />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={careerCharacteristics}
              careerSkills={career.levels[0].skills.map(s => 
                s.specialisation ? `${s.skill} (${s.specialisation})`
                : s.anySpecialisation ? `${s.skill} (any)`
                : s.skill
              )}
              careerSkillAllocation={careerSkillAllocation}
              speciesSkills={speciesSkillSelections.map(sel => ({
                skillName: sel.skillId,
                advances: sel.advances
              }))}
              talentIds={talentIds}
              career={career}
              species={species}
            />
          </aside>

          {/* Right column: step content (~2/3 width) */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl text-gray-100 mb-2">
              Starting Equipment
            </h1>
            <p className="text-gray-400 mb-8 text-sm">
              As a{" "}
              <span className="text-amber-400">{careerLevel.title}</span>, you receive
              trappings from two sources: your career class and your specific career.
            </p>

            {/* Class Trappings Section */}
            <div className="rounded-lg border border-sky-800/50 bg-sky-950/30 p-6 mb-4">
              <h2 className="font-serif text-lg text-sky-400 mb-4">
                {career.careerClass} Class Trappings
              </h2>
              {classTrappings.length > 0 ? (
                <ul className="space-y-2">
                  {classTrappings.map((trapping, idx) => (
                    <li key={`class-${idx}`} className="flex items-center gap-3">
                      <span className="text-sky-600 text-xs shrink-0">◆</span>
                      <span className="text-gray-300 text-sm">{trapping}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No class trappings listed.
                </p>
              )}
            </div>

            {/* Career Trappings Section */}
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-6 mb-4">
              <h2 className="font-serif text-lg text-amber-400 mb-4">
                {careerLevel.title} Trappings
              </h2>
              {careerLevel.trappings.length > 0 ? (
                <ul className="space-y-2">
                  {careerLevel.trappings.map((trapping, idx) => (
                    <li key={`career-${idx}`} className="flex items-center gap-3">
                      <span className="text-amber-600 text-xs shrink-0">◆</span>
                      <span className="text-gray-300 text-sm">{trapping}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No specific career trappings listed.
                </p>
              )}
            </div>

            <p className="text-gray-400 text-xs italic mb-8">
              Some items may appear in both lists. Exact starting equipment is subject
              to GM discretion. Trappings establish social credibility and can be
              acquired during play.
            </p>

        {/* ── Starting Wealth ── */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-6 mb-8">
          <h2 className="font-serif text-lg text-amber-400 mb-1">
            Starting Wealth
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            {formula.tier === "Gold"
              ? `Deterministic: ${formula.level} Gold Crown${formula.level !== 1 ? "s" : ""} (${statusString} Status)`
              : `Roll ${formula.diceCount}d${formula.diceSides} × ${formula.level} — paid in ${formula.currency} pennies (${statusString} Status)`}
          </p>

          {rolledWealth ? (
            <div className="space-y-3">
              <WealthDisplay wealth={rolledWealth} size="lg" />
              <div>
                <Button variant="ghost" onClick={handleRoll} className="text-xs px-3 py-1.5">
                  ↻ Re-roll
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleRoll}>
              Roll Wealth
            </Button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-6">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button variant="primary" onClick={handleNext}>
              Next →
            </Button>
          </div>
        </div>
      </div>
        </div>
      </div>
    );
  }
