const isDesktopBuild = import.meta.env.VITE_DESKTOP === '1';

export const isLocalhost = !isDesktopBuild && typeof window !== "undefined" && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.protocol === 'file:'
);

export const FIRESTORE_COLLECTION = 'users';
export const PEER_PREFIX = isLocalhost ? "gameB_v1_dev_" : "gameB_v1_";
