"use client";

import { useState } from "react";
import type { Career, CareerLevel, CareerSkillEntry, Skill, Species } from "@/lib/types/rules";
import { getSkillXpCost } from "@/lib/rules/skills";
import { getTotalTalentXpCost } from "@/lib/rules/talents";
import { getSpeciesFixedTalents } from "@/lib/rules/species";
import { getCreationXP, type CareerChoiceMethod, type SpeciesChoiceMethod } from "@/lib/rules/creation-xp";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";

const SKILLS_TO_COMPLETE_LEVEL = 8;

interface SkillRow {
  displayName: string;
  characteristic: string | null;
  isAdvanced: boolean;
}

function buildSkillDisplayName(entry: CareerSkillEntry): string {
  // Some career data has "Melee - Basic" with specialisation "Basic" — strip the duplicate
  const baseName = entry.specialisation
    ? entry.skill.replace(new RegExp(`\\s*-\\s*${entry.specialisation}$`, "i"), "").trim()
    : entry.skill;
  if (entry.specialisation) return `${baseName} (${entry.specialisation})`;
  if (entry.anySpecialisation) return `${baseName} (any)`;
  return baseName;
}

function findSkill(entry: CareerSkillEntry, allSkills: Skill[]): Skill | undefined {
  const displayName = buildSkillDisplayName(entry);
  if (entry.anySpecialisation) {
    return allSkills.find((s) => s.grouped && s.name.startsWith(entry.skill + " ("));
  }
  return allSkills.find((s) => s.name === displayName);
}

function buildSkillRows(careerLevel: CareerLevel, allSkills: Skill[]): SkillRow[] {
  return careerLevel.skills.map((entry) => {
    const matched = findSkill(entry, allSkills);
    return {
      displayName: buildSkillDisplayName(entry),
      characteristic: matched?.characteristic ?? null,
      isAdvanced: matched?.advanced ?? false,
    };
  });
}

function calcSkillXpCost(advances: number): number {
  let total = 0;
  for (let i = 0; i < advances; i++) {
    total += getSkillXpCost(i, true);
  }
  return total;
}

function calcTotalXP(skillAdvances: Record<string, number>): number {
  return Object.values(skillAdvances).reduce(
    (sum, adv) => sum + calcSkillXpCost(adv),
    0
  );
}

interface SkillsAndTalentsProps {
  career: Career;
  allSkills: Skill[];
  speciesId: string;
  allSpecies: Species[];
  speciesChoiceMethod: SpeciesChoiceMethod;
  careerChoiceMethod: CareerChoiceMethod;
  initialSkillAdvances: Record<string, number>;
  initialSelectedTalents: string[];
  onBack: () => void;
  onNext: (skillAdvances: Record<string, number>, selectedTalents: string[]) => void;
}

export function SkillsAndTalents({
  career,
  allSkills,
  speciesId,
  allSpecies,
  speciesChoiceMethod,
  careerChoiceMethod,
  initialSkillAdvances,
  initialSelectedTalents,
  onBack,
  onNext,
}: SkillsAndTalentsProps) {
  const careerLevel = career.levels[0];
  const skillRows = buildSkillRows(careerLevel, allSkills);
  const completionTarget = careerLevel.level * 5; // 5 for Level 1

  const xpBudget = getCreationXP(speciesChoiceMethod, careerChoiceMethod);

  const speciesFixedTalents = getSpeciesFixedTalents(speciesId, allSpecies);

  // Species fixed talents are auto-granted — exclude them from career talent state
  const initialCareerTalents = initialSelectedTalents.filter(
    (t) => !speciesFixedTalents.includes(t)
  );

  const [skillAdvances, setSkillAdvances] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const row of skillRows) {
      init[row.displayName] = initialSkillAdvances[row.displayName] ?? 0;
    }
    return init;
  });

  const [selectedTalents, setSelectedTalents] = useState<string[]>(
    initialCareerTalents
  );

  const totalXP = calcTotalXP(skillAdvances) + getTotalTalentXpCost(selectedTalents.length);
  const xpRemaining = xpBudget - totalXP;
  const overBudget = xpRemaining < 0;
  const skillsAtTarget = skillRows.filter(
    (row) => (skillAdvances[row.displayName] ?? 0) >= completionTarget
  ).length;

  function changeAdvances(skillName: string, delta: number) {

    setSkillAdvances((prev) => {
      const current = prev[skillName] ?? 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [skillName]: next };
    });
  }

  function toggleTalent(talentName: string) {
    setSelectedTalents((prev) =>
      prev.includes(talentName)
        ? prev.filter((t) => t !== talentName)
        : [...prev, talentName]
    );
  }

  const canContinue = selectedTalents.length >= 1;

  function handleNext() {
    if (canContinue) {
      // Merge auto-granted species talents with player-chosen career talents
      onNext(skillAdvances, [...speciesFixedTalents, ...selectedTalents]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <StepIndicator
          currentStep={4}
          totalSteps={8}
          stepLabel="Skills & Talents"
        />

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-gray-100">
              Skills &amp; Talents
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Distribute advances among your{" "}
              <span className="text-amber-400">{career.name}</span> career
              skills and choose at least one starting talent.
            </p>
          </div>

          {/* XP Budget */}
          <div
            className={`shrink-0 rounded-lg border px-4 py-2 text-center transition-colors ${
              xpBudget > 0 && overBudget
                ? "border-amber-500/60 bg-amber-900/20"
                : "border-amber-700/40 bg-amber-900/10"
            }`}
          >
            {xpBudget === 0 ? (
              <>
                <div className="text-sm font-medium text-gray-400">No bonus XP</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  you made all free choices
                </div>
              </>
            ) : (
              <>
                <div
                  className={`text-xl font-bold font-mono ${
                    overBudget ? "text-amber-400" : "text-amber-400"
                  }`}
                >
                  {xpRemaining}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-amber-600 mt-0.5">
                  Bonus XP remaining
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  of {xpBudget} total
                </div>
                <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  {[
                    speciesChoiceMethod === "random" ? "+20 random species" : null,
                    careerChoiceMethod === "random" ? "+50 random career" : null,
                    careerChoiceMethod === "rolled3pick1" ? "+25 rolled career" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </div>
              </>
            )}
          </div>
        </div>

        {xpBudget > 0 && overBudget && (
          <p className="mb-4 text-xs text-amber-400 rounded border border-amber-700/40 bg-amber-900/10 px-3 py-2">
            ⚠ You&apos;ve exceeded your starting XP budget by {Math.abs(xpRemaining)} XP. You can still continue — note these as planned future advances.{" "}
            <span
              className="underline decoration-dotted cursor-help"
              title="Starting XP values are approximate — verify with your GM"
            >
              Starting XP values are approximate — verify with your GM.
            </span>
          </p>
        )}

        {/* Career Skills */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-amber-400">Career Skills</h2>
            <span
              className={`text-xs px-2 py-1 rounded transition-colors ${
                skillsAtTarget >= SKILLS_TO_COMPLETE_LEVEL
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700/40"
              }`}
            >
              {skillsAtTarget}/{SKILLS_TO_COMPLETE_LEVEL} at {completionTarget}
              + advances to complete L1
            </span>
          </div>

          <div className="space-y-2">
            {skillRows.map((row) => {
              const advances = skillAdvances[row.displayName] ?? 0;
              const atTarget = advances >= completionTarget;
              const xpForRow = calcSkillXpCost(advances);

              return (
                <div
                  key={row.displayName}
                  className={`flex items-center gap-4 rounded-lg border px-5 py-3 transition-colors ${
                    atTarget
                      ? "border-amber-700/50 bg-amber-900/10"
                      : "border-gray-800 bg-gray-900/60"
                  }`}
                >
                  {/* Skill info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium ${
                        atTarget ? "text-amber-300" : "text-gray-100"
                      }`}
                    >
                      {row.displayName}
                    </span>
                    {row.characteristic && (
                      <span className="ml-2 text-xs text-gray-400">
                        {row.characteristic}
                      </span>
                    )}
                    {row.isAdvanced && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-orange-500/70">
                        Advanced
                      </span>
                    )}
                  </div>

                  {/* Advance counter */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => changeAdvances(row.displayName, -1)}
                      disabled={advances === 0}
                      className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                      aria-label={`Decrease ${row.displayName} advances`}
                    >
                      −
                    </button>
                    <span
                      className={`w-8 text-center tabular-nums font-mono text-sm ${
                        advances > 0 ? "text-amber-400" : "text-gray-400"
                      }`}
                    >
                      {advances}
                    </span>
                    <button
                      onClick={() => changeAdvances(row.displayName, 1)}
                      disabled={advances >= 10}
                      className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                      aria-label={`Increase ${row.displayName} advances`}
                    >
                      +
                    </button>
                    <span
                      className={`text-xs w-14 text-right tabular-nums ${
                        advances > 0 ? "text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {advances > 0 ? `${xpForRow} XP` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Species Talents (auto-granted) */}
        {speciesFixedTalents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-xl text-amber-400">
                Species Talents
              </h2>
              <span className="text-xs px-2 py-0.5 rounded border border-gray-700/50 bg-gray-800/60 text-gray-400">
                auto-granted
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {speciesFixedTalents.map((talent) => (
                <div
                  key={talent}
                  className="rounded-lg border border-gray-700/50 bg-gray-900/40 px-4 py-3 text-gray-400 select-none"
                >
                  <span className="text-sm font-medium text-gray-300">
                    {talent}
                  </span>
                  <span className="ml-2 text-[10px] text-gray-400">
                    (species)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Career Talents */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-amber-400">
              Career Talents
            </h2>
            <span
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                selectedTalents.length >= 1
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-red-900/20 text-red-400 border-red-800/40"
              }`}
            >
              {selectedTalents.length >= 1
                ? `${selectedTalents.length} selected`
                : "Pick at least 1"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {careerLevel.talents.map((entry) => {
              const selected = selectedTalents.includes(entry.talent);
              return (
                <button
                  key={entry.talent}
                  onClick={() => toggleTalent(entry.talent)}
                  className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                    selected
                      ? "border-amber-500/60 bg-amber-900/20 text-amber-300"
                      : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                  }`}
                >
                  <span className="text-sm font-medium">{entry.talent}</span>
                  {selected && (
                    <span className="ml-2 text-[10px] text-amber-500">✓</span>
                  )}
                  {entry.choiceGroup && (
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      Choice group {entry.choiceGroup}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!canContinue && (
            <p className="mt-3 text-xs text-red-400">
              You must select at least one talent to continue.
            </p>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={handleNext}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
