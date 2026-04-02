"use client";

import type { Career, CharacteristicKey, Skill, Species, Talent } from "@/lib/types/rules";
import type { Characteristics } from "@/lib/types/character";
import type { CareerSkillAllocation } from "@/lib/rules/skills";
import { getTalentCharacteristicBonuses } from "@/lib/rules/characteristics";
import talentsData from "@/data/talents.json";
import skillsData from "@/data/skills.json";

const typedTalentsData = talentsData as unknown as Talent[];
const typedSkillsData = skillsData as unknown as Skill[];

function findSkillData(skillName: string): Skill | undefined {
  const exact = typedSkillsData.find((s) => s.name === skillName);
  if (exact) return exact;
  const parenIdx = skillName.indexOf(" (");
  if (parenIdx > -1) {
    const base = skillName.slice(0, parenIdx);
    return typedSkillsData.find((s) => s.name === base);
  }
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string | undefined }) {
  if (!content) return <>{children}</>;
  return (
    <span className="relative group/tip cursor-help">
      {children}
      <span
        className="absolute left-full top-0 ml-2 z-50 w-60 rounded-md bg-gray-950 border border-gray-700 px-3 py-2 text-xs text-gray-200 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none leading-relaxed whitespace-normal"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}

const ALL_CHARACTERISTICS: CharacteristicKey[] = [
  "WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel",
];

export interface SpeciesSkillDisplay {
  skillName: string;
  advances: number;
}

export interface CurrentStatsPanelProps {
  characteristics: Characteristics;
  careerCharacteristics: string[];
  careerSkills: string[];
  careerSkillAllocation: CareerSkillAllocation[];
  speciesSkills?: SpeciesSkillDisplay[];
  talentIds?: string[];
  career?: Career | null;
  species?: Species | null;
}

export function CurrentStatsPanel({
  characteristics,
  careerCharacteristics,
  careerSkills,
  careerSkillAllocation,
  speciesSkills = [],
  talentIds = [],
  career = null,
  species = null,
}: CurrentStatsPanelProps) {
  // Merge species + career skills for display
  const allSkillNames = Array.from(new Set([
    ...speciesSkills.map((s) => s.skillName),
    ...careerSkills,
  ]));

  return (
    <div className="space-y-3">
      {/* Species & Career info — top of panel */}
      {(species || career) && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 overflow-hidden">
          {species && (
            <div className="px-3 pt-2.5 pb-2 border-b border-amber-900/30">
              <p className="text-[9px] text-amber-500 uppercase tracking-widest mb-1">Species</p>
              <p className="text-sm text-sky-200 font-serif leading-tight">{species.name}</p>
            </div>
          )}
          {career && (
            <div className="px-3 pt-2.5 pb-2.5 space-y-1.5">
              <div>
                <p className="text-[9px] text-amber-500 uppercase tracking-widest mb-0.5">Career</p>
                <p className="text-sm text-amber-200 font-serif leading-tight">{career.name}</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[9px] text-amber-500 uppercase tracking-widest mb-0.5">Level</p>
                  <p className="text-xs text-amber-100">{career.levels[0]?.title ?? "Level 1"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-amber-500 uppercase tracking-widest mb-0.5">Class</p>
                  <p className="text-xs text-amber-100">{career.careerClass}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Characteristics */}
      <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-900/95">
        <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-800">
          <span className="font-serif text-sm text-amber-400">Characteristics</span>
        </div>
        <div className="px-3 py-2">
          <div className="grid grid-cols-2 gap-1">
            {ALL_CHARACTERISTICS.map((key) => {
              const base = characteristics[key] ?? 0;
              const talentBonus = getTalentCharacteristicBonuses(talentIds, key, typedTalentsData);
              const total = base + talentBonus;
              const isCareer = careerCharacteristics.includes(key as string);

              return (
                <div
                  key={key}
                  className={`rounded px-2 py-1.5 border ${
                    isCareer
                      ? "border-amber-700/50 bg-amber-950/20"
                      : "border-gray-800 bg-gray-900/60"
                  }`}
                  title={`${key}${isCareer ? " (career)" : ""}${talentBonus > 0 ? ` +${talentBonus} talent` : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isCareer ? "text-amber-300" : "text-gray-300"}`}>
                      {key}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="text-sm font-mono tabular-nums font-bold text-gray-100">
                        {base === 0 ? "—" : total}
                      </span>
                      {talentBonus > 0 && (
                        <span className="text-emerald-500/80 font-mono text-[10px] ml-0.5">
                          +{talentBonus}✦
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-amber-500 mt-1.5">✦ = talent bonus · amber = career</p>
        </div>
      </div>

      {/* Skills */}
      {allSkillNames.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/95">
          <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-800">
            <span className="font-serif text-sm text-amber-400">Skills</span>
          </div>
          <div className="px-3 py-2 space-y-0.5">
            {allSkillNames.map((skillName) => {
              const speciesAdv = speciesSkills.find((s) => s.skillName === skillName)?.advances ?? 0;
              const careerAdv = careerSkillAllocation.find((a) => a.skillId === skillName)?.advances ?? 0;
              const total = speciesAdv + careerAdv;
              const isCareer = careerSkills.includes(skillName);
              const skill = findSkillData(skillName);
              const tooltipText = skill
                ? `${skill.characteristic} skill${skill.advanced ? " (Advanced)" : ""}${skill.description ? `\n${skill.description}` : ""}`
                : undefined;

              return (
                <div key={skillName} className="flex items-center justify-between py-0.5">
                  <Tooltip content={tooltipText}>
                    <span className={`text-xs truncate max-w-[140px] ${isCareer ? "text-amber-200/80" : "text-gray-400"}`}>
                      {skillName}
                    </span>
                  </Tooltip>
                  <span className="text-xs font-mono tabular-nums text-gray-300 shrink-0 ml-2">
                    {total > 0 ? `+${total}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Talents */}
      {talentIds.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/95">
          <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-800">
            <span className="font-serif text-sm text-amber-400">Talents</span>
          </div>
          <div className="px-3 py-2 space-y-0.5">
            {talentIds.map((id) => {
              const talent = typedTalentsData.find((t) => t.id === id);
              const name = talent?.name ?? id;
              const tooltipParts = [];
              if (talent?.tests) tooltipParts.push(`Tests: ${talent.tests}`);
              if (talent?.description) tooltipParts.push(talent.description);
              const tooltipText = tooltipParts.length > 0 ? tooltipParts.join("\n\n") : undefined;

              return (
                <div key={id} className="py-0.5">
                  <Tooltip content={tooltipText}>
                    <span className="text-xs text-purple-300/80 truncate max-w-[160px] inline-block">
                      {name}
                    </span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
