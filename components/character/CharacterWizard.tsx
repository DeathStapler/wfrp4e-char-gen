"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Species, Career, CareerSkillEntry, CharacteristicKey, Skill } from "@/lib/types/rules";
import type {
  CharacterMetadata,
  CharacterSkill,
  CharacterTalent,
  CharacterTrapping,
  CharacterBackstory,
  CreationAdvances,
  Characteristics,
} from "@/lib/types/character";
import type { Wealth as RulesWealth } from "@/lib/rules/wealth";
import type { SpeciesSkillSelection } from "@/lib/rules/species";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import { finalizeCharacter, applyCreationAdvances } from "@/lib/rules/character-builder";
import { saveCharacter } from "@/lib/storage/character-storage";
import { getStartingTrappings } from "@/lib/rules/careers";
import { getSpeciesFixedTalents } from "@/lib/rules/species";
import { getCreationXP, type CareerChoiceMethod, type SpeciesChoiceMethod, type AttributeChoiceMethod } from "@/lib/rules/creation-xp";
import { getFateTotal, getResilienceTotal, getDefaultExtraPointsAllocation } from "@/lib/rules/fate-resilience";
import trappingsData from "@/data/trappings.json";

import { SpeciesSelection } from "@/components/character/SpeciesSelection";
import { CareerSelection } from "@/components/character/CareerSelection";
import { AttributesStep, type AttributeMethod } from "@/components/character/AttributesStep";
import { SkillsTalentsSelection } from "@/components/character/SkillsTalentsSelection";
import { TrappingsReview } from "@/components/character/TrappingsReview";
import { CharacterDetails } from "@/components/character/CharacterDetails";
import { BringingToLife } from "@/components/character/BringingToLife";
import { AdvancementStep } from "@/components/character/AdvancementStep";

interface WizardCharacter {
  speciesId: string | null;
  careerId: string | null;
  speciesChoiceMethod: SpeciesChoiceMethod;
  careerChoiceMethod: CareerChoiceMethod;
  attributeMethod: AttributeMethod | null;
  characteristicRolls: Partial<Record<CharacteristicKey, number>>;
  // Step 4 — Skills & Talents
  speciesSkillSelections: SpeciesSkillSelection[];
  careerSkillAllocation: CareerSkillAllocation[];
  selectedCareerTalent: string | null;
  speciesChoiceTalents: string[];
  speciesRandomTalents: string[];
  rolledWealth: RulesWealth | null;
  // Step 6 — Character Details (Fate/Resilience extra points)
  fateExtraPoints: number;
  characterDetails: Partial<CharacterMetadata>;
  notes: string;
  // Step 7 — Bringing to Life
  backstory: CharacterBackstory;
  // Step 8 — Advancement
  creationAdvances: CreationAdvances;
}

interface CharacterWizardProps {
  allSpecies: Species[];
  allCareers: Career[];
  allSkills: Skill[];
}

/** Converts a display name to a slug ID, mirroring the careers.ts nameToId helper. */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()'"]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CHAR_KEYS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

const EMPTY_BACKSTORY: CharacterBackstory = {};
const EMPTY_ADVANCES: CreationAdvances = { characteristics: {}, skills: {}, talents: [] };

export function CharacterWizard({
  allSpecies,
  allCareers,
  allSkills,
}: CharacterWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [character, setCharacter] = useState<WizardCharacter>({
    speciesId: null,
    careerId: null,
    speciesChoiceMethod: "chosen",
    careerChoiceMethod: "chosen",
    attributeMethod: null,
    characteristicRolls: {},
    speciesSkillSelections: [],
    careerSkillAllocation: [],
    selectedCareerTalent: null,
    speciesChoiceTalents: [],
    speciesRandomTalents: [],
    rolledWealth: null,
    fateExtraPoints: 0,
    characterDetails: {},
    notes: "",
    backstory: EMPTY_BACKSTORY,
    creationAdvances: EMPTY_ADVANCES,
  });

  function handleSpeciesNext(speciesId: string, method: SpeciesChoiceMethod) {
    const species = allSpecies.find((s) => s.id === speciesId);
    const defaultExtraPoints = species ? getDefaultExtraPointsAllocation(species.extraPoints) : 0;
    setCharacter((prev) => ({ 
      ...prev, 
      speciesId, 
      speciesChoiceMethod: method,
      fateExtraPoints: defaultExtraPoints 
    }));
    setStep(2);
  }

  function handleCareerNext(careerId: string, method: CareerChoiceMethod) {
    setCharacter((prev) => ({ ...prev, careerId, careerChoiceMethod: method }));
    setStep(3);
  }

  function handleAttributesNext(
    method: AttributeChoiceMethod,
    rolls: Record<CharacteristicKey, number>
  ) {
    setCharacter((prev) => ({
      ...prev,
      attributeMethod: method,
      characteristicRolls: rolls,
    }));
    setStep(4);
  }

  function handleCharacteristicRollsChange(rolls: Partial<Record<CharacteristicKey, number>>) {
    setCharacter((prev) => ({ ...prev, characteristicRolls: rolls }));
  }

  function handleSkillsTalentsNext(
    speciesSkillSelections: SpeciesSkillSelection[],
    careerSkillAllocation: CareerSkillAllocation[],
    selectedCareerTalent: string
  ) {
    setCharacter((prev) => ({
      ...prev,
      speciesSkillSelections,
      careerSkillAllocation,
      selectedCareerTalent,
    }));
    setStep(5);
  }

  function handleSpeciesChoiceTalentChange(index: number, talent: string) {
    setCharacter((prev) => {
      const next = [...prev.speciesChoiceTalents];
      next[index] = talent;
      return { ...prev, speciesChoiceTalents: next };
    });
  }

  function handleSpeciesRandomTalentChange(index: number, talent: string) {
    setCharacter((prev) => {
      const next = [...prev.speciesRandomTalents];
      next[index] = talent;
      return { ...prev, speciesRandomTalents: next };
    });
  }

  function handleCareerTalentChange(talent: string | null) {
    setCharacter((prev) => ({ ...prev, selectedCareerTalent: talent }));
  }

  function handleTrappingsNext(wealth: RulesWealth) {
    setCharacter((prev) => ({ ...prev, rolledWealth: wealth }));
    setStep(6);
  }

  function handleFateExtraPointsChange(fateExtraPoints: number) {
    setCharacter((prev) => ({ ...prev, fateExtraPoints }));
  }

  function handleDetailsNext(details: CharacterMetadata, notes: string) {
    setCharacter((prev) => ({ ...prev, characterDetails: details, notes }));
    setStep(7);
  }

  function handleBackstoryNext(backstory: CharacterBackstory) {
    setCharacter((prev) => ({ ...prev, backstory }));
    setStep(8);
  }

  function handleAdvancementComplete(creationAdvances: CreationAdvances) {
    const species = allSpecies.find((s) => s.id === character.speciesId);
    const career = allCareers.find((c) => c.id === character.careerId);
    if (!species || !career) return;

    const CHAR_KEYS: CharacteristicKey[] = [
      "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
    ];

    const characteristicBases = Object.fromEntries(
      CHAR_KEYS.map((k) => [k, (species.characteristics[k] ?? 0) + (character.characteristicRolls[k] ?? 0)])
    ) as Record<CharacteristicKey, number>;

    const characteristicAdvances = Object.fromEntries(
      CHAR_KEYS.map((k) => [k, 0])
    ) as Record<CharacteristicKey, number>;

    // Build skills from species selections + career allocation
    const skillsMap = new Map<string, { advances: number; isCareerSkill: boolean }>();

    // Species skill advances (by display name)
    for (const sel of character.speciesSkillSelections) {
      const resolvedId = sel.customSpecialisation
        ? sel.skillId.replace(" (Any)", ` (${sel.customSpecialisation})`)
        : sel.skillId;
      const existing = skillsMap.get(resolvedId) ?? { advances: 0, isCareerSkill: false };
      skillsMap.set(resolvedId, { ...existing, advances: existing.advances + sel.advances });
    }

    // Career skill allocation
    for (const alloc of character.careerSkillAllocation) {
      if (alloc.advances > 0) {
        const resolvedName = alloc.customSpecialisation
          ? alloc.skillId.replace(" (any)", ` (${alloc.customSpecialisation})`)
          : alloc.skillId;
        const existing = skillsMap.get(resolvedName) ?? { advances: 0, isCareerSkill: true };
        skillsMap.set(resolvedName, {
          advances: existing.advances + alloc.advances,
          isCareerSkill: true,
        });
      }
    }
    // Mark career skills properly for skills that only came from species
    for (const entry of career.levels[0].skills) {
      let displayName: string;
      if (entry.specialisation) {
        displayName = `${entry.skill} (${entry.specialisation})`;
      } else if (entry.anySpecialisation) {
        const alloc = character.careerSkillAllocation.find(
          (a) => a.skillId === `${entry.skill} (any)`
        );
        displayName = alloc?.customSpecialisation
          ? `${entry.skill} (${alloc.customSpecialisation})`
          : `${entry.skill} (any)`;
      } else {
        displayName = entry.skill;
      }
      const existing = skillsMap.get(displayName);
      if (existing) {
        skillsMap.set(displayName, { ...existing, isCareerSkill: true });
      }
    }

    const skills: CharacterSkill[] = Array.from(skillsMap.entries()).map(
      ([displayName, { advances, isCareerSkill }]) => {
        const matched = allSkills.find((s) => s.name === displayName);
        const skillId = matched?.id ?? nameToId(displayName);
        return { skillId, advances, isCareerSkill };
      }
    );

    // Build talents
    const speciesFixedTalentNames = getSpeciesFixedTalents(species.id, allSpecies);
    const speciesChoiceTalentNames = character.speciesChoiceTalents.filter(Boolean);
    const speciesRandomTalentNames = character.speciesRandomTalents.filter(Boolean);
    const talentNames = [
      ...speciesFixedTalentNames,
      ...speciesChoiceTalentNames,
      ...speciesRandomTalentNames,
      ...(character.selectedCareerTalent ? [character.selectedCareerTalent] : []),
    ];
    const talents: CharacterTalent[] = talentNames.map((name) => ({
      talentId: nameToId(name),
      timesTaken: 1,
    }));

    // Trappings
    const classTrappings =
      (trappingsData.classStartingTrappings as Record<string, string[]>)[
        career.careerClass
      ] ?? [];
    const startingTrappingNames = getStartingTrappings(career, 0, classTrappings);
    const trappings: CharacterTrapping[] = startingTrappingNames.map((name) => ({
      trappingId: null,
      name,
      quantity: 1,
    }));

    // Wound threshold
    const tb = Math.floor((characteristicBases.T ?? 0) / 10);
    const wpb = Math.floor((characteristicBases.WP ?? 0) / 10);
    const sb = Math.floor((characteristicBases.S ?? 0) / 10);
    const woundThreshold = tb + 2 * wpb + sb + (species.extraWounds ?? 0);

    // XP accounting
    const bonusXP = getCreationXP(
      character.speciesChoiceMethod, 
      character.careerChoiceMethod,
      character.attributeMethod ?? 'manual'
    );
    const charXpSpent = Object.values(creationAdvances.characteristics).reduce((s, v) => {
      let cost = 0;
      for (let i = 0; i < v; i++) cost += 25 * (i + 1);
      return s + cost;
    }, 0);
    const skillXpSpent = Object.values(creationAdvances.skills).reduce((s, v) => {
      let cost = 0;
      for (let i = 0; i < v; i++) cost += 10 * (i + 1);
      return s + cost;
    }, 0);
    const talentXpSpent = creationAdvances.talents.length * 100;
    const xpSpent = charXpSpent + skillXpSpent + talentXpSpent;

    const metadata = character.characterDetails as CharacterMetadata;

    // Calculate final fate and resilience using the helper functions
    const fateTotal = getFateTotal(species.fate, character.fateExtraPoints);
    const resilienceTotal = getResilienceTotal(
      species.resilience,
      species.extraPoints,
      character.fateExtraPoints
    );

    const partial = {
      metadata,
      speciesChoiceMethod: character.speciesChoiceMethod,
      careerChoiceMethod: character.careerChoiceMethod,
      attributeChoiceMethod: character.attributeMethod ?? 'manual',
      characteristicBases,
      characteristicAdvances,
      skills,
      talents,
      currentCareerId: career.id,
      currentCareerLevel: 1 as const,
      careerHistory: [],
      experience: { total: bonusXP, spent: xpSpent, current: bonusXP - xpSpent },
      fateExtraPoints: character.fateExtraPoints,
      fate: { total: fateTotal, burned: 0, luck: fateTotal },
      resilience: {
        total: resilienceTotal,
        burned: 0,
        resolve: resilienceTotal,
      },
      sinPoints: 0,
      corruption: { taint: 0, mutations: [] },
      status: {
        currentWounds: woundThreshold,
        woundThreshold,
        advantage: 0,
        psychology: [],
        conditions: [],
      },
      wealth: character.rolledWealth ?? { gold: 0, silver: 0, brass: 0 },
      trappings,
      spells: [],
      notes: character.notes,
      backstory: character.backstory,
    };

    const withAdvances = applyCreationAdvances(partial, creationAdvances);
    const finalChar = finalizeCharacter(withAdvances);
    saveCharacter(finalChar);
    router.push(`/character/${finalChar.id}`);
  }

  // ── Step routing ────────────────────────────────────────────────────────────

  // For Steps 1-2, compute characteristics with species base (if selected)
  const step1SpeciesBase = character.speciesId 
    ? allSpecies.find((s) => s.id === character.speciesId) 
    : null;
  const earlyCharacteristics: Characteristics = step1SpeciesBase
    ? Object.fromEntries(
        CHAR_KEYS.map((k) => [k, step1SpeciesBase.characteristics[k]])
      ) as Characteristics
    : Object.fromEntries(
        CHAR_KEYS.map((k) => [k, 0])
      ) as Characteristics;

  if (step === 1) {
    return (
      <SpeciesSelection
        allSpecies={allSpecies}
        initialSelectedId={character.speciesId}
        initialChoiceMethod={character.speciesChoiceMethod}
        characterCharacteristics={earlyCharacteristics}
        onNext={handleSpeciesNext}
      />
    );
  }

  if (step === 2) {
    // For Step 2, use species base + (if career selected) show career characteristics
    const step2Career = character.careerId 
      ? allCareers.find((c) => c.id === character.careerId)
      : null;
    return (
      <CareerSelection
        allCareers={allCareers}
        initialSelectedId={character.careerId}
        initialChoiceMethod={character.careerChoiceMethod}
        characterCharacteristics={earlyCharacteristics}
        careerSkillAllocation={character.careerSkillAllocation}
        species={step1SpeciesBase}
        onBack={() => setStep(1)}
        onNext={handleCareerNext}
      />
    );
  }

  const selectedSpecies = allSpecies.find((s) => s.id === character.speciesId);
  if (!selectedSpecies) {
    setStep(1);
    return null;
  }

  // Fetch career early for steps that need it
  const selectedCareer = character.careerId ? allCareers.find((c) => c.id === character.careerId) : null;

  // Shared computations for steps 3-8
  const characteristicBases = Object.fromEntries(
    CHAR_KEYS.map((k) => [k, (selectedSpecies.characteristics[k] ?? 0) + (character.characteristicRolls[k] ?? 0)])
  ) as Record<CharacteristicKey, number>;

  const speciesFixedTalentNames = getSpeciesFixedTalents(selectedSpecies.id, allSpecies);
  const sidebarTalentIds = [
    ...speciesFixedTalentNames,
    ...character.speciesChoiceTalents.filter(Boolean),
    ...character.speciesRandomTalents.filter(Boolean),
    ...(character.selectedCareerTalent ? [character.selectedCareerTalent] : []),
  ].map(nameToId);

  if (step === 3) {
    return (
      <AttributesStep
        species={selectedSpecies}
        initialMethod={character.attributeMethod}
        initialRolls={character.characteristicRolls}
        careerCharacteristics={selectedCareer?.levels[0].characteristics ?? []}
        careerSkillAllocation={character.careerSkillAllocation}
        career={selectedCareer}
        onBack={() => setStep(2)}
        onNext={handleAttributesNext}
        onChange={handleCharacteristicRollsChange}
      />
    );
  }

  if (!selectedCareer) {
    setStep(2);
    return null;
  }

  if (step === 4) {
    return (
      <SkillsTalentsSelection
        speciesStartingSkills={selectedSpecies.startingSkills}
        species={selectedSpecies}
        career={selectedCareer}
        allSkills={allSkills}
        initialSpeciesSelections={character.speciesSkillSelections}
        initialCareerAllocation={character.careerSkillAllocation}
        initialSelectedCareerTalent={character.selectedCareerTalent}
        speciesChoiceTalents={character.speciesChoiceTalents}
        onSpeciesChoiceTalentChange={handleSpeciesChoiceTalentChange}
        speciesRandomTalents={character.speciesRandomTalents}
        onSpeciesRandomTalentChange={handleSpeciesRandomTalentChange}
        onCareerTalentChange={handleCareerTalentChange}
        characterCharacteristics={characteristicBases}
        careerCharacteristics={selectedCareer.levels[0].characteristics}
        careerSkillAllocation={character.careerSkillAllocation}
        onBack={() => setStep(3)}
        onNext={handleSkillsTalentsNext}
      />
    );
  }

  if (step === 5) {
    return (
      <TrappingsReview
        career={selectedCareer}
        careerLevelStatus={selectedCareer.levels[0].status}
        initialWealth={character.rolledWealth}
        characterCharacteristics={characteristicBases}
        careerCharacteristics={selectedCareer.levels[0].characteristics}
        careerSkillAllocation={character.careerSkillAllocation}
        speciesSkillSelections={character.speciesSkillSelections}
        talentIds={sidebarTalentIds}
        species={selectedSpecies}
        onBack={() => setStep(4)}
        onNext={handleTrappingsNext}
      />
    );
  }

  if (step === 6) {
    return (
      <CharacterDetails
        speciesId={selectedSpecies.id}
        speciesName={selectedSpecies.name}
        careerTitle={selectedCareer.levels[0].title}
        career={selectedCareer}
        species={selectedSpecies}
        initialDetails={character.characterDetails}
        initialNotes={character.notes}
        speciesAppearance={selectedSpecies.appearance}
        characterCharacteristics={characteristicBases}
        careerCharacteristics={selectedCareer.levels[0].characteristics}
        careerSkillAllocation={character.careerSkillAllocation}
        speciesSkillSelections={character.speciesSkillSelections}
        talentIds={sidebarTalentIds}
        speciesBaseFate={selectedSpecies.fate}
        speciesBaseResilience={selectedSpecies.resilience}
        speciesExtraPoints={selectedSpecies.extraPoints}
        fateExtraPoints={character.fateExtraPoints}
        onFateExtraPointsChange={handleFateExtraPointsChange}
        onBack={() => setStep(5)}
        onFinish={handleDetailsNext}
      />
    );
  }

  if (step === 7) {
    return (
      <BringingToLife
        initialBackstory={character.backstory}
        characterCharacteristics={characteristicBases}
        careerCharacteristics={selectedCareer.levels[0].characteristics}
        careerSkillAllocation={character.careerSkillAllocation}
        speciesSkillSelections={character.speciesSkillSelections}
        talentIds={sidebarTalentIds}
        career={selectedCareer}
        species={selectedSpecies}
        onComplete={handleBackstoryNext}
        onBack={(backstory) => {
          setCharacter((prev) => ({ ...prev, backstory }));
          setStep(6);
        }}
      />
    );
  }

  // step === 8
  return (
    <AdvancementStep
      career={selectedCareer}
      careerLevel={1}
      bonusXP={getCreationXP(
        character.speciesChoiceMethod, 
        character.careerChoiceMethod,
        character.attributeMethod ?? 'manual'
      )}
      characterCharacteristics={characteristicBases}
      careerSkillAllocation={character.careerSkillAllocation}
      speciesSkillSelections={character.speciesSkillSelections}
      selectedCareerTalent={character.selectedCareerTalent}
      talentIds={sidebarTalentIds}
      species={selectedSpecies}
      initialAdvances={character.creationAdvances}
      onComplete={handleAdvancementComplete}
      onBack={() => setStep(7)}
    />
  );
}