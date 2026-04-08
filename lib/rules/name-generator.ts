import type { Species } from "@/lib/types/rules";

interface NameData {
  meta: {
    description?: string;
    naming_conventions?: string;
    logic?: string;
  };
  templates: string[];
  // Dwarf/Human
  forename?: string[];
  // Dwarf
  parent_root?: string[];
  suffix?: string[];
  nickname?: string[];
  clan?: string[];
  // Elves
  prefix?: string[];
  middle?: string[];
  epithet?: string[];
  // Halfling
  names?: { formal: string; short: string }[];
  short?: string[];
  // Human
  surname?: string[];
  location?: string[];
  house_name?: string[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateName(species: Species): string {
  const names = species.names as NameData | undefined;
  if (!names) {
    // Fallback generic name
    return `Character ${Math.floor(Math.random() * 1000)}`;
  }

  const template = pick(names.templates);
  const speciesId = species.id;

  switch (speciesId) {
    case "dwarf":
      return generateDwarfName(template, names);
    case "halfling":
      return generateHalflingName(template, names);
    case "high-elf":
    case "wood-elf":
      return generateElfName(template, names);
    case "human":
      return generateHumanName(template, names);
    default:
      return template;
  }
}

function generateDwarfName(template: string, names: NameData): string {
  const forename = pick(names.forename || []);
  const clan = pick(names.clan || []);

  if (template.includes("{nickname}")) {
    const nickname = pick(names.nickname || []);
    return template
      .replace("{forename}", forename)
      .replace("{nickname}", nickname)
      .replace("{clan}", clan);
  } else {
    const parentRoot = pick(names.parent_root || []);
    const suffix = pick(names.suffix || []);
    return template
      .replace("{forename}", forename)
      .replace("{parent_root}", parentRoot)
      .replace("{suffix}", suffix)
      .replace("{clan}", clan);
  }
}

function generateHalflingName(template: string, names: NameData): string {
  const nameEntry = pick(names.names || []);
  const middle = pick(names.middle || []);
  const clan = pick(names.clan || []);

  return template
    .replace("{names:formal}", nameEntry.formal)
    .replace("{names:short}", nameEntry.short)
    .replace("{middle}", middle)
    .replace("{clan}", clan);
}

function generateElfName(template: string, names: NameData): string {
  const prefix = pick(names.prefix || []);
  const suffix = pick(names.suffix || []);
  const epithet = pick(names.epithet || []);

  if (template.includes("{middle}")) {
    const middle = pick(names.middle || []);
    return template
      .replace("{prefix}", prefix)
      .replace("{middle}", middle)
      .replace("{suffix}", suffix)
      .replace("{epithet}", epithet);
  } else {
    return template
      .replace("{prefix}", prefix)
      .replace("{suffix}", suffix)
      .replace("{epithet}", epithet);
  }
}

function generateHumanName(template: string, names: NameData): string {
  const forename = pick(names.forename || []);

  if (template.includes("{surname}")) {
    const surname = pick(names.surname || []);
    return template
      .replace("{forename}", forename)
      .replace("{surname}", surname);
  } else if (template.includes("{location}") && !template.includes("{house_name}")) {
    const location = pick(names.location || []);
    return template
      .replace("{forename}", forename)
      .replace("{location}", location);
  } else {
    const houseName = pick(names.house_name || []);
    const location = pick(names.location || []);
    return template
      .replace("{forename}", forename)
      .replace("{house_name}", houseName)
      .replace("{location}", location);
  }
}
