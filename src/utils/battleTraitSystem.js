const clampStage = value => Math.max(-6, Math.min(6, Number(value || 0)));

export const applyOpeningTraitEffects = battleState => {
    if (!battleState?.player || !battleState?.enemy) return battleState;

    let player = { ...battleState.player, statStages: { ...(battleState.player.statStages || {}) } };
    let enemy = { ...battleState.enemy, statStages: { ...(battleState.enemy.statStages || {}) } };
    const logs = [...(battleState.logs || [])];
    const originalPlayerTrait = player.trait || null;
    const originalEnemyTrait = enemy.trait || null;

    // 複製：使用出場瞬間對手原本的特性，避免雙方複製造成循環。
    if (originalPlayerTrait?.id === 'trace' && originalEnemyTrait?.id !== 'trace') {
        player.trait = originalEnemyTrait;
        logs.push(`複製發動！你複製了對手的${originalEnemyTrait?.name || '特性'}。`);
    }
    if (originalEnemyTrait?.id === 'trace' && originalPlayerTrait?.id !== 'trace') {
        enemy.trait = originalPlayerTrait;
        logs.push(`對手的複製發動！取得了${originalPlayerTrait?.name || '特性'}。`);
    }

    // 威嚇：精神力不受威嚇影響。
    if (player.trait?.id === 'intimidate' && enemy.trait?.id !== 'inner-focus') {
        enemy.statStages.atk = clampStage((enemy.statStages.atk || 0) - 1);
        logs.push('威嚇發動！對手的攻擊下降。');
    }
    if (enemy.trait?.id === 'intimidate' && player.trait?.id !== 'inner-focus') {
        player.statStages.atk = clampStage((player.statStages.atk || 0) - 1);
        logs.push('對手的威嚇發動！你的攻擊下降。');
    }

    return { ...battleState, player, enemy, logs };
};