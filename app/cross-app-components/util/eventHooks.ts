import { RefCallback, useCallback, useLayoutEffect, useState } from 'react';

/**
 * @description
 * Handle clicks outside of element. Bind returned ref callback to element acting as bounding box.
 *
 * @example
 * const box = useDetectClickOutside(handleClickOutside);
 *
 * <div ref={box}>
 *   Click outside to trigger handler
 * </div>
 */
export function useDetectClickOutside<TElement extends HTMLElement>(
    onClickOutside: () => void
): RefCallback<TElement | null> {
    const [ref, setRef] = useState<TElement | null>();

    const handleClick = useCallback(
        (e: MouseEvent) => {
            if (ref && !ref?.contains(e.target as Node)) {
                onClickOutside();
            }
        },
        [onClickOutside, ref]
    );

    useLayoutEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [handleClick]);

    return (instance) => setRef(instance);
}

/**
 * @description
 * Add keypress eventhandler to component.
 *
 * @example
 * function Component() {
 *   useKeyPress((e) => switch(e.key) ...)
 * }
 */
export function useKeyPress(handleKeyPress: (e: KeyboardEvent) => void) {
    useLayoutEffect(() => {
        document.addEventListener('keyup', handleKeyPress, true);
        return () => {
            document.removeEventListener('keyup', handleKeyPress);
        };
    }, [handleKeyPress]);
}