import { Player, system } from "@minecraft/server";
import { SkillType, SKILL_DISPLAY_NAMES } from "../types/index.js";

const ACTION_BAR_DEBOUNCE_TICKS = 40; // 2 seconds

interface ActionBarState {
  lastMessage: string;
  lastTick: number;
}

export class FeedbackManager {
  private actionBarStates: Map<string, ActionBarState> = new Map();

  showXpGain(player: Player, skill: SkillType, amount: number): void {
    const name = SKILL_DISPLAY_NAMES[skill];
    const msg = `§a+${amount} XP §7(${name})`;
    this.showActionBar(player, msg);
  }

  showLevelUp(player: Player, skill: SkillType, newLevel: number): void {
    const name = SKILL_DISPLAY_NAMES[skill];
    player.sendMessage(`§6▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
    player.sendMessage(`§e§lLEVEL UP!§r §a${name} §7is now level §e${newLevel}§7!`);
    player.sendMessage(`§6▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
  }

  showAbilityActivated(player: Player, abilityName: string, duration: number): void {
    const seconds = Math.ceil(duration / 20);
    player.sendMessage(`§6§l** ${abilityName} ACTIVATED **§r §7(${seconds}s)`);
  }

  showAbilityReady(player: Player, abilityName: string): void {
    this.showActionBar(player, `§e§l** ${abilityName} READY ** §7(Use tool to activate)`);
  }

  showAbilityExpired(player: Player, abilityName: string): void {
    player.sendMessage(`§c** ${abilityName} has worn off **`);
  }

  showAbilityCooldown(player: Player, abilityName: string, secondsLeft: number): void {
    this.showActionBar(player, `§c${abilityName} is on cooldown (${secondsLeft}s)`);
  }

  private showActionBar(player: Player, message: string): void {
    const currentTick = system.currentTick;
    const state = this.actionBarStates.get(player.id);

    // Priority messages (abilities) override debounce
    if (message.includes("**")) {
      this.sendActionBar(player, message, currentTick);
      return;
    }

    if (state && currentTick - state.lastTick < ACTION_BAR_DEBOUNCE_TICKS) {
      return; // Debounce
    }

    this.sendActionBar(player, message, currentTick);
  }

  private sendActionBar(player: Player, message: string, tick: number): void {
    try {
      player.onScreenDisplay.setActionBar(message);
      this.actionBarStates.set(player.id, { lastMessage: message, lastTick: tick });
    } catch {
      // Player may have left
    }
  }

  clearPlayer(playerId: string): void {
    this.actionBarStates.delete(playerId);
  }
}
