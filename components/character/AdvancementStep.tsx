"use client";

import { useState } from "react";
import type { Career, Talent, CharacteristicKey, Species } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { CreationAdvances } from "@/lib/types/character";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import { getCareerCreationOptions } from "@/lib/rules/careers";
import { getXpCostForCharacteristicAdvance, getTalentCharacteristicBonuses } from "@/lib/rules/characteristics";
import { getSkillXpCost } from "@/lib/rules/skills";
import talentsData from "@/data/talents.json";
import skillsData from "@/data/skills.json";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import type { SpeciesSkillDisplay } from "@/components/character/CurrentStatsPanel";
import type { SpeciesSkillSelection } from "@/lib/rules/species";

// ── Talent lookup ─────────────────────────────────────────────────────────────

const typedTalentsData = talentsData as unknown as Talent[];
const talentsByName = new Map(typedTalentsData.map((t) => [t.name, t]));

// ── Skill characteristic lookup ───────────────────────────────────────────────

interface SkillEntry {
  id: string;
  name: string;
  characteristic: string;
  grouped: boolean;
}

const skillsLookup = new Map<string, SkillEntry>(
  (skillsData as SkillEntry[]).map((s) => [s.name, s])
);

function lookupSkillCharacteristic(displayName: string): string | null {
  const exact = skillsLookup.get(displayName);
  if (exact) return exact.characteristic;
  const baseName = displayName.replace(/\s*\(.*\)$/, "").trim();
  for (const [, s] of skillsLookup) {
    if (s.name === baseName || s.name.startsWith(baseName + " (")) {
      return s.characteristic;
    }
  }
  return null;
}

// ── XP helpers ────────────────────────────────────────────────────────────────

function calcCharXpCost(existingAdvances: number, newAdvances: number): number {
  let total = 0;
  for (let i = 0; i < newAdvances; i++) {
    total += getXpCostForCharacteristicAdvance(existingAdvances + i);
  }
  return total;
}

function calcSkillXpCost(existingAdvances: number, newAdvances: number): number {
  let total = 0;
  for (let i = 0; i < newAdvances; i++) {
    total += getSkillXpCost(existingAdvances + i, true);
  }
  return total;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AdvancementStepProps {
  career: Career;
  careerLevel: 1 | 2 | 3 | 4;
  bonusXP: number;
  characterCharacteristics: Characteristics;
  careerSkillAllocation: CareerSkillAllocation[];
  speciesSkillSelections: SpeciesSkillSelection[];
  selectedCareerTalent: string | null;
  talentIds?: string[];
  species?: Species | null;
  initialAdvances: CreationAdvances;
  onComplete: (advances: CreationAdvances) => void;
  onBack: () => void;
}

// ── Collapsible panel ─────────────────────────────────────────────────────────

function Panel({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4 rounded-lg border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-900/80 text-left hover:bg-gray-900 transition-colors"
      >
        <span className="font-serif text-lg text-amber-400">{title}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
              {badge}
            </span>
          )}
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdvancementStep({
  career,
  careerLevel,
  bonusXP,
  characterCharacteristics,
  careerSkillAllocation,
  speciesSkillSelections,
  selectedCareerTalent,
  talentIds = [],
  species = null,
  initialAdvances,
  onComplete,
  onBack,
}: AdvancementStepProps) {
  const options = getCareerCreationOptions(career, careerLevel);

  // ── State ─────────────────────────────────────────────────────────────────

  const [charAdvances, setCharAdvances] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (const c of options.characteristics) {
        init[c] = initialAdvances.characteristics[c] ?? 0;
      }
      return init;
    }
  );

  const [skillAdvances, setSkillAdvances] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (const s of options.skills) {
        init[s] = initialAdvances.skills[s] ?? 0;
      }
      return init;
    }
  );

  const [takenTalents, setTakenTalents] = useState<string[]>(
    initialAdvances.talents
  );

  // ── XP calculation ────────────────────────────────────────────────────────

  function getCharExisting(abbrev: string): number {
    // At creation, characteristic advances are 0; base rolls don't count as "advances"
    return 0;
  }

  function getSkillExisting(skillName: string): number {
    const entry = careerSkillAllocation.find((a) => a.skillId === skillName);
    return entry?.advances ?? 0;
  }

  const charXpSpent = options.characteristics.reduce((sum, abbrev) => {
    const newAdv = charAdvances[abbrev] ?? 0;
    return sum + calcCharXpCost(getCharExisting(abbrev), newAdv);
  }, 0);

  const skillXpSpent = options.skills.reduce((sum, skillName) => {
    const newAdv = skillAdvances[skillName] ?? 0;
    return sum + calcSkillXpCost(getSkillExisting(skillName), newAdv);
  }, 0);

  const talentXpSpent = takenTalents.length * 100;

  const totalSpent = charXpSpent + skillXpSpent + talentXpSpent;
  const remaining = bonusXP - totalSpent;

  // ── Mutation helpers ──────────────────────────────────────────────────────

  function canSpend(cost: number): boolean {
    return remaining >= cost;
  }

  function changeChar(abbrev: string, delta: number) {
    setCharAdvances((prev) => {
      const current = prev[abbrev] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (delta > 0) {
        const cost = getXpCostForCharacteristicAdvance(
          getCharExisting(abbrev) + current
        );
        if (!canSpend(cost)) return prev;
      }
      return { ...prev, [abbrev]: next };
    });
  }

  function changeSkill(skillName: string, delta: number) {
    setSkillAdvances((prev) => {
      const current = prev[skillName] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (delta > 0) {
        const cost = getSkillXpCost(
          getSkillExisting(skillName) + current,
          true
        );
        if (!canSpend(cost)) return prev;
      }
      return { ...prev, [skillName]: next };
    });
  }

  function toggleTalent(talentName: string) {
    if (takenTalents.includes(talentName)) {
      setTakenTalents((prev) => prev.filter((t) => t !== talentName));
    } else {
      if (!canSpend(100)) return;
      setTakenTalents((prev) => [...prev, talentName]);
    }
  }

  // ── Finish ────────────────────────────────────────────────────────────────

  function handleFinish() {
    const advances: CreationAdvances = {
      characteristics: { ...charAdvances },
      skills: { ...skillAdvances },
      talents: [...takenTalents],
    };
    onComplete(advances);
  }

  // ── Live merged skills for left panel ─────────────────────────────────────

  // Species skills: convert from selections
  const liveSpeciesSkills: SpeciesSkillDisplay[] = speciesSkillSelections.map(
    (sel) => ({ skillName: sel.skillId, advances: sel.advances })
  );

  // Career skills: merge creation advances + local XP spend
  const liveCareerAlloc: CareerSkillAllocation[] = options.skills.map((skillName) => {
    const alloc = careerSkillAllocation.find((a) => a.skillId === skillName);
    const resolvedId = alloc?.customSpecialisation
      ? skillName.replace(" (any)", ` (${alloc.customSpecialisation})`)
      : skillName;
    const creationAdv = alloc?.advances ?? 0;
    const xpAdv = skillAdvances[skillName] ?? 0;
    return { skillId: resolvedId, advances: creationAdv + xpAdv };
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <StepIndicator currentStep={8} totalSteps={8} stepLabel="Advancement" />

        <div className="mb-6">
          <h1 className="font-serif text-3xl text-gray-100">Advancement</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Spend any bonus XP earned during character creation. You may only spend XP on
            the characteristics, skills, and talents available to your career level.
          </p>
        </div>

        {/* Two-column layout: stats left, XP spend right */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: Stats sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={options.characteristics}
              careerSkills={options.skills}
              careerSkillAllocation={liveCareerAlloc}
              speciesSkills={liveSpeciesSkills}
              talentIds={talentIds}
              career={career}
              species={species}
            />
          </div>

          {/* Right: XP spend */}
          <div className="flex-1 min-w-0">
            {/* XP Budget */}
            <div className="mb-6 rounded-lg border border-amber-700/30 bg-amber-900/10 px-5 py-4">
              {bonusXP === 0 ? (
                <p className="text-sm text-gray-400">
                  No bonus XP available (you made all free choices this session).
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="font-serif text-lg text-amber-400">
                      Bonus XP Available: {bonusXP} XP
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400 mb-3">
                    <div>Starting bonus: {bonusXP} XP</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-400">
                      Spent:{" "}
                      <span className="text-amber-400 font-mono font-bold">{totalSpent} XP</span>
                    </span>
                    <span className="text-gray-400">
                      Remaining:{" "}
                      <span
                        className={`font-mono font-bold ${
                          remaining < 0 ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {remaining} XP
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>

            {bonusXP === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>No XP to spend — proceed to finish your character.</p>
              </div>
            ) : (
              <>
                {/* Characteristics Panel */}
                <Panel title="Characteristics" badge={`${options.characteristics.length} available`}>
                  <p className="text-xs text-gray-400 mb-3">
                    Each advance costs 25 × (current advance + 1) XP.
                  </p>
                  <div className="space-y-2">
                    {options.characteristics.map((abbrev) => {
                      const newAdv = charAdvances[abbrev] ?? 0;
                      const base = characterCharacteristics[abbrev as keyof Characteristics] ?? 0;
                      const total = base + newAdv;
                      const nextCost = getXpCostForCharacteristicAdvance(
                        getCharExisting(abbrev) + newAdv
                      );

                      return (
                        <div
                          key={abbrev}
                          className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
                            newAdv > 0
                              ? "border-amber-700/40 bg-amber-900/10"
                              : "border-gray-800 bg-gray-900/60"
                          }`}
                        >
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${newAdv > 0 ? "text-amber-300" : "text-gray-100"}`}>
                              {abbrev}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {total} total
                            </span>
                            {newAdv > 0 && (
                              <span className="ml-1 text-xs text-amber-600">
                                (+{newAdv} from XP)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => changeChar(abbrev, -1)}
                              disabled={newAdv === 0}
                              className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                              aria-label={`Remove ${abbrev} advance`}
                            >
                              −
                            </button>
                            <span className={`w-6 text-center tabular-nums font-mono text-sm ${newAdv > 0 ? "text-amber-400" : "text-gray-400"}`}>
                              {newAdv}
                            </span>
                            <button
                              onClick={() => changeChar(abbrev, 1)}
                              disabled={!canSpend(nextCost)}
                              className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                              aria-label={`Add ${abbrev} advance`}
                            >
                              +
                            </button>
                            <span className="text-xs text-gray-400 w-16 text-right tabular-nums">
                              {nextCost} XP/next
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Skills Panel */}
                <Panel title="Skills" badge={`${options.skills.length} available`}>
                  <p className="text-xs text-gray-400 mb-3">
                    Career skill cost: 10 × (current advance + 1) XP per advance.
                  </p>
                  <div className="space-y-2">
                    {options.skills.map((skillName) => {
                      const alloc = careerSkillAllocation.find((a) => a.skillId === skillName);
                      const displayName = alloc?.customSpecialisation
                        ? skillName.replace(" (any)", ` (${alloc.customSpecialisation})`)
                        : skillName;
                      const existingAdv = getSkillExisting(skillName);
                      const newAdv = skillAdvances[skillName] ?? 0;
                      const nextCost = getSkillXpCost(existingAdv + newAdv, true);

                      return (
                        <div
                          key={skillName}
                          className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
                            newAdv > 0
                              ? "border-amber-700/40 bg-amber-900/10"
                              : "border-gray-800 bg-gray-900/60"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${newAdv > 0 ? "text-amber-300" : "text-gray-100"}`}>
                              {displayName}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {existingAdv} from creation
                            </span>
                            {newAdv > 0 && (
                              <span className="ml-1 text-xs text-amber-600">
                                (+{newAdv} XP)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => changeSkill(skillName, -1)}
                              disabled={newAdv === 0}
                              className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                              aria-label={`Remove ${skillName} advance`}
                            >
                              −
                            </button>
                            <span className={`w-6 text-center tabular-nums font-mono text-sm ${newAdv > 0 ? "text-amber-400" : "text-gray-400"}`}>
                              {newAdv}
                            </span>
                            <button
                              onClick={() => changeSkill(skillName, 1)}
                              disabled={!canSpend(nextCost) || existingAdv + newAdv >= 10}
                              className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                              aria-label={`Add ${skillName} advance`}
                            >
                              +
                            </button>
                            <span className="text-xs text-gray-400 w-16 text-right tabular-nums">
                              {nextCost} XP/next
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Talents Panel */}
                <Panel title="Talents" badge={`${options.talents.length} available`}>
                  <p className="text-xs text-gray-400 mb-3">
                    Each talent costs 100 XP. You already received one free from Step 4.
                  </p>
                  <div className="space-y-2">
                    {options.talents.map((talentName) => {
                      const alreadyTakenInStep4 = selectedCareerTalent === talentName;
                      const takenWithXP = takenTalents.includes(talentName);
                      const canAfford = canSpend(100);
                      const talentInfo = talentsByName.get(talentName);

                      return (
                        <div
                          key={talentName}
                          className={`rounded-lg border px-4 py-3 transition-colors ${
                            alreadyTakenInStep4
                              ? "border-gray-700/50 bg-gray-900/30"
                              : takenWithXP
                              ? "border-amber-500/60 bg-amber-900/20"
                              : "border-gray-800 bg-gray-900/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-medium ${
                                    alreadyTakenInStep4
                                      ? "text-gray-400"
                                      : takenWithXP
                                      ? "text-amber-300"
                                      : "text-gray-100"
                                  }`}
                                >
                                  {talentName}
                                </span>
                                {alreadyTakenInStep4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
                                    already taken (Step 4)
                                  </span>
                                )}
                                {takenWithXP && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-700/40">
                                    100 XP spent
                                  </span>
                                )}
                              </div>
                              {talentInfo?.description && (
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                  {talentInfo.description}
                                </p>
                              )}
                            </div>
                            {!alreadyTakenInStep4 && (
                              <button
                                onClick={() => toggleTalent(talentName)}
                                disabled={!takenWithXP && !canAfford}
                                className={`shrink-0 text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                  takenWithXP
                                    ? "border-red-700/50 bg-red-900/20 text-red-400 hover:bg-red-900/30"
                                    : "border-amber-700/50 bg-amber-900/20 text-amber-400 hover:bg-amber-900/30"
                                }`}
                              >
                                {takenWithXP ? "Remove" : "Take (100 XP)"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-4">
              <Button variant="ghost" onClick={onBack}>
                ← Back
              </Button>
              <Button variant="primary" onClick={handleFinish}>
                Finish — Create Character
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
