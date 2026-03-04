export enum SkillType {
  Mining = "mining",
  Woodcutting = "woodcutting",
  Excavation = "excavation",
  Herbalism = "herbalism",
  Fishing = "fishing",
  Swords = "swords",
  Axes = "axes",
  Archery = "archery",
  Unarmed = "unarmed",
  Taming = "taming",
  Acrobatics = "acrobatics",
  Repair = "repair",
}

export interface SkillData {
  level: number;
  xp: number;
}

export interface PlayerSkillsData {
  skills: Record<SkillType, SkillData>;
  abilityToggle: boolean;
}

export interface AbilityState {
  skill: SkillType;
  active: boolean;
  readyNotified: boolean;
  activatedAt: number;
  duration: number;
  cooldownUntil: number;
}

export interface PlacedBlockEntry {
  x: number;
  y: number;
  z: number;
  dim: string;
}

export function createDefaultSkillsData(): PlayerSkillsData {
  const skills = {} as Record<SkillType, SkillData>;
  for (const skill of Object.values(SkillType)) {
    skills[skill] = { level: 0, xp: 0 };
  }
  return { skills, abilityToggle: true };
}

export const SKILL_DISPLAY_NAMES: Record<SkillType, string> = {
  [SkillType.Mining]: "Mining",
  [SkillType.Woodcutting]: "Woodcutting",
  [SkillType.Excavation]: "Excavation",
  [SkillType.Herbalism]: "Herbalism",
  [SkillType.Fishing]: "Fishing",
  [SkillType.Swords]: "Swords",
  [SkillType.Axes]: "Axes",
  [SkillType.Archery]: "Archery",
  [SkillType.Unarmed]: "Unarmed",
  [SkillType.Taming]: "Taming",
  [SkillType.Acrobatics]: "Acrobatics",
  [SkillType.Repair]: "Repair",
};
