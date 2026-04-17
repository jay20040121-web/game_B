/**
 * monsterIdMapper.js
 * 根據進化分支 (branch) 與進化階段 (stage) 回傳對應的怪獸 ID。
 * 純函式，不依賴任何 React state。
 *
 * @param {string} branch        - 進化分支字串 (例如 'A', 'F_SOUL', 'WILD_4')
 * @param {number} stage         - 當前進化階段 (1~6)
 * @param {boolean} isDead       - 寵物是否已死亡
 * @param {number} bondValue     - 羈絆值 (用於夢幻解鎖條件)
 * @param {object} soulTagCounts - 個性標籤計數 (用於夢幻解鎖條件)
 * @returns {number} 怪獸 ID
 */
export function getMonsterId(branch, stage, isDead = false, bondValue = 0, soulTagCounts = {}) {
    if (branch.startsWith('WILD_')) {
        return parseInt(branch.split('_')[1]);
    }
    if (isDead) return 92; // Gastly

    if (stage === 1) {
        if (branch === 'G1') return 92; // Gastly
        if (branch === 'G2') return 63; // Abra
        return 132; // Ditto
    }

    if (stage === 2) {
        if (branch.startsWith('B_') && branch.endsWith('_SOUL')) return 10; // Caterpie
        if (branch === 'F_SOUL') return 4;  // Charmander
        if (branch === 'F_VULPIX_SOUL') return 37; // Vulpix
        if (branch === 'W_SQUIRTLE_SOUL' || branch === 'W_SOUL') return 7;  // Squirtle
        if (branch === 'W_DRATINI_SOUL') return 147; // Dratini
        if (branch === 'GR_SOUL') return 1; // Bulbasaur
        if (branch === 'GR_ODDISH_SOUL') return 43; // 木守宮 (Treecko)
        if (branch === 'G1') return 93;  // 鬼斯通
        if (branch === 'G2') return 64;  // 勇吉拉
        if (branch === 'P1') return 109; // 瓦斯彈
        if (branch === 'P2') return 88;  // 臭泥
        if (branch === 'F') return 66;  // 腕力
        if (branch === 'A') return 32;  // 尼多朗
        if (branch === 'B') return 29;  // 尼多蘭
        return 19; // Rattata (C 線)
    }

    if (stage === 3) {
        if (branch === 'B_M_SOUL' || branch === 'B_SOUL') return 11; // Metapod
        if (branch === 'B_H_SOUL') return 14; // Kakuna
        if (branch === 'B_E_SOUL') return 48; // Venonat
        if (branch === 'F_CHARMELEON_SOUL') return 5;  // Charmeleon
        if (branch === 'F_CUBONE_SOUL') return 104;    // Cubone
        if (branch === 'F_GROWLITHE_SOUL') return 58;  // 黑魯加 (Houndoom)
        if (branch === 'F_PONYTA_SOUL') return 77;     // 火岩鼠 (Quilava)
        if (branch === 'F_NINETALES_SOUL') return 38;  // Ninetales
        if (branch === 'W_WARTORTLE_SOUL' || branch === 'W_SOUL') return 8;  // Wartortle
        if (branch === 'W_DRAGONAIR_SOUL') return 148; // Dragonair
        if (branch === 'W_HORSEA_SOUL') return 116; // 海刺龍 (Seadra)
        if (branch === 'W_MAGIKARP_SOUL') return 129; // Magikarp
        if (branch === 'GR_IVYSAUR_SOUL' || branch === 'GR_SOUL') return 2; // Ivysaur
        if (branch === 'GR_PARAS_SOUL') return 46;     // 月桂葉 (Bayleef)
        if (branch === 'GR_BELLSPROUT_SOUL') return 69; // 奇魯莉安 (Kirlia)
        if (branch === 'GR_EXEGGCUTE_SOUL') return 102; // Exeggcute
        if (branch === 'GR_GLOOM_SOUL') return 44;     // 森林蜥蜴 (Grovyle)
        if (branch === 'G1') return 94;  // 耿鬼
        if (branch === 'G2') return 65;  // 胡地
        if (branch === 'P1_SPECIAL') return 82; // Magneton
        if (branch === 'P1') return 110; // 雙彈瓦斯
        if (branch === 'P2_SPECIAL') return 54; // Psyduck
        if (branch === 'P2') return 89;  // 臭臭泥
        if (branch === 'F_FAIL1') return 106; // 飛腿郎
        if (branch === 'F') return 67;  // 豪力
        if (branch === 'A') return 33;  // 尼多利諾
        if (branch === 'B') return 30;  // 尼多娜
        return 20; // Raticate (C 線，Stage 3 壽終)
    }

    if (stage === 4) {
        if (branch === 'B_M2_SOUL' || branch === 'B_M_SOUL' || branch === 'B_SOUL') return 12; // Butterfree
        if (branch === 'B_H2_SOUL') return 15; // Beedrill
        if (branch === 'B_E2_SOUL') return 49; // Venomoth
        if (branch === 'F_CHARIZARD_SOUL') return 6;   // Charizard
        if (branch === 'F_MAGMAR_SOUL') return 126;    // Magmar
        if (branch === 'F_MAROWAK_SOUL') return 105;   // Marowak
        if (branch === 'F_ARCANINE_SOUL') return 59;   // 風速狗 (Arcanine)
        if (branch === 'F_RAPIDASH_SOUL') return 78;   // 火爆獸 (Typhlosion)
        if (branch === 'W_BLASTOISE_SOUL' || branch === 'W_SOUL') return 9;  // Blastoise
        if (branch === 'W_DRAGONITE_SOUL') return 149; // Dragonite
        if (branch === 'W_GYARADOS_SOUL') return 130;  // Gyarados
        if (branch === 'W_LAPRAS_SOUL') return 131;    // Lapras
        if (branch === 'W_SEADRA_SOUL') return 117;    // 刺龍王 (Kingdra)
        if (branch === 'GR_VENUSAUR_SOUL' || branch === 'GR_SOUL') return 3; // Venusaur
        if (branch === 'GR_PARASECT_SOUL') return 47;     // 大竺葵 (Meganium)
        if (branch === 'GR_VILEPLUME_SOUL') return 45;    // 蜥蜴王 (Sceptile)
        if (branch === 'GR_VICTREEBEL_SOUL') return 71;   // 沙奈朵 (Gardevoir)
        if (branch === 'GR_EXEGGUTOR_SOUL') return 103;   // Exeggutor
        if (branch === 'FAIL_ABC') return 137; // 3D獸 (一般線失敗分支)
        if (branch === 'DRAGON') return 147; // 迷你龍 (靈魂龍進化)
        if (branch === 'G1') return 94;  // 耿鬼（G 線最終）
        if (branch === 'G2') return 65;  // 胡地（G 線最終）
        if (branch === 'P1_SPECIAL') return 82; // Magneton
        if (branch === 'P1') return 110; // 雙彈瓦斯（P 線最終）
        if (branch === 'P2_SPECIAL') return 55; // Golduck
        if (branch === 'P2') return 89;  // 臭臭泥（P 線最終）
        if (branch === 'F_FAIL2') return 107; // 快拳郎
        if (branch === 'F') return 68;  // 怪力
        if (branch === 'A') return 34;  // 尼多王
        if (branch === 'B') return 31;  // 尼多后

        // 夢幻解鎖條件：羈絆 >= 80 且最優勢個性為 gentle
        const topTag = Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
        if (bondValue >= 80 && topTag === 'gentle') return 151; // Mew

        return 20; // Raticate（C 線已在 Stage 3 壽終）
    }

    return 132;
}
