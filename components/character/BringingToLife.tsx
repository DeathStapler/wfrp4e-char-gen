"use client";

import { useState } from "react";
import type { CharacterBackstory, Characteristics } from "@/lib/types/character";
import type { Career, Species } from "@/lib/types/rules";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import type { SpeciesSkillSelection } from "@/lib/rules/species";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/character/StepIndicator";
import { CurrentStatsPanel } from "@/components/character/CurrentStatsPanel";
import { useAIProvider } from "@/hooks/useAIProvider";

export interface BringingToLifeProps {
  initialBackstory: CharacterBackstory;
  characterCharacteristics: Characteristics;
  careerCharacteristics: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  speciesSkillSelections: SpeciesSkillSelection[];
  talentIds: string[];
  career?: Career | null;
  species?: Species | null;
  onComplete: (backstory: CharacterBackstory) => void;
  onBack: (backstory: CharacterBackstory) => void;
}

function textareaClass() {
  return "w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 placeholder-gray-700 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30 resize-none";
}

function inputClass() {
  return "w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-700 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30";
}

interface Question {
  key: keyof CharacterBackstory;
  label: string;
}

const QUESTIONS: Question[] = [
  { key: "whereFrom", label: "Where are you from?" },
  { key: "family", label: "What is your family like?" },
  { key: "childhood", label: "What was your childhood like?" },
  { key: "whyLeft", label: "Why did you leave home?" },
  { key: "friends", label: "Who are your best friends?" },
  { key: "greatestDesire", label: "What is your greatest desire?" },
  { key: "bestMemory", label: "What are your best memories?" },
  { key: "worstMemory", label: "What are your worst memories?" },
  { key: "religion", label: "What are your religious beliefs?" },
  { key: "loyalty", label: "Who or what are you loyal to?" },
  { key: "whyAdventuring", label: "Why are you adventuring?" },
];

export function BringingToLife({
  initialBackstory,
  characterCharacteristics,
  careerCharacteristics,
  careerSkillAllocation,
  speciesSkillSelections,
  talentIds,
  career = null,
  species = null,
  onComplete,
  onBack,
}: BringingToLifeProps) {
  const [backstory, setBackstory] = useState<CharacterBackstory>(initialBackstory);
  const { apiKey, incrementApiCallCount, callAI } = useAIProvider();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Perplexity flow
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [perplexityMood, setPerplexityMood] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteJson, setPasteJson] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Maps Perplexity JSON keys → CharacterBackstory keys
  const PERPLEXITY_KEY_MAP: Record<string, keyof CharacterBackstory> = {
    character_motivation: "motivation",
    what_drives_your_character: "motivation",
    where_are_you_from: "whereFrom",
    what_is_your_family_like: "family",
    what_was_your_childhood_like: "childhood",
    why_did_you_leave_home: "whyLeft",
    who_are_your_best_friends: "friends",
    what_is_your_greatest_desire: "greatestDesire",
    what_are_your_best_memories: "bestMemory",
    what_are_your_worst_memories: "worstMemory",
    what_are_your_religious_beliefs: "religion",
    who_or_what_are_you_loyal_to: "loyalty",
    why_are_you_adventuring: "whyAdventuring",
  };

  function buildPerplexityPrompt(mood: string): string {
    const speciesName = species?.name ?? "Human";
    const careerTitle = career?.levels[0]?.title ?? "";
    const careerPart = careerTitle ? ` ${careerTitle}` : "";
    const intro = `Complete this json block as if you are making a ${speciesName}${careerPart} character for the warhammer WFRP game. It should have the mood of ${mood}`;
    const jsonTemplate = JSON.stringify({
      character_motivation: "",
      what_drives_your_character: "",
      where_are_you_from: "",
      what_is_your_family_like: "",
      what_was_your_childhood_like: "",
      why_did_you_leave_home: "",
      who_are_your_best_friends: "",
      what_is_your_greatest_desire: "",
      what_are_your_best_memories: "",
      what_are_your_worst_memories: "",
      what_are_your_religious_beliefs: "",
      who_or_what_are_you_loyal_to: "",
      why_are_you_adventuring: "",
    }, null, 2);
    return `${intro}\n${jsonTemplate}`;
  }

  function handleOpenPerplexity() {
    const mood = perplexityMood.trim();
    if (!mood) return;
    const prompt = buildPerplexityPrompt(mood);
    const url = `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowMoodInput(false);
    setShowPasteArea(true);
    setPasteJson("");
    setPasteError(null);
  }

  function handleApplyPastedJson() {
    setPasteError(null);
    const cleaned = pasteJson
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, string>;
    } catch {
      setPasteError("Could not parse JSON — make sure you copied the full response");
      return;
    }
    const updates: Partial<Record<keyof CharacterBackstory, string>> = {};
    for (const [rawKey, value] of Object.entries(parsed)) {
      const mappedKey = PERPLEXITY_KEY_MAP[rawKey];
      if (mappedKey && typeof value === "string" && value.trim()) {
        // Don't overwrite motivation if already set by character_motivation
        if (mappedKey === "motivation" && updates.motivation) continue;
        updates[mappedKey] = value.trim();
      }
    }
    if (Object.keys(updates).length === 0) {
      setPasteError("No recognised fields found — did you paste the full JSON?");
      return;
    }
    setBackstory((prev) => ({ ...prev, ...updates }));
    setShowPasteArea(false);
    setPasteJson("");
  }

  function update(key: keyof CharacterBackstory, value: string) {
    setBackstory((prev) => ({ ...prev, [key]: value || undefined }));
  }

  async function handleGenerateAll() {
    if (!apiKey) return;
    setIsGenerating(true);
    setGenerateError(null);

    const speciesName = species?.name ?? "Human";
    const careerTitle = career?.levels[0]?.title ?? "adventurer";

    const prompt = `Generate backstory answers for a ${speciesName} ${careerTitle} character in Warhammer Fantasy Roleplaying Game 4th Edition — a dark, gritty low-fantasy world of corruption, war, and peril.

Write 1-3 sentences for each field, fitting the character's species and career. The tone should be grim, grounded, and occasionally dark.

Return ONLY a valid JSON object with these exact keys (no extra text, no markdown fences):
{
  "motivation": "What drives this character? (e.g., Vengeance, Greed, Duty, Redemption)",
  "whereFrom": "Where are you from?",
  "family": "What is your family like?",
  "childhood": "What was your childhood like?",
  "whyLeft": "Why did you leave home?",
  "friends": "Who are your best friends?",
  "greatestDesire": "What is your greatest desire?",
  "bestMemory": "What are your best memories?",
  "worstMemory": "What are your worst memories?",
  "religion": "What are your religious beliefs?",
  "loyalty": "Who or what are you loyal to?",
  "whyAdventuring": "Why are you adventuring?"
}`;

    try {
      const raw = await callAI(prompt, { maxTokens: 1000, temperature: 0.9 });
      incrementApiCallCount();

      // Strip markdown fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed: Partial<Record<keyof CharacterBackstory, string>>;
      try {
        parsed = JSON.parse(cleaned) as Partial<Record<keyof CharacterBackstory, string>>;
      } catch {
        throw new Error('Could not parse response as JSON');
      }

      setBackstory((prev) => ({
        ...prev,
        ...(parsed.motivation ? { motivation: parsed.motivation } : {}),
        ...(parsed.whereFrom ? { whereFrom: parsed.whereFrom } : {}),
        ...(parsed.family ? { family: parsed.family } : {}),
        ...(parsed.childhood ? { childhood: parsed.childhood } : {}),
        ...(parsed.whyLeft ? { whyLeft: parsed.whyLeft } : {}),
        ...(parsed.friends ? { friends: parsed.friends } : {}),
        ...(parsed.greatestDesire ? { greatestDesire: parsed.greatestDesire } : {}),
        ...(parsed.bestMemory ? { bestMemory: parsed.bestMemory } : {}),
        ...(parsed.worstMemory ? { worstMemory: parsed.worstMemory } : {}),
        ...(parsed.religion ? { religion: parsed.religion } : {}),
        ...(parsed.loyalty ? { loyalty: parsed.loyalty } : {}),
        ...(parsed.whyAdventuring ? { whyAdventuring: parsed.whyAdventuring } : {}),
      }));
    } catch (error) {
      console.error('Failed to generate backstory:', error);
      setGenerateError(error instanceof Error ? error.message : 'Generation failed — check your API key');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <StepIndicator currentStep={7} totalSteps={8} stepLabel="Bringing to Life" />

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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-3xl text-gray-100">Bringing Your Character to Life</h1>
                  <p className="text-gray-400 mt-2 text-sm">
                    Answer as many or as few questions as you like. These details bring your character
                    alive at the table — you can always fill them in later.
                  </p>
                </div>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleGenerateAll}
                    disabled={isGenerating}
                    className={`ml-4 shrink-0 inline-flex items-center gap-1.5 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                      isGenerating
                        ? "cursor-wait border-gray-700 bg-gray-800 text-gray-400"
                        : "border-amber-700 bg-gray-800 text-amber-400 hover:border-amber-500 hover:bg-amber-900/30"
                    }`}
                  >
                    {isGenerating ? "Generating…" : "✨ Generate All"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowMoodInput(true); setShowPasteArea(false); setPasteError(null); }}
                  className="ml-2 shrink-0 inline-flex items-center gap-1.5 rounded border border-blue-700 bg-gray-800 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:border-blue-500 hover:bg-blue-900/30"
                >
                  🔮 Perplexity
                </button>
              </div>
              {generateError && (
                <p className="mt-2 text-sm text-red-400">{generateError}</p>
              )}
            </div>

        {/* Perplexity — mood input */}
        {showMoodInput && (
          <div className="mb-6 rounded-lg border border-blue-700/50 bg-blue-900/10 px-5 py-4">
            <p className="text-sm font-medium text-blue-300 mb-3">
              What mood should your character have?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                className="flex-1 rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                placeholder="e.g., brooding, optimistic, haunted, reckless…"
                value={perplexityMood}
                onChange={(e) => setPerplexityMood(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleOpenPerplexity(); if (e.key === "Escape") setShowMoodInput(false); }}
              />
              <button
                type="button"
                onClick={handleOpenPerplexity}
                disabled={!perplexityMood.trim()}
                className="rounded border border-blue-700 bg-gray-800 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:border-blue-500 hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Open Perplexity ↗
              </button>
              <button
                type="button"
                onClick={() => setShowMoodInput(false)}
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Perplexity — paste JSON response */}
        {showPasteArea && (
          <div className="mb-6 rounded-lg border border-blue-700/50 bg-blue-900/10 px-5 py-4">
            <p className="text-sm font-medium text-blue-300 mb-1">
              Paste the JSON from Perplexity
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Copy the full JSON block from Perplexity and paste it below, then click Apply.
            </p>
            <textarea
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none font-mono"
              rows={8}
              placeholder={'{\n  "character_motivation": "...",\n  "where_are_you_from": "...",\n  ...\n}'}
              value={pasteJson}
              onChange={(e) => { setPasteJson(e.target.value); setPasteError(null); }}
            />
            {pasteError && (
              <p className="mt-2 text-xs text-red-400">{pasteError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={handleApplyPastedJson}
                disabled={!pasteJson.trim()}
                className="rounded border border-blue-700 bg-gray-800 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:border-blue-500 hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply to Fields
              </button>
              <button
                type="button"
                onClick={() => { setShowPasteArea(false); setPasteJson(""); setPasteError(null); }}
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Motivation (top, full-width) */}
        <div className="mb-8 rounded-lg border border-amber-700/30 bg-amber-900/10 px-5 py-4">
          <label className="block text-sm font-medium text-amber-300 mb-1">
            Character Motivation
          </label>
          <p className="text-xs text-gray-400 mb-2">
            What drives your character? (e.g., Perfectionist, Nurturer, Penitent Martyr)
          </p>
          <input
            type="text"
            className={inputClass()}
            placeholder="e.g., Vengeance, Greed, Redemption…"
            value={backstory.motivation ?? ""}
            onChange={(e) => update("motivation", e.target.value)}
          />
        </div>

        {/* Questions grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {QUESTIONS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {label}
              </label>
              <textarea
                className={textareaClass()}
                rows={3}
                placeholder="Optional…"
                value={backstory[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-8">
          <Button variant="ghost" onClick={() => onBack(backstory)}>
            ← Back
          </Button>
          <Button variant="primary" onClick={() => onComplete(backstory)}>
            Next →
          </Button>
        </div>
      </div>
    </div>
        </div>
      </div>
    );
  }
