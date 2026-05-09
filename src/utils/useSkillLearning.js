import { useCallback, useEffect, useRef, useState } from 'react';

const FALLBACK_TYPES = ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy'];

export const useSkillLearning = ({
    advStats,
    derivedLevel,
    getMonsterId,
    skillDatabase,
    speciesBaseStats,
    typeMap,
}) => {
    const previousLevelRef = useRef(derivedLevel);
    const [pendingSkillLearn, setPendingSkillLearn] = useState(null);
    const [skillSelectIdx, setSkillSelectIdx] = useState(0);
    const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
    const [tempReplaceIdx, setTempReplaceIdx] = useState(-1);
    const [isSkillRearrangeOpen, setIsSkillRearrangeOpen] = useState(false);
    const [usingItemIdx, setUsingItemIdx] = useState(-1);

    const resetLevelTracker = useCallback((level) => {
        previousLevelRef.current = level;
    }, []);

    useEffect(() => {
        if (derivedLevel > previousLevelRef.current) {
            if (typeof speciesBaseStats === "object" && typeof skillDatabase === "object") {
                const myId = getMonsterId();
                const speciesData = speciesBaseStats[String(myId)];
                const myType = speciesData?.types || ['normal'];
                let targetType = 'normal';

                if (derivedLevel === 5) {
                    targetType = 'normal';
                } else if (derivedLevel === 10) {
                    const allTypes = typeof TYPE_CHART === "object" ? Object.keys(TYPE_CHART) : FALLBACK_TYPES;
                    const foreignTypes = allTypes.filter(t => !myType.includes(t));
                    targetType = foreignTypes.length > 0 ? foreignTypes[Math.floor(Math.random() * foreignTypes.length)] : 'normal';
                } else {
                    const isStab = Math.random() < 0.7;
                    if (isStab) {
                        targetType = myType[Math.floor(Math.random() * myType.length)];
                    } else {
                        const allTypes = Object.keys(typeMap || {
                            'normal': '普', 'fire': '火', 'water': '水', 'grass': '草', 'electric': '電', 'ice': '冰', 'fighting': '鬥', 'poison': '毒', 'ground': '地', 'flying': '飛', 'psychic': '超', 'bug': '蟲', 'rock': '岩', 'ghost': '鬼', 'dragon': '龍', 'steel': '鋼', 'dark': '惡', 'fairy': '妖'
                        });
                        targetType = allTypes[Math.floor(Math.random() * allTypes.length)];
                    }
                }

                const candidateIds = Object.keys(skillDatabase).filter(k => skillDatabase[k].type === targetType);
                if (candidateIds.length > 0) {
                    const newSkillId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
                    const newSkill = skillDatabase[newSkillId];
                    const currentMoveIds = advStats.moves || [];
                    if (!currentMoveIds.includes(newSkillId)) {
                        setPendingSkillLearn({ level: derivedLevel, skill: newSkill });
                    }
                }
            }
        }
        previousLevelRef.current = derivedLevel;
    }, [advStats.moves, derivedLevel, getMonsterId, skillDatabase, speciesBaseStats, typeMap]);

    return {
        pendingSkillLearn,
        setPendingSkillLearn,
        skillSelectIdx,
        setSkillSelectIdx,
        isConfirmingReplace,
        setIsConfirmingReplace,
        tempReplaceIdx,
        setTempReplaceIdx,
        isSkillRearrangeOpen,
        setIsSkillRearrangeOpen,
        usingItemIdx,
        setUsingItemIdx,
        resetLevelTracker,
    };
};
