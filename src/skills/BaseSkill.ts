import { Player } from "@minecraft/server";
import { SkillType } from "../types/index.js";
import { PlayerDataManager } from "../core/PlayerDataManager.js";
import { AbilityManager } from "../core/AbilityManager.js";
import { AntiExploit } from "../core/AntiExploit.js";
import { FeedbackManager } from "../core/FeedbackManager.js";

export interface SkillContext {
  playerData: PlayerDataManager;
  abilityManager: AbilityManager;
  antiExploit: AntiExploit;
  feedback: FeedbackManager;
}

export abstract class BaseSkill {
  abstract readonly skillType: SkillType;
  abstract readonly name: string;
  protected ctx: SkillContext;

  constructor(ctx: SkillContext) {
    this.ctx = ctx;
  }

  protected getLevel(player: Player): number {
    return this.ctx.playerData.getSkill(player, this.skillType).level;
  }

  protected addXp(player: Player, amount: number): void {
    this.ctx.playerData.addXp(player, this.skillType, amount);
  }

  protected isAbilityActive(player: Player): boolean {
    return this.ctx.abilityManager.isAbilityActive(player, this.skillType);
  }

  protected chanceCheck(player: Player, chancePerLevel: number, maxChance: number = 100): boolean {
    const level = this.getLevel(player);
    const chance = Math.min(level * chancePerLevel, maxChance);
    return Math.random() * 100 < chance;
  }
}
