export class BaseSkill {
    constructor(ctx) {
        this.ctx = ctx;
    }
    getLevel(player) {
        return this.ctx.playerData.getSkill(player, this.skillType).level;
    }
    addXp(player, amount) {
        this.ctx.playerData.addXp(player, this.skillType, amount);
    }
    isAbilityActive(player) {
        return this.ctx.abilityManager.isAbilityActive(player, this.skillType);
    }
    chanceCheck(player, chancePerLevel, maxChance = 100) {
        const level = this.getLevel(player);
        const chance = Math.min(level * chancePerLevel, maxChance);
        return Math.random() * 100 < chance;
    }
}
