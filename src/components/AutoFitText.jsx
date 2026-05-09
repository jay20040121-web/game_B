import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

export default function AutoFitText({
    children,
    as: Tag = 'span',
    className = '',
    style = {},
    minFontSize = 8,
    maxFontSize = 14,
    lineHeight = 1.1,
    singleLine = true,
}) {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

    const fit = useCallback(() => {
        const container = containerRef.current;
        const text = textRef.current;
        if (!container || !text) return;

        const availableWidth = container.clientWidth;
        const availableHeight = container.clientHeight;
        if (!availableWidth) return;

        let low = minFontSize;
        let high = maxFontSize;
        let best = minFontSize;

        while (low <= high) {
            const mid = (low + high) / 2;
            text.style.fontSize = `${mid}px`;
            text.style.lineHeight = String(lineHeight);
            text.style.whiteSpace = singleLine ? 'nowrap' : 'normal';

            const fitsWidth = text.scrollWidth <= availableWidth;
            const fitsHeight = singleLine || !availableHeight ? true : text.scrollHeight <= availableHeight;

            if (fitsWidth && fitsHeight) {
                best = mid;
                low = mid + 0.5;
            } else {
                high = mid - 0.5;
            }
        }

        setFontSize(best);
    }, [lineHeight, maxFontSize, minFontSize, singleLine]);

    useLayoutEffect(() => {
        fit();
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return undefined;

        const observer = new ResizeObserver(() => fit());
        observer.observe(container);
        return () => observer.disconnect();
    }, [children, fit]);

    return (
        <Tag ref={containerRef} className={className} style={{ ...style, minWidth: 0, overflow: 'hidden' }}>
            <span
                ref={textRef}
                style={{
                    display: 'block',
                    width: '100%',
                    minWidth: 0,
                    fontSize: `${fontSize}px`,
                    lineHeight,
                    whiteSpace: singleLine ? 'nowrap' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {children}
            </span>
        </Tag>
    );
}
