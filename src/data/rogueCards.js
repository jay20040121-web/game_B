/**
 * rogueCards.js
 * 聯盟大賽肉鴿元素 - 強化卡片清單
 * 
 * 每一張卡片包含：
 * - id: 唯一識別碼
 * - name: 卡片名稱
 * - desc: 卡片描述
 * - rarity: 稀有度 (1-5)
 * - type: 'stat' | 'special' | 'heal'
 * - value: 強化數值 (倍率)
 */

export const ROGUE_CARDS = [
    // --- 基礎屬性類 (倍數成長) ---
    {
        id: 'hp_up_1',
        name: '生命泉水',
        desc: '最大生命值提升 15%',
        rarity: 1,
        type: 'stat',
        stat: 'hp',
        value: 1.15
    },
    {
        id: 'atk_up_1',
        name: '鋒利磨刀石',
        desc: '攻擊力提升 15%',
        rarity: 1,
        type: 'stat',
        stat: 'atk',
        value: 1.15
    },
    {
        id: 'def_up_1',
        name: '堅固護甲',
        desc: '防禦力提升 15%',
        rarity: 1,
        type: 'stat',
        stat: 'def',
        value: 1.15
    },
    {
        id: 'spd_up_1',
        name: '輕盈之羽',
        desc: '速度提升 15%',
        rarity: 1,
        type: 'stat',
        stat: 'spd',
        value: 1.15
    },

    // --- 特殊機制類 (倍數成長 / 效果疊加) ---
    {
        id: 'vampire_1',
        name: '吸血鬼之牙',
        desc: '攻擊吸血率提升 20% (可疊加倍增)',
        rarity: 3,
        type: 'special',
        effect: 'lifesteal',
        value: 0.2
    },
    {
        id: 'thorns_1',
        name: '棘刺外殼',
        desc: '受到傷害時反射 25% 傷害',
        rarity: 2,
        type: 'special',
        effect: 'reflect',
        value: 0.25
    },
    {
        id: 'shield_start',
        name: '守護者之盾',
        desc: '戰鬥開始獲得 30% 最大生命值的護盾',
        rarity: 2,
        type: 'special',
        effect: 'shield',
        value: 0.3
    },
    {
        id: 'haste_1',
        name: '先制戰術',
        desc: '第一回合造成的傷害提升 50%',
        rarity: 3,
        type: 'special',
        effect: 'haste',
        value: 1.5
    },

    // --- 獎勵加成類 (影響冠軍附魔階段) ---
    {
        id: 'reroll_dice',
        name: '重來骰子',
        desc: '冠軍附魔階段可重新刷新選項 (可疊加次數)',
        rarity: 2,
        type: 'reward',
        effect: 'reroll',
        value: 1
    },
    {
        id: 'focus_acc',
        name: '專注命中',
        desc: '冠軍附魔出現「鷹眼」機率提高 (可疊加)',
        rarity: 2,
        type: 'reward',
        effect: 'focus_acc',
        value: 1
    },
    {
        id: 'focus_spd',
        name: '專注速度',
        desc: '冠軍附魔出現「迅捷」機率提高 (可疊加)',
        rarity: 2,
        type: 'reward',
        effect: 'focus_spd',
        value: 1
    }
];
