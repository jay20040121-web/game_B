import { PET_LETTER_AI_ENDPOINT } from './envConfig';

const REQUEST_TIMEOUT_MS = 12000;

export const isPetLetterAiEnabled = () => Boolean(PET_LETTER_AI_ENDPOINT);

const withTimeout = async (promise, controller) => {
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await promise;
    } finally {
        clearTimeout(timeout);
    }
};

export async function requestAiPetLetter(context, authToken = null) {
    if (!PET_LETTER_AI_ENDPOINT) {
        throw new Error('pet_letter_ai_disabled');
    }

    const controller = new AbortController();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const response = await withTimeout(fetch(PET_LETTER_AI_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(context),
        signal: controller.signal
    }), controller);

    if (!response.ok) {
        let errorCode = `http_${response.status}`;
        try {
            const data = await response.json();
            if (data?.error) {
                errorCode = data.error;
                if (data?.detail) errorCode = `${errorCode}_${String(data.detail).slice(0, 48)}`;
            }
        } catch (error) {
            // Keep the HTTP status fallback when the backend does not return JSON.
        }
        throw new Error(`pet_letter_ai_${errorCode}`);
    }

    const data = await response.json();
    if (!Array.isArray(data?.pages)) {
        throw new Error('pet_letter_ai_invalid_response');
    }
    return data.pages;
}
