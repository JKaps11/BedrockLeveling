import { world, Player, system } from "@minecraft/server";
import { PlayerSkillsData, SkillType, SkillData, createDefaultSkillsData } from "../types/index.js";
import { xpToNextLevel } from "./XpFormula.js";
import { FeedbackManager } from "./FeedbackManager.js";

const DATA_PROPERTY = "mcmmo:data";
const SAVE_INTERVAL_TICKS = 1200; // 60 seconds

export class PlayerDataManager {
  private cache: Map<string, PlayerSkillsData> = new Map();
  private dirty: Set<string> = new Set();

  constructor(private feedback: FeedbackManager) {}

  init(): void {
    system.runInterval(() => {
      this.saveAllDirty();
    }, SAVE_INTERVAL_TICKS);
  }

  loadPlayer(player: Player): PlayerSkillsData {
    const existing = this.cache.get(player.id);
    if (existing) return existing;

    let data: PlayerSkillsData;
    try {
      const raw = player.getDynamicProperty(DATA_PROPERTY) as string | undefined;
      if (raw) {
        const parsed = JSON.parse(raw) as PlayerSkillsData;
        // Ensure all skills exist (in case new skills were added)
        const defaultData = createDefaultSkillsData();
        for (const skill of Object.values(SkillType)) {
          if (!parsed.skills[skill]) {
            parsed.skills[skill] = defaultData.skills[skill];
          }
        }
        if (parsed.abilityToggle === undefined) parsed.abilityToggle = true;
        data = parsed;
      } else {
        data = createDefaultSkillsData();
      }
    } catch {
      data = createDefaultSkillsData();
    }

    this.cache.set(player.id, data);
    return data;
  }

  unloadPlayer(player: Player): void {
    this.savePlayer(player);
    this.cache.delete(player.id);
    this.dirty.delete(player.id);
  }

  getData(player: Player): PlayerSkillsData {
    return this.cache.get(player.id) ?? this.loadPlayer(player);
  }

  getSkill(player: Player, skill: SkillType): SkillData {
    return this.getData(player).skills[skill];
  }

  addXp(player: Player, skill: SkillType, amount: number): void {
    if (amount <= 0) return;
    const data = this.getData(player);
    const skillData = data.skills[skill];
    const oldLevel = skillData.level;

    skillData.xp += amount;

    // Level up loop
    while (skillData.xp >= xpToNextLevel(skillData.level) && skillData.level < 1000) {
      skillData.xp -= xpToNextLevel(skillData.level);
      skillData.level++;
    }

    this.dirty.add(player.id);

    // Feedback
    this.feedback.showXpGain(player, skill, amount);
    if (skillData.level > oldLevel) {
      this.feedback.showLevelUp(player, skill, skillData.level);
    }
  }

  private savePlayer(player: Player): void {
    const data = this.cache.get(player.id);
    if (!data) return;
    try {
      player.setDynamicProperty(DATA_PROPERTY, JSON.stringify(data));
    } catch {
      // Player may have left
    }
    this.dirty.delete(player.id);
  }

  private saveAllDirty(): void {
    for (const playerId of this.dirty) {
      const player = world.getAllPlayers().find(p => p.id === playerId);
      if (player) {
        this.savePlayer(player);
      }
    }
  }

  getPowerLevel(player: Player): number {
    const data = this.getData(player);
    let total = 0;
    for (const skill of Object.values(SkillType)) {
      total += data.skills[skill].level;
    }
    return total;
  }
}
