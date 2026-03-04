import { world, system, ScriptEventSource } from "@minecraft/server";
import { SkillType, SKILL_DISPLAY_NAMES } from "./types/index.js";
import { PlayerDataManager } from "./core/PlayerDataManager.js";
import { FeedbackManager } from "./core/FeedbackManager.js";
import { AbilityManager } from "./core/AbilityManager.js";
import { AntiExploit } from "./core/AntiExploit.js";
import { SkillManager } from "./core/SkillManager.js";
import { xpToNextLevel } from "./core/XpFormula.js";
// Initialize managers
const feedback = new FeedbackManager();
const playerData = new PlayerDataManager(feedback);
const abilityManager = new AbilityManager(feedback, playerData);
const antiExploit = new AntiExploit();
const skillManager = new SkillManager(playerData, abilityManager, antiExploit, feedback);
// Startup
system.run(() => {
    playerData.init();
    abilityManager.init();
    antiExploit.init();
    skillManager.init();
    world.sendMessage("§a[McMMO] §7Bedrock McMMO loaded!");
});
// Player join/leave
world.afterEvents.playerJoin.subscribe((event) => {
    // Load data on next tick (player may not be fully loaded yet)
    system.runTimeout(() => {
        const player = world.getAllPlayers().find(p => p.name === event.playerName);
        if (player) {
            playerData.loadPlayer(player);
            player.sendMessage("§a[McMMO] §7Welcome! Use §e/scriptevent mcmmo:stats§7 for your stats.");
        }
    }, 20);
});
world.afterEvents.playerLeave.subscribe((event) => {
    // Find cached data by name and save
    const playerId = event.playerId;
    feedback.clearPlayer(playerId);
    abilityManager.clearPlayer(playerId);
    // Player object is gone by now, but saveAllDirty in PlayerDataManager handles periodic saves
});
// Script event commands: /scriptevent mcmmo:<command>
// Usage: /scriptevent mcmmo:stats, /scriptevent mcmmo:mining, /scriptevent mcmmo:top, etc.
system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (!event.id.startsWith("mcmmo:"))
        return;
    if (event.sourceType !== ScriptEventSource.Entity || !event.sourceEntity)
        return;
    if (event.sourceEntity.typeId !== "minecraft:player")
        return;
    const player = event.sourceEntity;
    const subCommand = event.id.substring("mcmmo:".length);
    switch (subCommand) {
        case "stats":
        case "mcmmo":
            showStats(player);
            break;
        case "top":
            showLeaderboard(player);
            break;
        case "ability":
            toggleAbility(player);
            break;
        case "mining":
        case "woodcutting":
        case "excavation":
        case "herbalism":
        case "fishing":
        case "swords":
        case "axes":
        case "archery":
        case "unarmed":
        case "taming":
        case "acrobatics":
        case "repair":
            showSkillDetail(player, subCommand);
            break;
        case "help":
            player.sendMessage("§6▬▬▬▬▬▬▬ §e§lMcMMO Help §6▬▬▬▬▬▬▬");
            player.sendMessage("§e/scriptevent mcmmo:stats §7- View all skills");
            player.sendMessage("§e/scriptevent mcmmo:top §7- Leaderboard");
            player.sendMessage("§e/scriptevent mcmmo:ability §7- Toggle abilities");
            player.sendMessage("§e/scriptevent mcmmo:<skill> §7- Skill details");
            break;
        default:
            player.sendMessage("§c[McMMO] Unknown command. Use §e/scriptevent mcmmo:help");
    }
});
function showStats(player) {
    const data = playerData.getData(player);
    const powerLevel = playerData.getPowerLevel(player);
    player.sendMessage("§6▬▬▬▬▬▬▬ §e§lMcMMO Stats §6▬▬▬▬▬▬▬");
    player.sendMessage(`§7Power Level: §e${powerLevel}`);
    player.sendMessage("§6------- §7Gathering §6-------");
    const gatheringSkills = [SkillType.Mining, SkillType.Woodcutting, SkillType.Excavation, SkillType.Herbalism, SkillType.Fishing];
    for (const skill of gatheringSkills) {
        const s = data.skills[skill];
        player.sendMessage(`§a${SKILL_DISPLAY_NAMES[skill]}: §e${s.level} §7(${s.xp}/${xpToNextLevel(s.level)} XP)`);
    }
    player.sendMessage("§6------- §7Combat §6-------");
    const combatSkills = [SkillType.Swords, SkillType.Axes, SkillType.Archery, SkillType.Unarmed, SkillType.Taming];
    for (const skill of combatSkills) {
        const s = data.skills[skill];
        player.sendMessage(`§c${SKILL_DISPLAY_NAMES[skill]}: §e${s.level} §7(${s.xp}/${xpToNextLevel(s.level)} XP)`);
    }
    player.sendMessage("§6------- §7Other §6-------");
    const otherSkills = [SkillType.Acrobatics, SkillType.Repair];
    for (const skill of otherSkills) {
        const s = data.skills[skill];
        player.sendMessage(`§b${SKILL_DISPLAY_NAMES[skill]}: §e${s.level} §7(${s.xp}/${xpToNextLevel(s.level)} XP)`);
    }
}
function showLeaderboard(player) {
    const players = world.getAllPlayers();
    const entries = [];
    for (const p of players) {
        entries.push({ name: p.name, power: playerData.getPowerLevel(p) });
    }
    entries.sort((a, b) => b.power - a.power);
    player.sendMessage("§6▬▬▬▬▬▬▬ §e§lMcMMO Leaderboard §6▬▬▬▬▬▬▬");
    for (let i = 0; i < Math.min(entries.length, 10); i++) {
        const e = entries[i];
        player.sendMessage(`§7#${i + 1} §a${e.name} §7- Power Level: §e${e.power}`);
    }
}
function toggleAbility(player) {
    const data = playerData.getData(player);
    data.abilityToggle = !data.abilityToggle;
    const state = data.abilityToggle ? "§aENABLED" : "§cDISABLED";
    player.sendMessage(`§e[McMMO] §7Ability activation: ${state}`);
}
function showSkillDetail(player, skillType) {
    const data = playerData.getData(player);
    const skill = data.skills[skillType];
    const name = SKILL_DISPLAY_NAMES[skillType];
    player.sendMessage(`§6▬▬▬▬▬▬▬ §e§l${name} §6▬▬▬▬▬▬▬`);
    player.sendMessage(`§7Level: §e${skill.level}`);
    player.sendMessage(`§7XP: §e${skill.xp}/${xpToNextLevel(skill.level)}`);
    // Skill-specific info
    const level = skill.level;
    switch (skillType) {
        case SkillType.Mining:
            player.sendMessage(`§7Double Drop Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eSuperBreaker §7(Haste III)`);
            break;
        case SkillType.Woodcutting:
            player.sendMessage(`§7Double Drop Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eTree Feller §7(Break entire tree)`);
            break;
        case SkillType.Excavation:
            player.sendMessage(`§7Double Drop Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Treasure Chance: §a${(0.5 + level * 0.05).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eGiga Drill Breaker §7(Haste III + 3x Treasure)`);
            break;
        case SkillType.Herbalism:
            player.sendMessage(`§7Double Drop Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Green Thumb Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eGreen Terra §7(3x drops + auto-replant)`);
            break;
        case SkillType.Fishing:
            player.sendMessage(`§7Treasure Chance: §a${(0.5 + level * 0.05).toFixed(1)}%`);
            break;
        case SkillType.Swords:
            player.sendMessage(`§7Bleed Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            player.sendMessage(`§7Counter Attack Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eSerrated Strikes §7(AoE + Bleed)`);
            break;
        case SkillType.Axes:
            player.sendMessage(`§7Critical Strike Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eSkull Splitter §7(AoE 50% damage)`);
            break;
        case SkillType.Archery:
            player.sendMessage(`§7Skill Shot Bonus: §a+${Math.min(level * 0.05, 50).toFixed(1)}% damage`);
            player.sendMessage(`§7Daze Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            break;
        case SkillType.Unarmed:
            player.sendMessage(`§7Iron Arm Bonus: §a+${Math.min(level * 0.02, 3).toFixed(1)} damage`);
            player.sendMessage(`§7Disarm Chance: §a${Math.min(level * 0.033, 33).toFixed(1)}%`);
            player.sendMessage(`§7Arrow Deflect Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            player.sendMessage(`§7Ability: §eBerserk §7(Strength I + 2x Disarm)`);
            break;
        case SkillType.Taming:
            player.sendMessage(`§7Gore Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            player.sendMessage(`§7Thick Fur (Fire Res): ${level >= 250 ? "§aUnlocked" : `§cLevel 250`}`);
            player.sendMessage(`§7Holy Hound (Regen): ${level >= 375 ? "§aUnlocked" : `§cLevel 375`}`);
            player.sendMessage(`§7Shock Proof: ${level >= 500 ? "§aUnlocked" : `§cLevel 500`}`);
            player.sendMessage(`§7Fast Food Service: ${level >= 50 ? "§aUnlocked" : `§cLevel 50`}`);
            break;
        case SkillType.Acrobatics:
            player.sendMessage(`§7Dodge Chance: §a${Math.min(level * 0.05, 50).toFixed(1)}%`);
            player.sendMessage(`§7Graceful Roll: §a${Math.min(level * 0.1, 100).toFixed(1)}% §7(while sneaking)`);
            break;
        case SkillType.Repair:
            player.sendMessage(`§7Super Repair Chance: §a${Math.min(level * 0.1, 100).toFixed(1)}%`);
            break;
    }
}
