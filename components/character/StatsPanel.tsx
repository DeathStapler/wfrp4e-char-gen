"use client";

import type { CharacteristicKey, Talent } from "@/lib/types/rules";
import { getTalentCharacteristicBonuses } from "@/lib/rules/characteristics";
import talentsData from "@/data/talents.json";

const typedTalentsData = talentsData as unknown as Talent[];

const ALL_CHARACTERISTICS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

const CHAR_FULL_NAMES: Record<CharacteristicKey, string> = {
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

export interface StatsPanelProps {
  characteristicBases: Partial<Record<CharacteristicKey, number>>;
  characteristicAdvances?: Partial<Record<CharacteristicKey, number>>;
  talentIds?: string[];
  fate?: number;
  resilience?: number;
}

export function StatsPanel({
  characteristicBases,
  characteristicAdvances = {},
  talentIds = [],
  fate,
  resilience,
}: StatsPanelProps) {
  const hasTalentBonus = ALL_CHARACTERISTICS.some(
    (k) => getTalentCharacteristicBonuses(talentIds, k, typedTalentsData) > 0
  );

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-900/95">
      <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-800">
        <span className="font-serif text-sm text-amber-400">Characteristics</span>
      </div>

      <div className="px-3 py-2">
        <div className="grid grid-cols-2 gap-1">
          {ALL_CHARACTERISTICS.map((key) => {
            const base = characteristicBases[key] ?? 0;
            const advances = characteristicAdvances[key] ?? 0;
            const talentBonus = getTalentCharacteristicBonuses(talentIds, key, typedTalentsData);
            const total = base + advances + talentBonus;
            const hasBreakdown = advances > 0 || talentBonus > 0;

            const talentSources =
              talentBonus > 0
                ? typedTalentsData
                    .filter(
                      (t) =>
                        talentIds.includes(t.id) &&
                        t.characteristicBonus?.characteristic === key
                    )
                    .map((t) => t.name)
                    .join(", ")
                : "";

            const tooltipParts = [CHAR_FULL_NAMES[key]];
            if (hasBreakdown && base > 0) {
              tooltipParts.push(`${base} base`);
              if (advances > 0) tooltipParts.push(`+${advances} adv`);
              if (talentBonus > 0) tooltipParts.push(`+${talentBonus} from ${talentSources}`);
            }

            return (
              <div
                key={key}
                className="rounded px-2 py-1.5 border border-gray-800 bg-gray-900/60"
                title={tooltipParts.join(" — ")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-300">{key}</span>
                  <span className="flex items-center gap-0.5">
                    <span className="text-sm font-mono tabular-nums font-bold text-gray-100">
                      {base === 0 && advances === 0 ? "—" : total}
                    </span>
                    {talentBonus > 0 && (
                      <span
                        className="text-emerald-500/80 font-mono text-[10px] ml-0.5"
                        aria-label={`+${talentBonus} from ${talentSources}`}
                      >
                        +{talentBonus}✦
                      </span>
                    )}
                  </span>
                </div>
                {hasBreakdown && base > 0 && (
                  <div className="text-[10px] text-gray-400 mt-0.5 font-mono leading-tight">
                    {base}
                    {advances > 0 && (
                      <span className="text-amber-400"> +{advances}</span>
                    )}
                    {talentBonus > 0 && (
                      <span className="text-emerald-800"> +{talentBonus}✦</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {hasTalentBonus && (
          <p className="text-[10px] text-emerald-400 mt-1.5">✦ = talent bonus</p>
        )}
      </div>

      {/* Fate & Resilience section */}
      {(fate !== undefined || resilience !== undefined) && (
        <>
          <div className="px-3 py-2.5 bg-gray-900 border-t border-gray-800">
            <span className="font-serif text-sm text-amber-400">Fate & Resilience</span>
          </div>
          <div className="px-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {fate !== undefined && (
                <div className="rounded px-2 py-1.5 border border-emerald-800/60 bg-emerald-950/20" title="Fate Points">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-300">Fate</span>
                    <span className="text-sm font-mono tabular-nums font-bold text-emerald-400">
                      {fate}
                    </span>
                  </div>
                </div>
              )}
              {resilience !== undefined && (
                <div className="rounded px-2 py-1.5 border border-amber-800/60 bg-amber-950/20" title="Resilience Points">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-300">Resilience</span>
                    <span className="text-sm font-mono tabular-nums font-bold text-amber-400">
                      {resilience}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
