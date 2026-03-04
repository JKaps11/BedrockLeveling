const MAX_LEVEL = 1000;
export function xpToNextLevel(level) {
    return 1020 + level * 20;
}
export function totalXpForLevel(level) {
    // Sum of xpToNextLevel(0) + ... + xpToNextLevel(level-1)
    // = sum(1020 + i*20, i=0..level-1) = 1020*level + 20*(level*(level-1)/2)
    return 1020 * level + 10 * level * (level - 1);
}
export function getLevelFromTotalXp(totalXp) {
    let level = 0;
    let remaining = totalXp;
    while (level < MAX_LEVEL) {
        const needed = xpToNextLevel(level);
        if (remaining < needed)
            break;
        remaining -= needed;
        level++;
    }
    return { level, xpIntoLevel: remaining };
}
export function getMaxLevel() {
    return MAX_LEVEL;
}
