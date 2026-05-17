import { useEffect } from 'react';
import { LANGUAGES, translateText } from '../utils/languageSystem';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION']);

const shouldSkipNode = (node) => {
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return true;
    return Boolean(parent.closest('[data-no-translate="true"]'));
};

const translateNode = (node, language) => {
    if (node.nodeType !== Node.TEXT_NODE || shouldSkipNode(node)) return;

    if (node.pixelMonsterOriginalText === undefined) {
        node.pixelMonsterOriginalText = node.nodeValue;
    }

    const original = node.pixelMonsterOriginalText;
    node.nodeValue = language === LANGUAGES.en ? translateText(original, language) : original;
};

const translateTree = (root, language) => {
    if (!root) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
        translateElementAttributes(root, language);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
        translateNode(node, language);
        node = walker.nextNode();
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
        root.querySelectorAll('[placeholder], [title], [aria-label]').forEach((element) => {
            translateElementAttributes(element, language);
        });
    }
};

const translateAttribute = (element, attribute, language) => {
    const value = element.getAttribute(attribute);
    if (!value) return;

    const originalKey = `pixelMonsterOriginal${attribute.replace(/[^a-z0-9]/gi, '')}`;
    if (element.dataset[originalKey] === undefined) {
        element.dataset[originalKey] = value;
    }

    const original = element.dataset[originalKey];
    const nextValue = language === LANGUAGES.en ? translateText(original, language) : original;
    if (element.getAttribute(attribute) !== nextValue) {
        element.setAttribute(attribute, nextValue);
    }
};

const translateElementAttributes = (element, language) => {
    if (!element || element.closest?.('[data-no-translate="true"]')) return;
    translateAttribute(element, 'placeholder', language);
    translateAttribute(element, 'title', language);
    translateAttribute(element, 'aria-label', language);
};

export default function LanguageDomTranslator({ language }) {
    useEffect(() => {
        const root = document.getElementById('root');
        translateTree(root, language);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        translateNode(node, language);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        translateTree(node, language);
                    }
                });

                if (mutation.type === 'attributes') {
                    translateElementAttributes(mutation.target, language);
                }

                if (mutation.type === 'characterData') {
                    const node = mutation.target;
                    const translatedOriginal = translateText(node.pixelMonsterOriginalText || '', language);
                    if (
                        node.pixelMonsterOriginalText !== undefined &&
                        node.nodeValue === translatedOriginal
                    ) {
                        return;
                    }
                    if (node.pixelMonsterOriginalText !== node.nodeValue) {
                        node.pixelMonsterOriginalText = node.nodeValue;
                    }
                    translateNode(node, language);
                }
            });
        });

        if (root) {
            observer.observe(root, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['placeholder', 'title', 'aria-label'],
            });
        }

        document.documentElement.lang = language === LANGUAGES.en ? 'en' : 'zh-Hant';

        return () => observer.disconnect();
    }, [language]);

    return null;
}
