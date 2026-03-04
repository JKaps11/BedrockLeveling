export var SkillType;
(function (SkillType) {
    SkillType["Mining"] = "mining";
    SkillType["Woodcutting"] = "woodcutting";
    SkillType["Excavation"] = "excavation";
    SkillType["Herbalism"] = "herbalism";
    SkillType["Fishing"] = "fishing";
    SkillType["Swords"] = "swords";
    SkillType["Axes"] = "axes";
    SkillType["Archery"] = "archery";
    SkillType["Unarmed"] = "unarmed";
    SkillType["Taming"] = "taming";
    SkillType["Acrobatics"] = "acrobatics";
    SkillType["Repair"] = "repair";
})(SkillType || (SkillType = {}));
export function createDefaultSkillsData() {
    const skills = {};
    for (const skill of Object.values(SkillType)) {
        skills[skill] = { level: 0, xp: 0 };
    }
    return { skills, abilityToggle: true };
}
export const SKILL_DISPLAY_NAMES = {
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
