import { world, system } from "@minecraft/server";
import { SkillType, createDefaultSkillsData } from "../types/index.js";
import { xpToNextLevel } from "./XpFormula.js";
const DATA_PROPERTY = "mcmmo:data";
const SAVE_INTERVAL_TICKS = 1200; // 60 seconds
export class PlayerDataManager {
    constructor(feedback) {
        this.feedback = feedback;
        this.cache = new Map();
        this.dirty = new Set();
    }
    init() {
        system.runInterval(() => {
            this.saveAllDirty();
        }, SAVE_INTERVAL_TICKS);
    }
    loadPlayer(player) {
        const existing = this.cache.get(player.id);
        if (existing)
            return existing;
        let data;
        try {
            const raw = player.getDynamicProperty(DATA_PROPERTY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Ensure all skills exist (in case new skills were added)
                const defaultData = createDefaultSkillsData();
                for (const skill of Object.values(SkillType)) {
                    if (!parsed.skills[skill]) {
                        parsed.skills[skill] = defaultData.skills[skill];
                    }
                }
                if (parsed.abilityToggle === undefined)
                    parsed.abilityToggle = true;
                data = parsed;
            }
            else {
                data = createDefaultSkillsData();
            }
        }
        catch {
            data = createDefaultSkillsData();
        }
        this.cache.set(player.id, data);
        return data;
    }
    unloadPlayer(player) {
        this.savePlayer(player);
        this.cache.delete(player.id);
        this.dirty.delete(player.id);
    }
    getData(player) {
        return this.cache.get(player.id) ?? this.loadPlayer(player);
    }
    getSkill(player, skill) {
        return this.getData(player).skills[skill];
    }
    addXp(player, skill, amount) {
        if (amount <= 0)
            return;
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
    savePlayer(player) {
        const data = this.cache.get(player.id);
        if (!data)
            return;
        try {
            player.setDynamicProperty(DATA_PROPERTY, JSON.stringify(data));
        }
        catch {
            // Player may have left
        }
        this.dirty.delete(player.id);
    }
    saveAllDirty() {
        for (const playerId of this.dirty) {
            const player = world.getAllPlayers().find(p => p.id === playerId);
            if (player) {
                this.savePlayer(player);
            }
        }
    }
    getPowerLevel(player) {
        const data = this.getData(player);
        let total = 0;
        for (const skill of Object.values(SkillType)) {
            total += data.skills[skill].level;
        }
        return total;
    }
}
