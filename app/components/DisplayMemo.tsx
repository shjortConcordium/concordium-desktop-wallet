import React from 'react';
import clsx from 'clsx';

import styles from './Transfers/transferDetails.module.scss';

interface Props {
    memo?: string;
    fallback?: string;
    className?: string;
}

/**
 * Displays a memo. If no memo is given, then the fallback is shown, if neither is given, then the component becomes null.
 */
export default function DisplayMemo({ memo, fallback, className }: Props) {
    if (!memo && !fallback) {
        return null;
    }
    return (
        <>
            <h5 className={clsx(className, styles.title)}>Memo:</h5>
            <p className={clsx('body2 mT0', className, memo || 'textFaded')}>
                {memo || fallback}
            </p>
        </>
    );
}
