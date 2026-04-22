"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import speciesData from "@/data/species.json";
import careersData from "@/data/careers.json";
import skillsData from "@/data/skills.json";
import talentsData from "@/data/talents.json";
import type { Character } from "@/lib/types/character";
import type { CharacteristicKey, Talent } from "@/lib/types/rules";
import { getTalentCharacteristicBonuses } from "@/lib/rules/characteristics";
import {
  fetchSharedCharacter,
} from "@/lib/utils/share-character";
import { saveCharacter, generateCharacterId, loadAllCharacters } from "@/lib/storage/character-storage";
import { Button } from "@/components/ui/Button";
import { WealthDisplay } from "@/components/ui/WealthDisplay";

const CHAR_KEYS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

function charBonus(value: number) {
  return Math.floor(value / 10);
}

function formatSlug(id: string) {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SharedCharacterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading shared character…</p>
      </div>
    }>
      <SharedCharacterInner />
    </Suspense>
  );
}

function SharedCharacterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null | undefined>(
    undefined
  );
  const [saved, setSaved] = useState(false);

  const shareId = searchParams.get("id");

  useEffect(() => {
    if (!shareId) {
      setCharacter(null);
      return;
    }
    fetchSharedCharacter(shareId).then((c) => setCharacter(c));
  }, [shareId]);

  const handleSave = () => {
    if (!character || !shareId) return;

    // Check if this shared character was already saved locally
    const existing = loadAllCharacters().find(
      (c) => c.sourceShareId === shareId
    );
    if (existing) {
      setSaved(true);
      router.push(`/character/${existing.id}`);
      return;
    }

    const newChar: Character = {
      ...character,
      id: generateCharacterId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceShareId: shareId,
    };
    saveCharacter(newChar);
    setSaved(true);
    router.push(`/character/${newChar.id}`);
  };

  if (character === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading shared character…</p>
      </div>
    );
  }

  if (character === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="font-serif text-3xl text-amber-700 mb-2">☠</p>
          <p className="font-serif text-2xl text-gray-400">Shared Character Not Found</p>
          <p className="text-gray-400 text-sm mt-2">
            This shared link may have expired or never existed.
          </p>
        </div>
        <Button variant="secondary" href="/shares">
          ← Browse Shared Characters
        </Button>
      </div>
    );
  }

  const species = (speciesData as Array<{ id: string; name: string }>).find(
    (s) => s.id === character.metadata.speciesId
  );
  const career = (
    careersData as Array<{
      id: string;
      name: string;
      levels: Array<{
        title: string;
        status: { tier: string; standing: number };
      }>;
    }>
  ).find((c) => c.id === character.currentCareerId);
  const careerLevel = career?.levels[character.currentCareerLevel - 1];

  const char = character;
  const talentIds = char.talents.map((t) => t.talentId);
  const typedTalentsData = talentsData as unknown as Talent[];

  function getCharTotal(key: CharacteristicKey): number {
    const talentBonus = getTalentCharacteristicBonuses(talentIds, key, typedTalentsData);
    return (
      (char.characteristicBases[key] ?? 0) +
      (char.characteristicAdvances[key] ?? 0) +
      talentBonus
    );
  }

  function getCharTalentBonus(key: CharacteristicKey): number {
    return getTalentCharacteristicBonuses(talentIds, key, typedTalentsData);
  }

  function getCharTalentBonusLabel(key: CharacteristicKey): string {
    const contributors = typedTalentsData.filter(
      (t) =>
        talentIds.includes(t.id) &&
        t.characteristicBonus?.characteristic === key &&
        (t.characteristicBonus?.value ?? 0) > 0
    );
    return contributors.map((t) => t.name).join(", ");
  }

  function findSkill(skillId: string) {
    return (
      skillsData as Array<{
        id: string;
        name: string;
        characteristic: string;
      }>
    ).find((s) => s.id === skillId);
  }

  function resolveTalent(talentId: string) {
    const normalized = talentId.replace(/\//g, "-");
    const talents = typedTalentsData as Array<{ id: string; name: string; description: string }>;
    return talents.find((t) => t.id === normalized || t.id === talentId)
      ?? talents.find((t) => normalized.startsWith(t.id + "-") || talentId.startsWith(t.id + "-"));
  }

  function formatTalentName(talentId: string): string {
    const normalized = talentId.replace(/\//g, "-");
    const talents = typedTalentsData as Array<{ id: string; name: string; description: string }>;
    const exact = talents.find((t) => t.id === normalized || t.id === talentId);
    if (exact) return exact.name;
    const base = talents.find((t) => normalized.startsWith(t.id + "-") || talentId.startsWith(t.id + "-"));
    if (base) {
      const suffix = normalized.slice(base.id.length + 1);
      const option = suffix.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `${base.name} (${option})`;
    }
    return formatSlug(talentId);
  }

  const careerSkills = character.skills.filter((s) => s.isCareerSkill);
  const otherSkills = character.skills.filter((s) => !s.isCareerSkill);

  const statusColour =
    careerLevel?.status.tier === "Gold"
      ? "text-yellow-400"
      : careerLevel?.status.tier === "Silver"
      ? "text-gray-300"
      : "text-orange-400";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8">
      {/* Top nav */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <Button variant="ghost" href="/shares">
          ← Shared Characters
        </Button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-4 py-2 text-sm text-emerald-300 border border-emerald-800/50 rounded bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-700/50 transition-colors disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save to My Characters"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="rounded-lg border border-amber-800/60 bg-gray-900 p-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="font-serif text-4xl sm:text-5xl text-amber-400 leading-tight">
              {character.metadata.name}
            </h1>
            {character.metadata.playerName && (
              <span className="text-sm text-gray-400 bg-gray-800 rounded px-2 py-1">
                Creator: {character.metadata.playerName}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {species && (
              <span className="text-amber-200 font-semibold">{species.name}</span>
            )}
            {career && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">{career.name}</span>
              </>
            )}
            {careerLevel && (
              <>
                <span className="text-gray-400">|</span>
                <span className="italic text-gray-400">{careerLevel.title}</span>
                <span className="text-gray-400">|</span>
                <span className={statusColour}>
                  {careerLevel.status.tier} {careerLevel.status.standing}
                </span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            XP:{" "}
            <span className="text-amber-500">{character.experience.spent}</span>{" "}
            spent of{" "}
            <span className="text-amber-500">{character.experience.total}</span>{" "}
            total
          </p>
          <div className="mt-3">
            {character.wealth ? (
              <WealthDisplay wealth={character.wealth} size="md" />
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </div>
        </header>

        {/* ── Characteristics ─────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
            Characteristics
          </h2>
          <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="border-b border-gray-800">
                  {CHAR_KEYS.map((k) => (
                    <th
                      key={k}
                      className="px-2 py-2 font-mono text-xs text-amber-500 tracking-widest uppercase"
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Base + advances row */}
                <tr className="border-b border-gray-800/40">
                  {CHAR_KEYS.map((k) => (
                    <td key={k} className="px-2 py-1.5 text-xs text-gray-400">
                      {character.characteristicBases[k] ?? 0}
                      {(character.characteristicAdvances[k] ?? 0) > 0 && (
                        <span className="text-amber-400">
                          +{character.characteristicAdvances[k]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Talent bonus row */}
                <tr className="border-b border-gray-800/40">
                  {CHAR_KEYS.map((k) => {
                    const talentBonus = getCharTalentBonus(k);
                    const talentLabel = talentBonus > 0 ? getCharTalentBonusLabel(k) : "";
                    return (
                      <td key={k} className="px-2 py-1 text-xs">
                        {talentBonus > 0 ? (
                          <span
                            className="text-emerald-500/80"
                            title={`+${talentBonus} from ${talentLabel}`}
                          >
                            +{talentBonus}✦
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Total row */}
                <tr className="border-b border-gray-800">
                  {CHAR_KEYS.map((k) => (
                    <td
                      key={k}
                      className="px-2 py-2 text-sm font-bold text-gray-100"
                    >
                      {getCharTotal(k)}
                    </td>
                  ))}
                </tr>
                {/* Bonus row */}
                <tr className="bg-gray-950/40">
                  {CHAR_KEYS.map((k) => (
                    <td key={k} className="px-2 py-1.5 text-xs text-gray-400">
                      {charBonus(getCharTotal(k))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-800">
              Row 1: Starting + Advances&nbsp;&nbsp;·&nbsp;&nbsp;Row 2: Talent Bonus&nbsp;&nbsp;·&nbsp;&nbsp;Row 3: Total&nbsp;&nbsp;·&nbsp;&nbsp;Row 4: Bonus (÷10)
            </p>
          </div>
        </section>

        {/* ── Wounds & Status ─────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
            Wounds &amp; Status
          </h2>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 grid grid-cols-5 gap-4 items-center">
            <StatPip label="Threshold" value={character.status.woundThreshold} highlight />
            <StatPip label="Current Wounds" value={character.status.currentWounds} />
            <StatPip label="Advantage" value={character.status.advantage} />
            <StatPip label="Fate" value={character.fate.total} />
            <StatPip label="Resilience" value={character.resilience.total} />
          </div>
        </section>

        {/* ── Skills ──────────────────────────────────────────────── */}
        {character.skills.length > 0 && (
          <section>
            <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
              Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careerSkills.length > 0 && (
                <SkillTable
                  label="Career Skills"
                  skills={careerSkills}
                  findSkill={findSkill}
                  getCharTotal={getCharTotal}
                />
              )}
              {otherSkills.length > 0 && (
                <SkillTable
                  label="Other Skills"
                  skills={otherSkills}
                  findSkill={findSkill}
                  getCharTotal={getCharTotal}
                />
              )}
            </div>
          </section>
        )}

        {/* ── Talents ─────────────────────────────────────────────── */}
        {character.talents.length > 0 && (
          <section>
            <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
              Talents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {character.talents.map((t, i) => {
                const talent = resolveTalent(t.talentId);
                return (
                  <div
                    key={i}
                    className="rounded border border-gray-800 bg-gray-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-amber-300 font-semibold text-sm leading-snug">
                        {formatTalentName(t.talentId)}
                      </span>
                      {t.timesTaken > 1 && (
                        <span className="text-xs text-gray-400 bg-gray-800 rounded px-1.5 py-0.5 shrink-0">
                          ×{t.timesTaken}
                        </span>
                      )}
                    </div>
                    {talent?.description && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                        {talent.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Trappings ───────────────────────────────────────────── */}
        {character.trappings.length > 0 && (
          <section>
            <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
              Trappings
            </h2>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                {character.trappings.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-700 text-xs mt-0.5 shrink-0">◆</span>
                    <span>
                      {t.name}
                      {t.quantity > 1 && (
                        <span className="text-gray-400 text-xs ml-1">
                          (×{t.quantity})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Character Details ────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
            Character Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h3 className="font-serif text-amber-300 text-sm uppercase tracking-wider mb-3">
                Personal Info
              </h3>
              <dl className="space-y-2">
                {(
                  [
                    ["Age", character.metadata.age],
                    ["Gender", character.metadata.gender],
                    ["Eyes", character.metadata.eyes],
                    ["Hair", character.metadata.hair],
                    ["Height", character.metadata.height],
                    ["Weight", character.metadata.weight],
                    ["Marks", character.metadata.distinctiveMarks],
                  ] as [string, string | number | undefined][]
                )
                  .filter(([, v]) => v !== undefined && v !== "")
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <dt className="text-gray-400 w-16 shrink-0">{label}</dt>
                      <dd className="text-gray-300">{String(value)}</dd>
                    </div>
                  ))}
                {!character.metadata.age &&
                  !character.metadata.gender &&
                  !character.metadata.eyes && (
                    <p className="text-gray-400 text-sm italic">
                      No details recorded.
                    </p>
                  )}
              </dl>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
              <h3 className="font-serif text-amber-300 text-sm uppercase tracking-wider">
                Background
              </h3>
              {character.backstory?.motivation && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Motivation</p>
                  <p className="text-gray-300 text-sm">{character.backstory.motivation}</p>
                </div>
              )}
              {!character.backstory?.motivation && character.metadata.motivation && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Motivation</p>
                  <p className="text-gray-300 text-sm">{character.metadata.motivation}</p>
                </div>
              )}
              {character.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-gray-400 text-sm whitespace-pre-wrap">{character.notes}</p>
                </div>
              )}
              {!character.backstory?.motivation && !character.metadata.motivation && !character.notes && (
                <p className="text-gray-400 text-sm italic">No background recorded.</p>
              )}
            </div>
          </div>
        </section>

        {/* Backstory */}
        {character.backstory && Object.entries(character.backstory).some(([k, v]) => k !== "motivation" && v) && (
          <section>
            <h2 className="font-serif text-lg text-amber-500 uppercase tracking-widest mb-3">
              Backstory
            </h2>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
              {(
                [
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
                ] as { key: keyof typeof character.backstory; label: string }[]
              )
                .filter(({ key }) => character.backstory![key])
                .map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{character.backstory![key]}</p>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center min-w-[64px]">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold ${highlight ? "text-gray-100" : "text-amber-400"}`}>
        {value}
      </p>
    </div>
  );
}

interface SkillTableProps {
  label: string;
  skills: Character["skills"];
  findSkill: (id: string) => { name: string; characteristic: string } | undefined;
  getCharTotal: (key: CharacteristicKey) => number;
}

function SkillTable({ label, skills, findSkill, getCharTotal }: SkillTableProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
      <h3 className="px-4 py-2 bg-gray-800/80 font-serif text-amber-300 text-sm uppercase tracking-wider">
        {label}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-widest">
            <th className="px-3 py-1.5 text-left">Skill</th>
            <th className="px-3 py-1.5 text-center">Char</th>
            <th className="px-3 py-1.5 text-center">Adv</th>
            <th className="px-3 py-1.5 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill, i) => {
            const def = findSkill(skill.skillId);
            const charKey = (def?.characteristic ?? "") as CharacteristicKey;
            const charVal = charKey ? getCharTotal(charKey) : 0;
            return (
              <tr
                key={i}
                className="border-b border-gray-800/40 hover:bg-gray-800/20"
              >
                <td className="px-3 py-1.5 text-gray-300">
                  {def?.name ?? formatSlug(skill.skillId)}
                  {skill.specialisation && (
                    <span className="text-gray-400 text-xs ml-1">
                      ({skill.specialisation})
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-center text-gray-400 font-mono text-xs">
                  {charKey || "—"}
                </td>
                <td className="px-3 py-1.5 text-center text-amber-400">
                  {skill.advances}
                </td>
                <td className="px-3 py-1.5 text-center text-gray-100 font-semibold">
                  {charVal + skill.advances}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
