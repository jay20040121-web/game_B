const isMagicianTrait = (trait) => trait?.id === 'magician' || trait?.name === '魔術師';

const cloneMove = (move) => {
    if (!move || typeof move !== 'object') return move;
    return { ...move };
};

const cloneUpgrade = (upgrade) => {
    if (!upgrade || typeof upgrade !== 'object') return upgrade;
    return {
        ...upgrade,
        ailments: { ...(upgrade.ailments || {}) }
    };
};

export const applyOpeningTraitEffects = (battleState) => {
    if (!battleState?.player || !battleState?.enemy) return battleState;

    const playerHasMagician = isMagicianTrait(battleState.player.trait);
    const enemyHasMagician = isMagicianTrait(battleState.enemy.trait);
    if (!playerHasMagician && !enemyHasMagician) return battleState;

    const originalPlayerMoves = Array.isArray(battleState.player.moves) ? battleState.player.moves : [];
    const originalEnemyMoves = Array.isArray(battleState.enemy.moves) ? battleState.enemy.moves : [];
    const playerFirstMove = originalPlayerMoves[0] || null;
    const enemyFirstMove = originalEnemyMoves[0] || null;
    const nextPlayerMoves = [...originalPlayerMoves];
    const nextEnemyMoves = [...originalEnemyMoves];
    const originalPlayerUpgrades = battleState.player.moveUpgrades || {};
    const originalEnemyUpgrades = battleState.enemy.moveUpgrades || {};
    const nextPlayerUpgrades = { ...originalPlayerUpgrades };
    const nextEnemyUpgrades = { ...originalEnemyUpgrades };
    const logs = [...(battleState.logs || [])];

    if ((playerHasMagician || enemyHasMagician) && playerFirstMove && enemyFirstMove) {
        nextPlayerMoves[0] = cloneMove(enemyFirstMove);
        nextEnemyMoves[0] = cloneMove(playerFirstMove);
        const playerFirstMoveId = playerFirstMove.id;
        const enemyFirstMoveId = enemyFirstMove.id;
        if (playerFirstMoveId && enemyFirstMoveId) {
            const playerUpgrade = cloneUpgrade(originalPlayerUpgrades[playerFirstMoveId]);
            const enemyUpgrade = cloneUpgrade(originalEnemyUpgrades[enemyFirstMoveId]);
            if (enemyUpgrade) nextPlayerUpgrades[enemyFirstMoveId] = enemyUpgrade;
            else delete nextPlayerUpgrades[enemyFirstMoveId];
            if (playerUpgrade) nextEnemyUpgrades[playerFirstMoveId] = playerUpgrade;
            else delete nextEnemyUpgrades[playerFirstMoveId];
        }
        if (playerHasMagician && enemyHasMagician) {
            logs.push(`雙方魔術師開場觸發！彼此交換了第一招。`);
        } else if (playerHasMagician) {
            logs.push(`魔術師開場觸發！你與對手交換了第一招。`);
        } else {
            logs.push(`對手的魔術師開場觸發！你與對手交換了第一招。`);
        }
    }

    return {
        ...battleState,
        player: {
            ...battleState.player,
            moves: nextPlayerMoves,
            moveUpgrades: nextPlayerUpgrades
        },
        enemy: {
            ...battleState.enemy,
            moves: nextEnemyMoves,
            moveUpgrades: nextEnemyUpgrades
        },
        logs
    };
};
