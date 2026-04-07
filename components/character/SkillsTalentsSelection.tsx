"use client";

import { useState } from "react";
import type { Career, CareerSkillEntry, Skill, CharacteristicKey, Species } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { SpeciesSkillSelection } from "@/lib/rules/species";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import {
  getFixedSpeciesTalents,
  getChoiceSpeciesTalents,
  getRandomTalentCount,
  getRandomTalentPool,
} from "@/lib/rules/species";
import talentsData from "@/data/talents.json";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";

// ── Talent ID helper ─────────────────────────────────────────────────────────

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()'"]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Talent description lookup ─────────────────────────────────────────────────

interface TalentEntry {
  id: string;
  name: string;
  description?: string;
  tests?: string;
  max?: number | "bonus";
  bonusCharacteristic?: string;
}

const talentsById = new Map<string, TalentEntry>(
  (talentsData as TalentEntry[]).map((t) => [t.name, t])
);

/** Look up a talent by exact name or by stripping a specialisation suffix like " (Any)" or " (Cultists)". */
function resolveTalentInfo(talentName: string): TalentEntry | undefined {
  const exact = talentsById.get(talentName);
  if (exact) return exact;
  // Handle "Bless (Any)", "Etiquette (Cultists)", "Read/Write", etc.
  const normalized = talentName.replace(/\//g, '-');
  for (const [key, val] of talentsById) {
    if (normalized === key.replace(/\//g, '-')) return val;
    // Strip specialisation: "Bless (Any)" → base "Bless"
    const parenIdx = talentName.indexOf(' (');
    if (parenIdx > -1) {
      const base = talentName.slice(0, parenIdx);
      if (talentsById.has(base)) return talentsById.get(base);
    }
  }
  return undefined;
}

/** Returns how many times a talent may be taken given the character's current characteristics. */
function getTalentMaxAllowed(talentName: string, characteristics: Characteristics): number {
  const info = talentsById.get(talentName);
  if (!info || info.max === undefined) return 1;
  if (info.max === "bonus") {
    const charValue = info.bonusCharacteristic
      ? (characteristics[info.bonusCharacteristic as CharacteristicKey] ?? 0)
      : 0;
    return Math.floor(charValue / 10);
  }
  return info.max as number;
}

/**
 * Counts how many times `talentName` is already selected, optionally excluding
 * a specific slot (so we don't penalise the slot currently being evaluated).
 */
function getTalentCountExcluding(
  talentName: string,
  fixedTalents: string[],
  speciesChoiceTalents: string[],
  speciesRandomTalents: string[],
  selectedTalent: string | null,
  excludeChoiceIndex?: number,
  excludeRandomIndex?: number,
  excludeCareer?: boolean
): number {
  let count = 0;
  count += fixedTalents.filter((t) => t === talentName).length;
  count += speciesChoiceTalents.filter((t, i) => t === talentName && i !== excludeChoiceIndex).length;
  count += speciesRandomTalents.filter((t, i) => t === talentName && i !== excludeRandomIndex).length;
  if (!excludeCareer && selectedTalent === talentName) count++;
  return count;
}

// ── Skill display name helper ─────────────────────────────────────────────────

function buildSkillDisplayName(entry: CareerSkillEntry): string {
  // Some career data has "Melee - Basic" with specialisation "Basic" — strip the duplicate
  const baseName = entry.specialisation
    ? entry.skill.replace(new RegExp(`\\s*-\\s*${entry.specialisation}$`, "i"), "").trim()
    : entry.skill;
  if (entry.specialisation) return `${baseName} (${entry.specialisation})`;
  if (entry.anySpecialisation) return `${baseName} (any)`;
  return baseName;
}

function findSkillChar(name: string, allSkills: Skill[]): string | null {
  const s = allSkills.find((sk) => sk.name === name);
  return s?.characteristic ?? null;
}

/** Returns the available specialisation names for a grouped skill (e.g. "Melee" → ["Basic","Brawling",…]). */
function getAvailableSpecialisations(skillBase: string, allSkills: Skill[]): string[] {
  return allSkills
    .filter((s) => s.grouped && s.name.startsWith(`${skillBase} (`))
    .map((s) => s.name.slice(skillBase.length + 2, -1)); // strip "Skill (" prefix and ")" suffix
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SkillsTalentsSelectionProps {
  speciesStartingSkills: string[];
  species: Species;
  career: Career;
  allSkills: Skill[];
  initialSpeciesSelections: SpeciesSkillSelection[];
  initialCareerAllocation: CareerSkillAllocation[];
  initialSelectedCareerTalent: string | null;
  speciesChoiceTalents: string[];
  onSpeciesChoiceTalentChange: (index: number, talent: string) => void;
  speciesRandomTalents: string[];
  onSpeciesRandomTalentChange: (index: number, talent: string) => void;
  onCareerTalentChange?: (talent: string | null) => void;
  characterCharacteristics: Characteristics;
  careerCharacteristics: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  onBack: () => void;
  onNext: (
    speciesSkillSelections: SpeciesSkillSelection[],
    careerSkillAllocation: CareerSkillAllocation[],
    selectedCareerTalent: string
  ) => void;
}

// ── Choice-group render item type ─────────────────────────────────────────────

type SkillRenderItem =
  | { type: "individual"; idx: number; name: string; entry: CareerSkillEntry }
  | { type: "choice"; letter: string; options: Array<{ idx: number; name: string; entry: CareerSkillEntry }> };

// ── Component ─────────────────────────────────────────────────────────────────

export function SkillsTalentsSelection({
  speciesStartingSkills,
  species,
  career,
  allSkills,
  initialSpeciesSelections,
  initialCareerAllocation,
  initialSelectedCareerTalent,
  speciesChoiceTalents,
  onSpeciesChoiceTalentChange,
  speciesRandomTalents,
  onSpeciesRandomTalentChange,
  onCareerTalentChange,
  characterCharacteristics,
  careerCharacteristics,
  careerSkillAllocation,
  onBack,
  onNext,
}: SkillsTalentsSelectionProps) {
  const careerLevel = career.levels[0];
  const careerSkillDisplayNames = careerLevel.skills.map(buildSkillDisplayName);

  // ── Choice group analysis ────────────────────────────────────────────────
  // Build an ordered list collapsing choice-group siblings into a single item.
  const skillRenderItems: SkillRenderItem[] = (() => {
    const groupMap = new Map<string, Array<{ idx: number; name: string; entry: CareerSkillEntry }>>();
    for (let i = 0; i < careerLevel.skills.length; i++) {
      const entry = careerLevel.skills[i];
      if (entry.choiceGroup) {
        if (!groupMap.has(entry.choiceGroup)) groupMap.set(entry.choiceGroup, []);
        groupMap.get(entry.choiceGroup)!.push({ idx: i, name: careerSkillDisplayNames[i], entry });
      }
    }
    const seenGroups = new Set<string>();
    const items: SkillRenderItem[] = [];
    for (let i = 0; i < careerLevel.skills.length; i++) {
      const entry = careerLevel.skills[i];
      const name = careerSkillDisplayNames[i];
      if (!entry.choiceGroup) {
        items.push({ type: "individual", idx: i, name, entry });
      } else if (!seenGroups.has(entry.choiceGroup)) {
        seenGroups.add(entry.choiceGroup);
        items.push({ type: "choice", letter: entry.choiceGroup, options: groupMap.get(entry.choiceGroup)! });
      }
    }
    return items;
  })();

  // Default choice group selections: restore from prior allocation, or pick first option.
  const defaultChoiceGroupSelections = (() => {
    const result: Record<string, string> = {};
    for (const item of skillRenderItems) {
      if (item.type !== "choice") continue;
      const existingChoice = item.options.find((opt) =>
        initialCareerAllocation.find((a) => a.skillId === opt.name && a.advances > 0)
      );
      result[item.letter] = existingChoice?.name ?? item.options[0].name;
    }
    return result;
  })();

  // ── Species talent computed values ───────────────────────────────────────
  const fixedTalents = getFixedSpeciesTalents(species);
  const choiceTalents = getChoiceSpeciesTalents(species);
  const randomCount = getRandomTalentCount(species);
  const randomPool = getRandomTalentPool();

  // ── Sub-section A: Species skill selections ──────────────────────────────

  const initialPlusFive = initialSpeciesSelections
    .filter((s) => s.advances === 5)
    .map((s) => s.skillId);
  const initialPlusThree = initialSpeciesSelections
    .filter((s) => s.advances === 3)
    .map((s) => s.skillId);

  const [plusFive, setPlusFive] = useState<string[]>(initialPlusFive);
  const [plusThree, setPlusThree] = useState<string[]>(initialPlusThree);

  function handleSpeciesSkillClick(skillName: string) {
    if (plusFive.includes(skillName)) {
      setPlusFive((prev) => prev.filter((s) => s !== skillName));
      return;
    }
    if (plusThree.includes(skillName)) {
      setPlusThree((prev) => prev.filter((s) => s !== skillName));
      return;
    }
    // Unselected — assign to +5 first, then +3
    if (plusFive.length < 3) {
      setPlusFive((prev) => [...prev, skillName]);
    } else if (plusThree.length < 3) {
      setPlusThree((prev) => [...prev, skillName]);
    }
    // Both tiers full — nothing happens; user must deselect first
  }

  // ── Sub-section B: Career skill allocation ───────────────────────────────

  const [choiceGroupSelections, setChoiceGroupSelections] = useState<Record<string, string>>(
    defaultChoiceGroupSelections
  );

  const [allocation, setAllocation] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (let i = 0; i < careerSkillDisplayNames.length; i++) {
      const name = careerSkillDisplayNames[i];
      const entry = careerLevel.skills[i];
      const existing = initialCareerAllocation.find((a) => a.skillId === name);
      if (existing) {
        init[name] = existing.advances;
      } else if (!entry.choiceGroup || defaultChoiceGroupSelections[entry.choiceGroup] === name) {
        init[name] = 5; // active skill slot → default 5
      } else {
        init[name] = 0; // inactive choice option → 0
      }
    }
    return init;
  });

  // Skills that are "active" for budget / allocation purposes
  const activeSkillDisplayNames: string[] = skillRenderItems.flatMap((item) => {
    if (item.type === "individual") return [item.name];
    const sel = choiceGroupSelections[item.letter];
    return sel ? [sel] : [];
  });

  // ── Any-specialisation choices ──────────────────────────────────────────────

  const [anySpec, setAnySpec] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const name of careerSkillDisplayNames) {
      const existing = initialCareerAllocation.find((a) => a.skillId === name);
      if (existing?.customSpecialisation) init[name] = existing.customSpecialisation;
    }
    return init;
  });

  // ── Species any-specialisation choices ─────────────────────────────────────

  const [speciesAnySpec, setSpeciesAnySpec] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const sel of initialSpeciesSelections) {
      if (sel.customSpecialisation) init[sel.skillId] = sel.customSpecialisation;
    }
    return init;
  });

  const totalAllocated = activeSkillDisplayNames.reduce((s, name) => s + (allocation[name] ?? 0), 0);
  const remainingPool = 40 - totalAllocated;

  function changeAllocation(skillName: string, delta: number) {
    setAllocation((prev) => {
      const current = prev[skillName] ?? 0;
      const next = Math.max(0, Math.min(10, current + delta));
      // Don't allow going over 40 total
      const newTotal = totalAllocated - current + next;
      if (newTotal > 40) return prev;
      return { ...prev, [skillName]: next };
    });
  }

  // ── Sub-section D: Career talent ─────────────────────────────────────────

  const [selectedTalent, setSelectedTalent] = useState<string | null>(
    initialSelectedCareerTalent
  );

  function handleCareerTalentSelect(talent: string) {
    const next = selectedTalent === talent ? null : talent;
    setSelectedTalent(next);
    onCareerTalentChange?.(next);
  }

  // ── Live talent IDs (for CurrentStatsPanel) ───────────────────────────────

  const liveTalentIds = [
    ...fixedTalents.map((n) => talentsById.get(n)?.id ?? nameToId(n)),
    ...speciesChoiceTalents.filter(Boolean).map((n) => talentsById.get(n)?.id ?? nameToId(n)),
    ...speciesRandomTalents.filter(Boolean).map((n) => talentsById.get(n)?.id ?? nameToId(n)),
    ...(selectedTalent ? [talentsById.get(selectedTalent)?.id ?? nameToId(selectedTalent)] : []),
  ];

  // ── Live career allocation (for CurrentStatsPanel) ────────────────────────

  const liveCareerAlloc: CareerSkillAllocation[] = activeSkillDisplayNames.map((name) => {
    const idx = careerSkillDisplayNames.indexOf(name);
    const entry = idx >= 0 ? careerLevel.skills[idx] : null;
    const resolvedId =
      entry?.anySpecialisation && anySpec[name]
        ? `${entry.skill} (${anySpec[name]})`
        : name;
    return {
      skillId: resolvedId,
      advances: allocation[name] ?? 0,
      ...(entry?.anySpecialisation && anySpec[name]
        ? { customSpecialisation: anySpec[name] }
        : {}),
    };
  });

  // ── Live species skill selections (for CurrentStatsPanel) ─────────────────

  const liveSpeciesSkills = [
    ...plusFive.map((skillName) => {
      const resolvedName = skillName.includes("(Any)") && speciesAnySpec[skillName]
        ? skillName.replace("(Any)", `(${speciesAnySpec[skillName]})`)
        : skillName;
      return { skillName: resolvedName, advances: 5 };
    }),
    ...plusThree.map((skillName) => {
      const resolvedName = skillName.includes("(Any)") && speciesAnySpec[skillName]
        ? skillName.replace("(Any)", `(${speciesAnySpec[skillName]})`)
        : skillName;
      return { skillName: resolvedName, advances: 3 };
    }),
  ];

  // ── Validation ───────────────────────────────────────────────────────────

  const speciesValid = plusFive.length === 3 && plusThree.length === 3;
  const allocationValid = totalAllocated === 40;
  const talentValid = selectedTalent !== null;
  const choiceTalentsValid = choiceTalents.every((_, i) => !!speciesChoiceTalents[i]);
  const randomTalentsValid = speciesRandomTalents.filter(Boolean).length === randomCount;
  const anySpecValid = activeSkillDisplayNames.every((name) => {
    const idx = careerSkillDisplayNames.indexOf(name);
    const entry = idx >= 0 ? careerLevel.skills[idx] : null;
    return !entry?.anySpecialisation || !!anySpec[name];
  });
  const speciesAnySpecValid = speciesStartingSkills.every((skillName) => {
    if (!skillName.includes("(Any)")) return true;
    const isSelected = plusFive.includes(skillName) || plusThree.includes(skillName);
    return !isSelected || !!speciesAnySpec[skillName];
  });
  const allChoiceGroupsSelected = skillRenderItems
    .filter((item): item is Extract<SkillRenderItem, { type: "choice" }> => item.type === "choice")
    .every((item) => !!choiceGroupSelections[item.letter]);
  const canProceed = speciesValid && allocationValid && choiceTalentsValid && randomTalentsValid && talentValid && anySpecValid && speciesAnySpecValid && allChoiceGroupsSelected;

  function rollRandomTalent(slotIndex: number) {
    const available = randomPool.filter((t) => {
      const count = getTalentCountExcluding(
        t,
        fixedTalents,
        speciesChoiceTalents,
        speciesRandomTalents,
        selectedTalent,
        undefined,
        slotIndex,
        false
      );
      return count < getTalentMaxAllowed(t, characterCharacteristics);
    });
    const pool = available.length > 0 ? available : randomPool;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    onSpeciesRandomTalentChange(slotIndex, pick);
  }

  function handleNext() {
    if (!canProceed || !selectedTalent) return;
    const selections: SpeciesSkillSelection[] = [
      ...plusFive.map((id) => ({
        skillId: id,
        advances: 5 as const,
        ...(speciesAnySpec[id] ? { customSpecialisation: speciesAnySpec[id] } : {}),
      })),
      ...plusThree.map((id) => ({
        skillId: id,
        advances: 3 as const,
        ...(speciesAnySpec[id] ? { customSpecialisation: speciesAnySpec[id] } : {}),
      })),
    ];
    const careerAlloc: CareerSkillAllocation[] = activeSkillDisplayNames.map((name) => {
      const idx = careerSkillDisplayNames.indexOf(name);
      const entry = idx >= 0 ? careerLevel.skills[idx] : null;
      return {
        skillId: name,
        advances: allocation[name] ?? 0,
        ...(entry?.anySpecialisation && anySpec[name]
          ? { customSpecialisation: anySpec[name] }
          : {}),
      };
    });
    onNext(selections, careerAlloc, selectedTalent);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator currentStep={4} totalSteps={8} stepLabel="Skills & Talents" />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={careerCharacteristics}
              careerSkills={liveCareerAlloc.map((a) => a.skillId)}
              careerSkillAllocation={liveCareerAlloc}
              speciesSkills={liveSpeciesSkills}
              talentIds={liveTalentIds}
              career={career}
              species={species}
            />
          </aside>

          {/* Right column: step content (~2/3 width) */}
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="font-serif text-3xl text-gray-100">Skills &amp; Talents</h1>
              <p className="text-gray-400 mt-2 text-sm">
                Select your starting skill advances and choose a career talent.
              </p>
                </div>

            {/* ── Sub-section A: Species Skills ── */}
            <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl text-amber-400">Species Skills</h2>
            <span className="text-xs text-gray-400">
              <span className={plusFive.length === 3 ? "text-amber-400" : "text-gray-400"}>
                {plusFive.length}/3 +5
              </span>
              {" · "}
              <span className={plusThree.length === 3 ? "text-teal-400" : "text-gray-400"}>
                {plusThree.length}/3 +3
              </span>
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Choose 3 skills for <span className="text-amber-400">+5 advances</span>, then 3 more
            for <span className="text-teal-400">+3 advances</span>. Click to select; click again
            to deselect.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {speciesStartingSkills.map((skillName) => {
              const isFive = plusFive.includes(skillName);
              const isThree = plusThree.includes(skillName);
              const characteristic = findSkillChar(skillName, allSkills);
              const isSelected = isFive || isThree;
              const bothFull = plusFive.length === 3 && plusThree.length === 3;
              const disabled = !isSelected && bothFull;
              const isAny = skillName.includes("(Any)");
              const baseSkillName = isAny ? skillName.replace(" (Any)", "") : skillName;

              return (
                <div key={skillName} className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleSpeciesSkillClick(skillName)}
                    disabled={disabled}
                    className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                      isFive
                        ? "border-amber-500/60 bg-amber-900/20"
                        : isThree
                        ? "border-teal-500/60 bg-teal-900/20"
                        : disabled
                        ? "border-gray-800/40 bg-gray-900/20 opacity-40 cursor-not-allowed"
                        : "border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isFive
                            ? "text-amber-300"
                            : isThree
                            ? "text-teal-300"
                            : "text-gray-100"
                        }`}
                      >
                        {isAny
                          ? `${baseSkillName} (${speciesAnySpec[skillName] || "Any"})`
                          : skillName}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {characteristic && (
                          <span className="text-[10px] text-gray-400">{characteristic}</span>
                        )}
                        {isFive && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-800/50 text-amber-300">
                            +5
                          </span>
                        )}
                        {isThree && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-teal-800/50 text-teal-300">
                            +3
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  {isAny && isSelected && (() => {
                    const specs = getAvailableSpecialisations(baseSkillName, allSkills);
                    return (
                      <div className="mt-1.5 px-1">
                        <select
                          value={speciesAnySpec[skillName] ?? ""}
                          onChange={(e) =>
                            setSpeciesAnySpec((prev) => ({ ...prev, [skillName]: e.target.value }))
                          }
                          className="text-xs rounded border border-gray-700 bg-gray-900 text-gray-200 px-2 py-1 focus:outline-none focus:border-amber-500/60"
                        >
                          <option value="">Choose specialisation…</option>
                          {specs.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                        {!speciesAnySpec[skillName] && (
                          <span className="ml-2 text-[10px] text-amber-500">Required</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {!speciesValid && (plusFive.length > 0 || plusThree.length > 0) && (
            <p className="mt-2 text-xs text-red-400">
              Select exactly 3 skills for +5 and 3 different skills for +3.
            </p>
          )}
        </section>

        {/* ── Sub-section B: Career Skill Allocation ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl text-amber-400">Career Skills</h2>
            <span
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                totalAllocated === 40
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : totalAllocated > 40
                  ? "bg-red-900/20 text-red-400 border-red-800/40"
                  : "bg-gray-800 text-gray-400 border-gray-700/40"
              }`}
            >
              {totalAllocated} / 40 advances allocated
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Distribute exactly <span className="text-amber-400">40 advances</span> across your
            8 career skills. Max 10 per skill.
            {remainingPool > 0 && (
              <span className="text-gray-400"> ({remainingPool} remaining)</span>
            )}
          </p>

          <div className="space-y-2">
            {skillRenderItems.map((item) => {
              if (item.type === "individual") {
                const { name, idx, entry } = item;
                const advances = allocation[name] ?? 0;
                const characteristic = findSkillChar(name, allSkills);
                const specs = entry.anySpecialisation
                  ? getAvailableSpecialisations(entry.skill, allSkills)
                  : [];
                return (
                  <div
                    key={`${name}-${idx}`}
                    className={`flex items-center gap-4 rounded-lg border px-5 py-3 transition-colors ${
                      advances > 0
                        ? "border-amber-700/40 bg-amber-900/10"
                        : "border-gray-800 bg-gray-900/60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${advances > 0 ? "text-amber-300" : "text-gray-100"}`}>
                        {entry.anySpecialisation ? `${entry.skill} (${anySpec[name] ?? "any"})` : name}
                      </span>
                      {characteristic && (
                        <span className="ml-2 text-xs text-gray-400">{characteristic}</span>
                      )}
                      {entry.anySpecialisation && (
                        <div className="mt-1.5">
                          <select
                            value={anySpec[name] ?? ""}
                            onChange={(e) => setAnySpec((prev) => ({ ...prev, [name]: e.target.value }))}
                            className="text-xs rounded border border-gray-700 bg-gray-900 text-gray-200 px-2 py-1 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/40"
                          >
                            <option value="">Choose specialisation…</option>
                            {specs.map((spec) => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                          {!anySpec[name] && (
                            <span className="ml-2 text-[10px] text-amber-500">Required</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => changeAllocation(name, -1)}
                        disabled={advances === 0}
                        className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                        aria-label={`Decrease ${name} advances`}
                      >−</button>
                      <span className={`w-8 text-center tabular-nums font-mono text-sm ${advances > 0 ? "text-amber-400" : "text-gray-400"}`}>
                        {advances}
                      </span>
                      <button
                        onClick={() => changeAllocation(name, 1)}
                        disabled={advances >= 10 || remainingPool <= 0}
                        className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                        aria-label={`Increase ${name} advances`}
                      >+</button>
                    </div>
                  </div>
                );
              }

              // Choice group item
              const { letter, options } = item;
              const selectedName = choiceGroupSelections[letter];
              const selectedOption = options.find((o) => o.name === selectedName);
              return (
                <div
                  key={`choice-${letter}`}
                  className="rounded-lg border border-sky-800/40 bg-sky-950/10 px-4 py-3"
                >
                  <p className="text-[11px] text-sky-400 uppercase tracking-wider mb-2">
                    Choose one skill:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {options.map(({ name: optName }) => (
                      <button
                        key={optName}
                        onClick={() => {
                          setChoiceGroupSelections((prev) => ({ ...prev, [letter]: optName }));
                          // Transfer advances from old selection to new (if new had none)
                          setAllocation((prev) => {
                            if (!selectedName || selectedName === optName) return prev;
                            const oldVal = prev[selectedName] ?? 0;
                            return {
                              ...prev,
                              [selectedName]: 0,
                              [optName]: (prev[optName] ?? 0) > 0 ? prev[optName] : oldVal,
                            };
                          });
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          selectedName === optName
                            ? "border-amber-500/60 bg-amber-900/20 text-amber-300"
                            : "border-gray-700 bg-gray-900/60 text-gray-200 hover:border-sky-600/60 hover:bg-sky-950/20"
                        }`}
                      >
                        {optName}
                      </button>
                    ))}
                  </div>
                  {selectedOption && (() => {
                    const { name, entry } = selectedOption;
                    const advances = allocation[name] ?? 0;
                    const characteristic = findSkillChar(name, allSkills);
                    return (
                      <div className={`flex items-center gap-4 rounded border px-4 py-2 transition-colors ${
                        advances > 0 ? "border-amber-700/40 bg-amber-900/10" : "border-gray-700 bg-gray-900/40"
                      }`}>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${advances > 0 ? "text-amber-300" : "text-gray-100"}`}>
                            {name}
                          </span>
                          {characteristic && (
                            <span className="ml-2 text-xs text-gray-400">{characteristic}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => changeAllocation(name, -1)}
                            disabled={advances === 0}
                            className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                            aria-label={`Decrease ${name} advances`}
                          >−</button>
                          <span className={`w-8 text-center tabular-nums font-mono text-sm ${advances > 0 ? "text-amber-400" : "text-gray-400"}`}>
                            {advances}
                          </span>
                          <button
                            onClick={() => changeAllocation(name, 1)}
                            disabled={advances >= 10 || remainingPool <= 0}
                            className="w-7 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                            aria-label={`Increase ${name} advances`}
                          >+</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {!allocationValid && totalAllocated > 0 && (
            <p className="mt-2 text-xs text-red-400">
              {totalAllocated < 40
                ? `Allocate ${40 - totalAllocated} more advance${40 - totalAllocated !== 1 ? "s" : ""} before continuing.`
                : `Over budget by ${totalAllocated - 40}. Reduce some skills.`}
            </p>
          )}
          </section>

          {/* ── Sub-section C: Species Talents ── */}
          {(fixedTalents.length > 0 || choiceTalents.length > 0 || randomCount > 0) && (
            <section className="mb-10">
            <h2 className="font-serif text-xl text-amber-400 mb-3">Species Talents</h2>

            {/* Fixed talents */}
            {fixedTalents.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Auto-granted talents:</p>
                <ul className="space-y-1">
                  {fixedTalents.map((name) => {
                    const info = talentsById.get(name);
                    return (
                      <li
                        key={name}
                        className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-2"
                      >
                        <span className="mt-0.5 shrink-0 text-sm">✅</span>
                        <div>
                          <span className="text-sm font-medium text-gray-200">{name}</span>
                          {info?.tests && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{info.tests}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Choice talents */}
            {choiceTalents.map((group, groupIndex) => {
              const selected = speciesChoiceTalents[groupIndex];
              return (
                <div key={groupIndex} className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">
                    Choose one:
                    {!selected && <span className="text-red-400 ml-1">Required</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isSelected = selected === option;
                      const countExcludingSlot = getTalentCountExcluding(
                        option,
                        fixedTalents,
                        speciesChoiceTalents,
                        speciesRandomTalents,
                        selectedTalent,
                        groupIndex,
                        undefined,
                        false
                      );
                      const maxAllowed = getTalentMaxAllowed(option, characterCharacteristics);
                      const isAtMax = !isSelected && countExcludingSlot >= maxAllowed;
                      return (
                        <button
                          key={option}
                          onClick={() => !isAtMax && onSpeciesChoiceTalentChange(groupIndex, option)}
                          disabled={isAtMax}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            isAtMax
                              ? "border-gray-700/40 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                              : isSelected
                              ? "border-amber-500/60 bg-amber-900/20 text-amber-300"
                              : "border-gray-700 bg-gray-900/60 text-gray-200 hover:border-gray-600 hover:bg-gray-900"
                          }`}
                          role="radio"
                          aria-checked={isSelected}
                          title={isAtMax ? `Already at max (${countExcludingSlot}/${maxAllowed})` : undefined}
                        >
                          {option}
                          {isSelected && <span className="ml-2 text-[10px] text-amber-500">✓</span>}
                          {isAtMax && <span className="ml-2 text-[10px] text-gray-600">({countExcludingSlot}/{maxAllowed})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Random talents */}
            {randomCount > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">
                  Random talent{randomCount > 1 ? "s" : ""} ({randomCount} slot{randomCount > 1 ? "s" : ""}):
                </p>
                <div className="space-y-2">
                  {Array.from({ length: randomCount }, (_, i) => {
                    const rolled = speciesRandomTalents[i];
                    const info = rolled ? talentsById.get(rolled) : undefined;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                          rolled
                            ? "border-amber-700/40 bg-amber-900/10"
                            : "border-gray-800 bg-gray-900/60"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {rolled ? (
                            <div>
                              <span className="text-sm font-medium text-amber-300">{rolled}</span>
                              {info?.tests && (
                                <p className="text-[11px] text-gray-400 mt-0.5">{info.tests}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not yet rolled</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => rollRandomTalent(i)}
                            className="flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-amber-400 transition-colors"
                            title={rolled ? "Re-roll (only allowed if duplicate)" : "Roll random talent"}
                          >
                            <span>🎲</span> {rolled ? "Re-roll" : "Roll"}
                          </button>
                          <select
                            value={rolled ?? ""}
                            onChange={(e) => {
                              if (e.target.value) onSpeciesRandomTalentChange(i, e.target.value);
                            }}
                            className="rounded bg-gray-800 border border-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:border-gray-600 transition-colors max-w-[140px]"
                            aria-label={`Pick talent for random slot ${i + 1}`}
                          >
                            <option value="">Pick manually…</option>
                            {randomPool.map((t) => {
                              const countExcludingSlot = getTalentCountExcluding(
                                t,
                                fixedTalents,
                                speciesChoiceTalents,
                                speciesRandomTalents,
                                selectedTalent,
                                undefined,
                                i,
                                false
                              );
                              const maxAllowed = getTalentMaxAllowed(t, characterCharacteristics);
                              const isAtMax = speciesRandomTalents[i] !== t && countExcludingSlot >= maxAllowed;
                              return (
                                <option key={t} value={t} disabled={isAtMax}>
                                  {t}{isAtMax ? ` (${countExcludingSlot}/${maxAllowed})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!randomTalentsValid && speciesRandomTalents.some(Boolean) && (
                  <p className="mt-2 text-xs text-red-400">
                    Fill all {randomCount} random talent slot{randomCount > 1 ? "s" : ""} before continuing.
                  </p>
                )}
              </div>
            )}
            </section>
          )}

          {/* ── Sub-section D: Career Talent ── */}
          <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl text-amber-400">Career Talent</h2>
            <span
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                talentValid
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-red-900/20 text-red-400 border-red-800/40"
              }`}
            >
              {talentValid ? "1 selected" : "Pick 1"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Choose <span className="text-amber-400">1 talent</span> from your career.
          </p>

          <div className="space-y-2">
            {careerLevel.talents.map((entry) => {
              const talentInfo = resolveTalentInfo(entry.talent);
              const isSelected = selectedTalent === entry.talent;
              const countFromSpecies = getTalentCountExcluding(
                entry.talent,
                fixedTalents,
                speciesChoiceTalents,
                speciesRandomTalents,
                null,
                undefined,
                undefined,
                true
              );
              const maxAllowed = getTalentMaxAllowed(entry.talent, characterCharacteristics);
              const isAtMax = !isSelected && countFromSpecies >= maxAllowed;

              return (
                <button
                  key={entry.talent}
                  onClick={() => !isAtMax && handleCareerTalentSelect(entry.talent)}
                  disabled={isAtMax}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    isAtMax
                      ? "border-gray-700/40 bg-gray-900/30 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "border-amber-500/60 bg-amber-900/20"
                      : "border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isAtMax ? "text-gray-500" : isSelected ? "text-amber-300" : "text-gray-100"
                          }`}
                        >
                          {entry.talent}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-amber-500">✓</span>
                        )}
                        {isAtMax && (
                          <span className="text-[10px] text-red-400 border border-red-800/40 bg-red-900/20 px-1.5 py-0.5 rounded">
                            At max ({countFromSpecies}/{maxAllowed})
                          </span>
                        )}
                      </div>
                      {talentInfo?.tests && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{talentInfo.tests}</p>
                      )}
                      {talentInfo?.description && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          {talentInfo.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
                        isAtMax
                          ? "border-gray-700 bg-transparent"
                          : isSelected
                          ? "border-amber-400 bg-amber-400"
                          : "border-gray-600 bg-transparent"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
            </div>
          </section>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-gray-800 pt-6">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              {!canProceed && (
                <span className="text-xs text-gray-400">
                  {!speciesValid && "Select all 6 species skills · "}
                  {!allocationValid && "Allocate exactly 40 advances · "}
                  {!choiceTalentsValid && "Choose all species talents · "}
                  {!randomTalentsValid && "Fill all random talent slots · "}
                  {!anySpecValid && "Choose specialisations for open-ended skills · "}
                  {!allChoiceGroupsSelected && "Select one option from each choice group · "}
                  {!talentValid && "Choose a career talent"}
                </span>
              )}
              <Button variant="primary" disabled={!canProceed} onClick={handleNext}>
                Next →
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
