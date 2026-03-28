import { world, system, Player, ScriptEventSource, ItemComponentUseEvent } from "@minecraft/server";
import { SkillType, SKILL_DISPLAY_NAMES } from "./types/index.js";
import { PlayerDataManager } from "./core/PlayerDataManager.js";
import { FeedbackManager } from "./core/FeedbackManager.js";
import { AbilityManager } from "./core/AbilityManager.js";
import { AntiExploit } from "./core/AntiExploit.js";
import { SkillManager } from "./core/SkillManager.js";
import { xpToNextLevel } from "./core/XpFormula.js";
import { CreepyCats } from "./systems/CreepyCats.js";
import { PenisCollector } from "./systems/PenisCollector.js";

// Register custom component for penis bow
system.beforeEvents.startup.subscribe((event) => {
  event.itemComponentRegistry.registerCustomComponent("leveling:penis_bow_shoot", {
    onUse(e: ItemComponentUseEvent) {
      system.run(() => {
        PenisCollector.onBowUse(e.source);
      });
    },
  });
});

// Initialize managers
const feedback = new FeedbackManager();
const playerData = new PlayerDataManager(feedback);
const abilityManager = new AbilityManager(feedback, playerData);
const antiExploit = new AntiExploit();
const skillManager = new SkillManager(playerData, abilityManager, antiExploit, feedback);
const penisCollector = new PenisCollector();

// Startup
system.run(() => {
  playerData.init();
  abilityManager.init();
  antiExploit.init();
  skillManager.init();
  new CreepyCats().init();
  penisCollector.init();

  world.sendMessage("\u00a7a[McMMO] \u00a77Bedrock McMMO loaded!");
});

// Player join/leave
world.afterEvents.playerJoin.subscribe((event) => {
  system.runTimeout(() => {
    const player = world.getAllPlayers().find(p => p.name === event.playerName);
    if (player) {
      playerData.loadPlayer(player);
      player.sendMessage("\u00a7a[McMMO] \u00a77Welcome! Use \u00a7e/scriptevent mcmmo:stats\u00a77 for your stats.");
    }
  }, 20);
});

world.afterEvents.playerLeave.subscribe((event) => {
  const playerId = event.playerId;
  feedback.clearPlayer(playerId);
  abilityManager.clearPlayer(playerId);
  skillManager.clearPlayer(playerId);
});

// Script event commands
system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (!event.id.startsWith("mcmmo:")) return;
  if (event.sourceType !== ScriptEventSource.Entity || !event.sourceEntity) return;
  if (event.sourceEntity.typeId !== "minecraft:player") return;

  const player = event.sourceEntity as Player;
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
      showSkillDetail(player, subCommand as SkillType);
      break;
    case "help":
      player.sendMessage("\u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac \u00a7e\u00a7lMcMMO Help \u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac");
      player.sendMessage("\u00a7e/scriptevent mcmmo:stats \u00a77- View all skills");
      player.sendMessage("\u00a7e/scriptevent mcmmo:top \u00a77- Leaderboard");
      player.sendMessage("\u00a7e/scriptevent mcmmo:ability \u00a77- Toggle abilities");
      player.sendMessage("\u00a7e/scriptevent mcmmo:<skill> \u00a77- Skill details");
      break;
    default:
      player.sendMessage("\u00a7c[McMMO] Unknown command. Use \u00a7e/scriptevent mcmmo:help");
  }
});

function showStats(player: Player): void {
  const data = playerData.getData(player);
  const powerLevel = playerData.getPowerLevel(player);

  player.sendMessage("\u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac \u00a7e\u00a7lMcMMO Stats \u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac");
  player.sendMessage(`\u00a77Power Level: \u00a7e${powerLevel}`);
  player.sendMessage("\u00a76------- \u00a77Gathering \u00a76-------");

  const gatheringSkills = [SkillType.Mining, SkillType.Woodcutting, SkillType.Excavation, SkillType.Herbalism, SkillType.Fishing];
  for (const skill of gatheringSkills) {
    const s = data.skills[skill];
    player.sendMessage(`\u00a7a${SKILL_DISPLAY_NAMES[skill]}: \u00a7e${s.level} \u00a77(${s.xp}/${xpToNextLevel(s.level)} XP)`);
  }

  player.sendMessage("\u00a76------- \u00a77Combat \u00a76-------");
  const combatSkills = [SkillType.Swords, SkillType.Axes, SkillType.Archery, SkillType.Unarmed, SkillType.Taming];
  for (const skill of combatSkills) {
    const s = data.skills[skill];
    player.sendMessage(`\u00a7c${SKILL_DISPLAY_NAMES[skill]}: \u00a7e${s.level} \u00a77(${s.xp}/${xpToNextLevel(s.level)} XP)`);
  }

  player.sendMessage("\u00a76------- \u00a77Other \u00a76-------");
  const otherSkills = [SkillType.Acrobatics, SkillType.Repair];
  for (const skill of otherSkills) {
    const s = data.skills[skill];
    player.sendMessage(`\u00a7b${SKILL_DISPLAY_NAMES[skill]}: \u00a7e${s.level} \u00a77(${s.xp}/${xpToNextLevel(s.level)} XP)`);
  }
}

function showLeaderboard(player: Player): void {
  const players = world.getAllPlayers();
  const entries: { name: string; power: number }[] = [];

  for (const p of players) {
    entries.push({ name: p.name, power: playerData.getPowerLevel(p) });
  }

  entries.sort((a, b) => b.power - a.power);

  player.sendMessage("\u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac \u00a7e\u00a7lMcMMO Leaderboard \u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac");
  for (let i = 0; i < Math.min(entries.length, 10); i++) {
    const e = entries[i];
    player.sendMessage(`\u00a77#${i + 1} \u00a7a${e.name} \u00a77- Power Level: \u00a7e${e.power}`);
  }
}

function toggleAbility(player: Player): void {
  const data = playerData.getData(player);
  data.abilityToggle = !data.abilityToggle;
  const state = data.abilityToggle ? "\u00a7aENABLED" : "\u00a7cDISABLED";
  player.sendMessage(`\u00a7e[McMMO] \u00a77Ability activation: ${state}`);
}

function showSkillDetail(player: Player, skillType: SkillType): void {
  const data = playerData.getData(player);
  const skill = data.skills[skillType];
  const name = SKILL_DISPLAY_NAMES[skillType];

  player.sendMessage(`\u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac \u00a7e\u00a7l${name} \u00a76\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac`);
  player.sendMessage(`\u00a77Level: \u00a7e${skill.level}`);
  player.sendMessage(`\u00a77XP: \u00a7e${skill.xp}/${xpToNextLevel(skill.level)}`);

  const level = skill.level;
  switch (skillType) {
    case SkillType.Mining:
      player.sendMessage(`\u00a77Double Drop Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eSuperBreaker \u00a77(Haste III)`);
      break;
    case SkillType.Woodcutting:
      player.sendMessage(`\u00a77Double Drop Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eTree Feller \u00a77(Break entire tree)`);
      break;
    case SkillType.Excavation:
      player.sendMessage(`\u00a77Double Drop Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Treasure Chance: \u00a7a${(0.5 + level * 0.05).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eGiga Drill Breaker \u00a77(Haste III + 3x Treasure)`);
      break;
    case SkillType.Herbalism:
      player.sendMessage(`\u00a77Double Drop Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Green Thumb Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eGreen Terra \u00a77(3x drops + auto-replant)`);
      break;
    case SkillType.Fishing:
      player.sendMessage(`\u00a77Treasure Chance: \u00a7a${(0.5 + level * 0.05).toFixed(1)}%`);
      break;
    case SkillType.Swords:
      player.sendMessage(`\u00a77Bleed Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      player.sendMessage(`\u00a77Counter Attack Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eSerrated Strikes \u00a77(AoE + Bleed)`);
      break;
    case SkillType.Axes:
      player.sendMessage(`\u00a77Critical Strike Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eSkull Splitter \u00a77(AoE 50% damage)`);
      break;
    case SkillType.Archery:
      player.sendMessage(`\u00a77Skill Shot Bonus: \u00a7a+${Math.min(level * 0.05, 50).toFixed(1)}% damage`);
      player.sendMessage(`\u00a77Daze Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      break;
    case SkillType.Unarmed:
      player.sendMessage(`\u00a77Iron Arm Bonus: \u00a7a+${Math.min(level * 0.02, 3).toFixed(1)} damage`);
      player.sendMessage(`\u00a77Disarm Chance: \u00a7a${Math.min(level * 0.033, 33).toFixed(1)}%`);
      player.sendMessage(`\u00a77Arrow Deflect Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      player.sendMessage(`\u00a77Ability: \u00a7eBerserk \u00a77(Strength I + 2x Disarm)`);
      break;
    case SkillType.Taming:
      player.sendMessage(`\u00a77Gore Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      player.sendMessage(`\u00a77Thick Fur (Fire Res): ${level >= 250 ? "\u00a7aUnlocked" : `\u00a7cLevel 250`}`);
      player.sendMessage(`\u00a77Holy Hound (Regen): ${level >= 375 ? "\u00a7aUnlocked" : `\u00a7cLevel 375`}`);
      player.sendMessage(`\u00a77Shock Proof: ${level >= 500 ? "\u00a7aUnlocked" : `\u00a7cLevel 500`}`);
      player.sendMessage(`\u00a77Fast Food Service: ${level >= 50 ? "\u00a7aUnlocked" : `\u00a7cLevel 50`}`);
      break;
    case SkillType.Acrobatics:
      player.sendMessage(`\u00a77Dodge Chance: \u00a7a${Math.min(level * 0.05, 50).toFixed(1)}%`);
      player.sendMessage(`\u00a77Graceful Roll: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}% \u00a77(while sneaking)`);
      break;
    case SkillType.Repair:
      player.sendMessage(`\u00a77Super Repair Chance: \u00a7a${Math.min(level * 0.1, 100).toFixed(1)}%`);
      break;
  }
}
