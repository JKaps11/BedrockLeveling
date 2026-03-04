import { system } from "@minecraft/server";
import { SKILL_DISPLAY_NAMES } from "../types/index.js";
const ACTION_BAR_DEBOUNCE_TICKS = 40; // 2 seconds
export class FeedbackManager {
    constructor() {
        this.actionBarStates = new Map();
    }
    showXpGain(player, skill, amount) {
        const name = SKILL_DISPLAY_NAMES[skill];
        const msg = `§a+${amount} XP §7(${name})`;
        this.showActionBar(player, msg);
    }
    showLevelUp(player, skill, newLevel) {
        const name = SKILL_DISPLAY_NAMES[skill];
        player.sendMessage(`§6▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
        player.sendMessage(`§e§lLEVEL UP!§r §a${name} §7is now level §e${newLevel}§7!`);
        player.sendMessage(`§6▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
    }
    showAbilityActivated(player, abilityName, duration) {
        const seconds = Math.ceil(duration / 20);
        player.sendMessage(`§6§l** ${abilityName} ACTIVATED **§r §7(${seconds}s)`);
    }
    showAbilityReady(player, abilityName) {
        this.showActionBar(player, `§e§l** ${abilityName} READY ** §7(Use tool to activate)`);
    }
    showAbilityExpired(player, abilityName) {
        player.sendMessage(`§c** ${abilityName} has worn off **`);
    }
    showAbilityCooldown(player, abilityName, secondsLeft) {
        this.showActionBar(player, `§c${abilityName} is on cooldown (${secondsLeft}s)`);
    }
    showActionBar(player, message) {
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
    sendActionBar(player, message, tick) {
        try {
            player.onScreenDisplay.setActionBar(message);
            this.actionBarStates.set(player.id, { lastMessage: message, lastTick: tick });
        }
        catch {
            // Player may have left
        }
    }
    clearPlayer(playerId) {
        this.actionBarStates.delete(playerId);
    }
}
