import speciesData from "@/data/species.json";
import careersData from "@/data/careers.json";
import skillsData from "@/data/skills.json";
import type { Species, Career, Skill } from "@/lib/types/rules";
import { CharacterWizard } from "@/components/character/CharacterWizard";

export default function NewCharacterPage() {
  const allSpecies = speciesData as Species[];
  const allCareers = careersData as Career[];
  const allSkills = skillsData as Skill[];
  return (
    <CharacterWizard
      allSpecies={allSpecies}
      allCareers={allCareers}
      allSkills={allSkills}
    />
  );
}
