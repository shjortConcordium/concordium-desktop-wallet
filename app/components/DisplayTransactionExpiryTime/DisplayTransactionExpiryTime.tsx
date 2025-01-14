import React, { ReactNode } from 'react';
import { getFormattedDateString, subtractHours } from '~/utils/timeHelpers';
import styles from './DisplayTransactionExpiryTime.module.scss';

type Props = {
    expiryTime: Date | undefined;
    placeholder?: ReactNode;
};

export default function DisplayTransactionExpiryTime({
    expiryTime,
    placeholder,
}: Props) {
    return (
        <>
            <p className={styles.title}>Transaction expiry time</p>
            <p className={styles.value}>
                {expiryTime === undefined
                    ? placeholder
                    : getFormattedDateString(expiryTime)}
            </p>
            {expiryTime === undefined ? null : (
                <p className={styles.note}>
                    Note: A transaction can only be submitted in the 2 hours
                    before the expiry <br /> (
                    {getFormattedDateString(subtractHours(2, expiryTime))})
                </p>
            )}
        </>
    );
}
