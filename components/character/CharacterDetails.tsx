"use client";

import { useState, useEffect, useRef } from "react";
import type { CharacterMetadata, Characteristics } from "@/lib/types/character";
import type { SpeciesAppearance, Career, Species } from "@/lib/types/rules";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import type { SpeciesSkillSelection } from "@/lib/rules/species";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import { useAIProvider } from "@/hooks/useAIProvider";
import { NamePickerModal } from "@/components/character/NamePickerModal";
import {
  rollAgeWithDetails,
  rollHeightWithDetails,
  rollEyeColourWithDetails,
  rollHairColourWithDetails,
  inchesToFeetString,
  type Nd10RollDetails,
  type ColourRollDetails,
} from "@/lib/rules/appearance";

interface CharacterDetailsProps {
  speciesId: string;
  speciesName: string;
  careerTitle: string;
  career?: Career | null;
  species?: Species | null;
  initialDetails: Partial<CharacterMetadata>;
  initialNotes: string;
  speciesAppearance?: SpeciesAppearance;
  characterCharacteristics: Characteristics;
  careerCharacteristics: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  speciesSkillSelections: SpeciesSkillSelection[];
  talentIds: string[];
  // Fate & Resilience allocation
  speciesBaseFate: number;
  speciesBaseResilience: number;
  speciesExtraPoints: number;
  fateExtraPoints: number;
  onFateExtraPointsChange: (value: number) => void;
  onBack: () => void;
  onFinish: (details: CharacterMetadata, notes: string) => void;
}

interface DetailsForm {
  name: string;
  age: string;
  gender: string;
  eyes: string;
  hair: string;
  height: string;
  weight: string;
  distinctiveMarks: string;
  notes: string;
}

/** Per-field roll lock and result tracking. */
type RollableField = "age" | "height" | "eyes" | "hair" | "weight";

interface AgeRollResult { roll: Nd10RollDetails; result: number }
interface HeightRollResult { roll: Nd10RollDetails; result: number }
interface WeightRollResult { d10Roll: number; multiplier: number; buildFactor: number; result: number }
interface ColourFieldRollResult { rolls: ColourRollDetails[]; result: string }

type FieldRollResult =
  | { field: "age"; data: AgeRollResult }
  | { field: "height"; data: HeightRollResult }
  | { field: "weight"; data: WeightRollResult }
  | { field: "eyes"; data: ColourFieldRollResult }
  | { field: "hair"; data: ColourFieldRollResult };

/** Species-specific build factors for weight calculation. */
const SPECIES_BUILD_FACTORS: Record<string, number> = {
  "Human": 2.0,       // baseline
  "Dwarf": 2.6,       // very dense, thick
  "Halfling": 1.9,    // soft but not heavy
  "High Elf": 1.6,    // tall, very lean
  "Wood Elf": 1.7,    // lean but slightly sturdier
  "Dark Elf": 1.8,    // wiry, dangerous
};

/** Try to parse a feet+inches string ("5'9\"" / "5'9") or plain inches ("69") → total inches. */
function parseFeetInches(value: string): number | null {
  const m = value.match(/^(\d+)'\s*(\d+)"?$/)
  if (m) return parseInt(m[1], 10) * 12 + parseInt(m[2], 10)
  const n = parseInt(value, 10)
  if (!isNaN(n) && n > 0) return n
  return null
}

/** Derive stored heightInches from a height string on initial load. */
function initHeightInches(height?: string): number | null {
  if (!height) return null
  return parseFeetInches(height)
}

function inputClass(hasValue: boolean, flash: boolean) {
  const base =
    "w-full rounded border bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-700 focus:outline-none focus:ring-1 transition-all duration-300"
  if (flash)
    return `${base} border-amber-500 ring-2 ring-amber-500/50`
  return `${base} ${
    hasValue
      ? "border-gray-600 focus:border-amber-600 focus:ring-amber-600/30"
      : "border-gray-700 focus:border-amber-600 focus:ring-amber-600/30"
  }`
}

function textareaClass() {
  return "w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 placeholder-gray-700 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30 resize-none"
}

/** Formats dice array as "3 + 8 = 11" or "2 + 5 + 3 = 10" depending on count. */
function formatDiceRoll(dice: number[]): string {
  const sum = dice.reduce((a, b) => a + b, 0)
  return `${dice.join(" + ")} = ${sum}`
}

function RollButton({
  onClick,
  disabled,
  hasRolled,
  title,
}: {
  onClick: () => void
  disabled: boolean
  hasRolled: boolean
  title?: string
}) {
  if (hasRolled) {
    return (
      <span
        title="Already rolled"
        className="shrink-0 inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed select-none"
      >
        🎲 Rolled
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? (disabled ? "Select a species first" : "Roll randomly")}
      className={`shrink-0 inline-flex items-center gap-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors ${
        disabled
          ? "cursor-not-allowed border-gray-700 bg-gray-800 text-gray-400"
          : "border-amber-700 bg-gray-800 text-amber-400 hover:border-amber-500 hover:bg-amber-900/30"
      }`}
    >
      🎲 Roll
    </button>
  )
}

export function CharacterDetails({
  speciesId,
  speciesName,
  careerTitle,
  career = null,
  species = null,
  initialDetails,
  initialNotes,
  speciesAppearance,
  characterCharacteristics,
  careerCharacteristics,
  careerSkillAllocation,
  speciesSkillSelections,
  talentIds,
  speciesBaseFate,
  speciesBaseResilience,
  speciesExtraPoints,
  fateExtraPoints,
  onFateExtraPointsChange,
  onBack,
  onFinish,
}: CharacterDetailsProps) {
  const [form, setForm] = useState<DetailsForm>({
    name: initialDetails.name ?? "",
    age: initialDetails.age != null ? String(initialDetails.age) : "",
    gender: initialDetails.gender ?? "",
    eyes: initialDetails.eyes ?? "",
    hair: initialDetails.hair ?? "",
    height: initialDetails.height ?? "",
    weight: initialDetails.weight ?? "",
    distinctiveMarks: initialDetails.distinctiveMarks ?? "",
    notes: initialNotes,
  })

  // Raw inches tracked separately so we can show the hint and re-display after parse
  const [heightInches, setHeightInches] = useState<number | null>(() =>
    initHeightInches(initialDetails.height)
  )

  // Which field is currently flashing (post-roll highlight)
  const [flashField, setFlashField] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lock state — once a field is rolled, its button is disabled
  const [hasRolled, setHasRolled] = useState<Record<RollableField, boolean>>({
    age: false, height: false, eyes: false, hair: false, weight: false,
  })

  // Stored roll results for inline display
  const [rollResults, setRollResults] = useState<Partial<Record<RollableField, FieldRollResult>>>({})

  // OpenRouter settings for name generation
  const { apiKey, incrementApiCallCount, callAI } = useAIProvider()

  // Name generation state
  const [showNamePicker, setShowNamePicker] = useState(false)
  const [generatedNames, setGeneratedNames] = useState<string[]>([])
  const [isGeneratingNames, setIsGeneratingNames] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  function triggerFlash(field: string) {
    setFlashField(field)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashField(null), 700)
  }

  function setField(field: keyof DetailsForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function lockField(field: RollableField, result: FieldRollResult) {
    setHasRolled((prev) => ({ ...prev, [field]: true }))
    setRollResults((prev) => ({ ...prev, [field]: result }))
  }

  function handleRollAge() {
    if (!speciesAppearance) return
    const data = rollAgeWithDetails(speciesAppearance)
    setField("age", String(data.result))
    triggerFlash("age")
    lockField("age", { field: "age", data })
  }

  function handleRollHeight() {
    if (!speciesAppearance) return
    const data = rollHeightWithDetails(speciesAppearance)
    setHeightInches(data.result)
    setField("height", inchesToFeetString(data.result))
    triggerFlash("height")
    lockField("height", { field: "height", data })
  }

  function handleRollEyes() {
    if (!speciesAppearance) return
    const data = rollEyeColourWithDetails(speciesAppearance)
    setField("eyes", data.result)
    triggerFlash("eyes")
    lockField("eyes", { field: "eyes", data })
  }

  function handleRollHair() {
    if (!speciesAppearance) return
    const data = rollHairColourWithDetails(speciesAppearance)
    setField("hair", data.result)
    triggerFlash("hair")
    lockField("hair", { field: "hair", data })
  }

  function handleRollWeight() {
    // Weight formula: Height_in_inches × BuildFactor[species] × (0.8 + roll1d10 × 0.05)
    if (heightInches === null) return
    
    const buildFactor = SPECIES_BUILD_FACTORS[speciesName] ?? 2.0
    const d10Roll = Math.ceil(Math.random() * 10) // 1-10
    const multiplier = 0.8 + d10Roll * 0.05
    const weightLbs = Math.round(heightInches * buildFactor * multiplier)
    
    setField("weight", `${weightLbs} lbs`)
    triggerFlash("weight")
    lockField("weight", { 
      field: "weight", 
      data: { d10Roll, multiplier, buildFactor, result: weightLbs } 
    })
  }

  function handleHeightBlur() {
    const parsed = parseFeetInches(form.height.trim())
    if (parsed !== null) {
      setHeightInches(parsed)
      // Normalise to feet+inches display if we successfully parsed a plain number
      if (/^\d+$/.test(form.height.trim())) {
        setField("height", inchesToFeetString(parsed))
      }
    } else {
      setHeightInches(null)
    }
  }

  function parseNamesFromResponse(text: string): string[] {
    // 1. Strip markdown fences and try direct JSON parse
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    try {
      const parsed: unknown = JSON.parse(stripped)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => (typeof item === 'string' ? item.trim() : String(item).trim())).filter(Boolean)
      }
      // Array inside an object: {"names": [...]} or {"data": [...]}
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>
        for (const val of Object.values(obj)) {
          if (Array.isArray(val) && val.length > 0) {
            return val.map((item) => (typeof item === 'string' ? item.trim() : String(item).trim())).filter(Boolean)
          }
        }
      }
    } catch {
      // fall through
    }

    // 2. Find a JSON array anywhere in the text
    const arrayMatch = text.match(/\[[\s\S]*?\]/)
    if (arrayMatch) {
      try {
        const parsed: unknown = JSON.parse(arrayMatch[0])
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => (typeof item === 'string' ? item.trim() : String(item).trim())).filter(Boolean)
        }
      } catch {
        // fall through
      }
    }

    // 3. Find a JSON object with an array value anywhere in the text
    const objMatch = text.match(/\{[\s\S]*?\}/)
    if (objMatch) {
      try {
        const parsed: unknown = JSON.parse(objMatch[0])
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const obj = parsed as Record<string, unknown>
          for (const val of Object.values(obj)) {
            if (Array.isArray(val) && val.length > 0) {
              return val.map((item) => (typeof item === 'string' ? item.trim() : String(item).trim())).filter(Boolean)
            }
          }
        }
      } catch {
        // fall through
      }
    }

    // 4. Line-by-line fallback (numbered list, bullet list, plain newlines)
    const PROSE_PATTERNS = /here are|names for|following|below|list of/i
    const names = text
      .split('\n')
      .map((line) => line
        .replace(/^\s*\d+[\.\)]\s*/, '')  // strip "1." or "1)"
        .replace(/^\s*[-*•]\s*/, '')       // strip "- " or "* " or "• "
        .replace(/^["']|["']$/g, '')       // strip surrounding quotes
        .trim()
      )
      .filter((line) => line.length > 0 && line.length <= 50 && !PROSE_PATTERNS.test(line))

    if (names.length > 0) return names

    throw new Error('Could not parse the response as JSON')
  }

  async function handleGenerateNames() {
    if (!apiKey) return

    setIsGeneratingNames(true)
    setNameError(null)
    setGeneratedNames([])
    setShowNamePicker(true)

    try {
      const species = speciesName || "Human"
      const genderClause = form.gender.trim() ? ` The character is ${form.gender.trim()}.` : ""
      const prompt = `Create a list of 10 character names for the Warhammer Fantasy Roleplaying setting. The species is ${species}.${genderClause} Respond with ONLY a JSON array of strings, no explanation. Example: ["Name1", "Name2", "Name3"]`

      const raw = await callAI(prompt, { maxTokens: 300, temperature: 0.9 })
      incrementApiCallCount()

      const names = parseNamesFromResponse(raw)

      if (names.length === 0) {
        throw new Error('No valid names in the response')
      }

      setGeneratedNames(names)
    } catch (error) {
      console.error('Failed to generate names:', error)
      setNameError(error instanceof Error ? error.message : 'Generation failed — check your API key')
    } finally {
      setIsGeneratingNames(false)
    }
  }

  function handleNameSelect(name: string) {
    setField("name", name)
    setShowNamePicker(false)
  }

  function handleNamePickerClose() {
    setShowNamePicker(false)
  }

  function handleFinish() {
    const trimmedName = form.name.trim()
    if (!trimmedName) return

    const ageValue = form.age.trim() ? parseInt(form.age.trim(), 10) : undefined

    const metadata: CharacterMetadata = {
      name: trimmedName,
      speciesId,
      ...(ageValue !== undefined && !isNaN(ageValue) ? { age: ageValue } : {}),
      ...(form.gender.trim() ? { gender: form.gender.trim() } : {}),
      ...(form.eyes.trim() ? { eyes: form.eyes.trim() } : {}),
      ...(form.hair.trim() ? { hair: form.hair.trim() } : {}),
      ...(form.height.trim() ? { height: form.height.trim() } : {}),
      ...(form.weight.trim() ? { weight: form.weight.trim() } : {}),
      ...(form.distinctiveMarks.trim()
        ? { distinctiveMarks: form.distinctiveMarks.trim() }
        : {}),
    }

    onFinish(metadata, form.notes.trim())
  }

  const canFinish = form.name.trim().length > 0
  const canRoll = speciesAppearance !== undefined

  /** Renders the dice roll hint below a rollable field. */
  function RollHint({ field }: { field: RollableField }) {
    const entry = rollResults[field]
    if (!entry) return null

    let text: string
    if (entry.field === "age") {
      text = `Rolled: ${formatDiceRoll(entry.data.roll.dice)} → ${entry.data.result}`
    } else if (entry.field === "height") {
      text = `Rolled: ${formatDiceRoll(entry.data.roll.dice)} → ${inchesToFeetString(entry.data.result)}`
    } else if (entry.field === "weight") {
      text = `${speciesName} build (×${(entry.data.buildFactor ?? 2.0).toFixed(1)}) · d10=${entry.data.d10Roll} (×${entry.data.multiplier.toFixed(2)}) → ${entry.data.result} lbs`
    } else {
      // eyes or hair — show each 2d10 roll
      const rollStrings = entry.data.rolls.map(
        (r: ColourRollDetails) => `${r.die1} + ${r.die2} = ${r.total}`
      )
      text = `Rolled: ${rollStrings.join(" / ")}`
    }

    return (
      <p className="mt-1 text-xs text-amber-500/70 font-mono">{text}</p>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Name picker modal */}
      {showNamePicker && (
        <NamePickerModal
          names={generatedNames}
          isLoading={isGeneratingNames}
          error={nameError}
          onSelect={handleNameSelect}
          onClose={handleNamePickerClose}
        />
      )}
      <div className="mx-auto max-w-7xl">
        <StepIndicator
          currentStep={6}
          totalSteps={8}
          stepLabel="Character Details"
        />

        {/* Two-column layout: left stats panel + right content */}
        <div className="flex gap-6 items-start">
          {/* Left column: sticky stats panel (~1/3 width) */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CurrentStatsPanel
              characteristics={characterCharacteristics}
              careerCharacteristics={careerCharacteristics}
              careerSkills={career?.levels[0].skills.map(s => 
                s.specialisation ? `${s.skill} (${s.specialisation})`
                : s.anySpecialisation ? `${s.skill} (any)`
                : s.skill
              ) ?? []}
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
            <div className="mb-8">
              <h1 className="font-serif text-3xl text-gray-100">
                Character Details
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Give your{" "}
            <span className="text-amber-400">{speciesName}</span>{" "}
            <span className="text-amber-400">{careerTitle}</span> a name and
            identity. Who are they in the Old World?
              </p>
            </div>

        {/* Identity */}
        <fieldset className="mb-5 rounded-lg border border-gray-800 bg-gray-900/60 p-6">
          <legend className="px-2 font-serif text-amber-400 text-sm uppercase tracking-wider">
            Identity
          </legend>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-widest text-gray-400">
                  Name <span className="text-red-500">*</span>
                </label>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleGenerateNames}
                    disabled={isGeneratingNames}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors ${
                      isGeneratingNames
                        ? "cursor-wait border-gray-700 bg-gray-800 text-gray-400"
                        : "border-amber-700 bg-gray-800 text-amber-400 hover:border-amber-500 hover:bg-amber-900/30"
                    }`}
                  >
                    {isGeneratingNames ? "Generating…" : "✨ Names"}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Full name and any titles or epithets…"
                className={inputClass(form.name.length > 0, false)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Age — rollable */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Age
                </label>
                <div className="flex items-center gap-2">
                  <RollButton
                    onClick={handleRollAge}
                    disabled={!canRoll}
                    hasRolled={hasRolled.age}
                  />
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setField("age", e.target.value)}
                    placeholder="Years"
                    min={1}
                    max={999}
                    className={inputClass(form.age.length > 0, flashField === "age")}
                  />
                </div>
                <RollHint field="age" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Gender
                </label>
                <input
                  type="text"
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  placeholder="Optional — free text"
                  className={inputClass(form.gender.length > 0, false)}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Appearance */}
        <fieldset className="mb-5 rounded-lg border border-gray-800 bg-gray-900/60 p-6">
          <legend className="px-2 font-serif text-amber-400 text-sm uppercase tracking-wider">
            Appearance
          </legend>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Eye Colour — rollable */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Eyes
                </label>
                <div className="flex items-center gap-2">
                  <RollButton
                    onClick={handleRollEyes}
                    disabled={!canRoll}
                    hasRolled={hasRolled.eyes}
                  />
                  <input
                    type="text"
                    value={form.eyes}
                    onChange={(e) => setField("eyes", e.target.value)}
                    placeholder="e.g. Steel grey"
                    className={inputClass(form.eyes.length > 0, flashField === "eyes")}
                  />
                </div>
                <RollHint field="eyes" />
              </div>

              {/* Hair Colour — rollable */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Hair
                </label>
                <div className="flex items-center gap-2">
                  <RollButton
                    onClick={handleRollHair}
                    disabled={!canRoll}
                    hasRolled={hasRolled.hair}
                  />
                  <input
                    type="text"
                    value={form.hair}
                    onChange={(e) => setField("hair", e.target.value)}
                    placeholder="e.g. Dark brown, braided"
                    className={inputClass(form.hair.length > 0, flashField === "hair")}
                  />
                </div>
                <RollHint field="hair" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Height — rollable, feet+inches display */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Height
                </label>
                <div className="flex items-center gap-2">
                  <RollButton
                    onClick={handleRollHeight}
                    disabled={!canRoll}
                    hasRolled={hasRolled.height}
                  />
                  <input
                    type="text"
                    value={form.height}
                    onChange={(e) => setField("height", e.target.value)}
                    onBlur={handleHeightBlur}
                    placeholder="5'9&quot; or 69"
                    className={inputClass(form.height.length > 0, flashField === "height")}
                  />
                </div>
                {heightInches !== null && !rollResults.height && (
                  <p className="mt-1 text-xs text-gray-400">
                    {heightInches} inches
                  </p>
                )}
                <RollHint field="height" />
              </div>

              {/* Weight — rollable, requires height first */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Weight
                </label>
                <div className="flex items-center gap-2">
                  <RollButton
                    onClick={handleRollWeight}
                    disabled={heightInches === null}
                    hasRolled={hasRolled.weight}
                    title={heightInches === null ? "Enter height first" : "Roll weight based on height"}
                  />
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setField("weight", e.target.value)}
                    placeholder="e.g. 160 lbs or 73 kg"
                    className={inputClass(form.weight.length > 0, flashField === "weight")}
                  />
                </div>
                <RollHint field="weight" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                Distinguishing Marks
              </label>
              <textarea
                value={form.distinctiveMarks}
                onChange={(e) => setField("distinctiveMarks", e.target.value)}
                rows={2}
                placeholder="Scars, tattoos, birthmarks, unusual features…"
                className={textareaClass()}
              />
            </div>
          </div>
        </fieldset>

        {/* Fate & Resilience */}
        <fieldset className="mb-5 rounded-lg border border-gray-800 bg-gray-900/60 p-6">
          <legend className="px-2 font-serif text-amber-400 text-sm uppercase tracking-wider">
            Fate & Resilience
          </legend>

          <div className="space-y-4">
            {/* Base values display */}
            <div className="text-sm text-gray-400 border-b border-gray-800 pb-3">
              <span className="text-emerald-400">Base Fate: {speciesBaseFate}</span>
              <span className="mx-3 text-gray-400">|</span>
              <span className="text-amber-400">Base Resilience: {speciesBaseResilience}</span>
            </div>

            {/* Extra points allocation */}
            <div>
              <p className="text-sm text-gray-300 mb-3">
                You have{" "}
                <span className="font-bold text-amber-400">
                  {speciesExtraPoints} Extra Point{speciesExtraPoints !== 1 ? "s" : ""}
                </span>{" "}
                to distribute between Fate and Resilience.
              </p>

              {/* Allocation controls */}
              <div className="grid grid-cols-2 gap-4">
                {/* Fate Extra Points */}
                <div className="rounded border border-emerald-800/60 bg-emerald-950/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-300">Extra Fate</span>
                    <span className="text-2xl font-bold text-emerald-400 tabular-nums">
                      {fateExtraPoints}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onFateExtraPointsChange(Math.max(0, fateExtraPoints - 1))}
                      disabled={fateExtraPoints === 0}
                      className="flex-1 rounded border px-3 py-2 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 border-emerald-700 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60 disabled:hover:bg-emerald-900/40"
                      aria-label="Decrease Fate extra points"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => onFateExtraPointsChange(Math.min(speciesExtraPoints, fateExtraPoints + 1))}
                      disabled={fateExtraPoints === speciesExtraPoints}
                      className="flex-1 rounded border px-3 py-2 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 border-emerald-700 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60 disabled:hover:bg-emerald-900/40"
                      aria-label="Increase Fate extra points"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Resilience Extra Points (calculated as remainder) */}
                <div className="rounded border border-amber-800/60 bg-amber-950/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-300">Extra Resilience</span>
                    <span className="text-2xl font-bold text-amber-400 tabular-nums">
                      {speciesExtraPoints - fateExtraPoints}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    Automatically calculated
                  </div>
                </div>
              </div>

              {/* Final totals display */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-300 mb-2">Final Totals:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded bg-emerald-950/40 px-3 py-2 border border-emerald-900/50">
                    <div className="text-xs text-emerald-400/70 mb-0.5">Fate</div>
                    <div className="text-sm text-gray-300 font-mono">
                      {speciesBaseFate} + {fateExtraPoints} ={" "}
                      <span className="text-lg font-bold text-emerald-400">
                        {speciesBaseFate + fateExtraPoints}
                      </span>
                    </div>
                  </div>
                  <div className="rounded bg-amber-950/40 px-3 py-2 border border-amber-900/50">
                    <div className="text-xs text-amber-400/70 mb-0.5">Resilience</div>
                    <div className="text-sm text-gray-300 font-mono">
                      {speciesBaseResilience} + {speciesExtraPoints - fateExtraPoints} ={" "}
                      <span className="text-lg font-bold text-amber-400">
                        {speciesBaseResilience + (speciesExtraPoints - fateExtraPoints)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="mb-8 rounded-lg border border-gray-800 bg-gray-900/60 p-6">
          <legend className="px-2 font-serif text-amber-400 text-sm uppercase tracking-wider">
            Notes
          </legend>

          <div>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              placeholder="Backstory, connections, GM notes…"
              className={textareaClass()}
            />
          </div>
        </fieldset>

        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            disabled={!canFinish}
            onClick={handleFinish}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
        </div>
      </div>
    )
  }
