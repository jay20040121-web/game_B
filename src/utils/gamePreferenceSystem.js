export const GAME_PREFERENCE_KEYS = {
    defeatTutorialEnabled: 'pixel_monster_defeat_tutorial_enabled',
    petLettersEnabled: 'pixel_monster_pet_letters_enabled',
};

const readBooleanPreference = (key, defaultValue = true) => {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return defaultValue;
        return stored !== 'false';
    } catch {
        return defaultValue;
    }
};

const writeBooleanPreference = (key, value) => {
    try {
        localStorage.setItem(key, value ? 'true' : 'false');
    } catch {
        // Ignore storage errors; the in-memory React state still updates.
    }
};

export const getDefeatTutorialEnabled = () => (
    readBooleanPreference(GAME_PREFERENCE_KEYS.defeatTutorialEnabled, true)
);

export const setDefeatTutorialEnabled = (enabled) => {
    writeBooleanPreference(GAME_PREFERENCE_KEYS.defeatTutorialEnabled, Boolean(enabled));
};

export const getPetLettersEnabled = () => (
    readBooleanPreference(GAME_PREFERENCE_KEYS.petLettersEnabled, true)
);

export const setPetLettersEnabled = (enabled) => {
    writeBooleanPreference(GAME_PREFERENCE_KEYS.petLettersEnabled, Boolean(enabled));
};
