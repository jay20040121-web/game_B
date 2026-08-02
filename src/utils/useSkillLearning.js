import { useCallback, useEffect, useRef, useState } from 'react';
import { getPokemonLevelUpLearnset } from '../monsterData';

export const useSkillLearning = ({
    advStats,
    derivedLevel,
    getMonsterId,
    skillDatabase,
}) => {
    const previousLevelRef = useRef(derivedLevel);
    const previousSpeciesRef = useRef(null);
    const learnQueueRef = useRef([]);
    const [pendingSkillLearnState, setPendingSkillLearnState] = useState(null);
    const [skillSelectIdx, setSkillSelectIdx] = useState(0);
    const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
    const [tempReplaceIdx, setTempReplaceIdx] = useState(-1);
    const [isSkillRearrangeOpen, setIsSkillRearrangeOpen] = useState(false);

    const setPendingSkillLearn = useCallback((valueOrUpdater) => {
        setPendingSkillLearnState(previous => {
            const requested = typeof valueOrUpdater === 'function'
                ? valueOrUpdater(previous)
                : valueOrUpdater;
            if (requested !== null) return requested;
            return learnQueueRef.current.shift() || null;
        });
    }, []);

    const resetLevelTracker = useCallback((level) => {
        previousLevelRef.current = level;
        learnQueueRef.current = [];
        setPendingSkillLearnState(null);
    }, []);

    useEffect(() => {
        const speciesId = String(getMonsterId());
        const previousLevel = previousLevelRef.current;
        const previousSpecies = previousSpeciesRef.current;
        const speciesChanged = previousSpecies !== null && speciesId !== previousSpecies;
        const levelIncreased = derivedLevel > previousLevel;

        if (speciesChanged || levelIncreased) {
            const currentMoves = new Set(advStats.moves || []);
            const queuedMoves = new Set([
                pendingSkillLearnState?.skill?.id,
                ...learnQueueRef.current.map(item => item.skill.id),
            ].filter(Boolean));
            const candidates = getPokemonLevelUpLearnset(speciesId).filter(entry => {
                if (speciesChanged && (entry.level === 0 || entry.level === derivedLevel)) return true;
                return levelIncreased && entry.level > previousLevel && entry.level <= derivedLevel;
            });
            const uniqueCandidates = [...new Map(candidates.map(entry => [entry.moveId, entry])).values()]
                .filter(entry => skillDatabase[entry.moveId] && !currentMoves.has(entry.moveId) && !queuedMoves.has(entry.moveId))
                .map(entry => ({ level: entry.level, skill: skillDatabase[entry.moveId] }));

            if (uniqueCandidates.length > 0) {
                setPendingSkillLearnState(previous => {
                    if (previous) {
                        learnQueueRef.current.push(...uniqueCandidates);
                        return previous;
                    }
                    const [first, ...rest] = uniqueCandidates;
                    learnQueueRef.current.push(...rest);
                    return first;
                });
            }
        }

        previousLevelRef.current = derivedLevel;
        previousSpeciesRef.current = speciesId;
    }, [advStats.moves, derivedLevel, getMonsterId, pendingSkillLearnState?.skill?.id, skillDatabase]);

    return {
        pendingSkillLearn: pendingSkillLearnState,
        setPendingSkillLearn,
        skillSelectIdx,
        setSkillSelectIdx,
        isConfirmingReplace,
        setIsConfirmingReplace,
        tempReplaceIdx,
        setTempReplaceIdx,
        isSkillRearrangeOpen,
        setIsSkillRearrangeOpen,
        resetLevelTracker,
    };
};