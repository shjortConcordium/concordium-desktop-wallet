/* eslint-disable react-hooks/exhaustive-deps */
import clsx from 'clsx';
import React, { InputHTMLAttributes } from 'react';

import {
    fractionResolutionToPercentage,
    percentageToFractionResolution,
} from '~/utils/rewardFractionHelpers';
import { noOp } from '~/utils/basicHelpers';
import InlineNumber from '~/components/Form/InlineNumber';

import styles from './RewardDistribution.module.scss';

function toPercentage(v = 0): number {
    return fractionResolutionToPercentage(v);
}

function toFractionResolution(v = 0): number {
    return Math.round(percentageToFractionResolution(v));
}

// function isValid(v: number): boolean {
//     return !Number.isNaN(v) && v <= fractionResolution && v >= 0;
// }

interface RewardDistributionFieldProps
    extends Pick<
        InputHTMLAttributes<HTMLInputElement>,
        'disabled' | 'className'
    > {
    label: string;
    value: number;
    isInvalid?: boolean;
    onChange?(v: number): void;
    onBlur?(): void;
    onFocus?(): void;
}

export default function RewardDistributionField({
    label,
    className,
    isInvalid = false,
    value,
    onChange = noOp,
    onFocus = noOp,
    onBlur = noOp,
    ...inputProps
}: RewardDistributionFieldProps): JSX.Element {
    const { disabled } = inputProps;

    return (
        <label
            className={clsx(
                styles.field,
                isInvalid && styles.fieldInvalid,
                disabled && styles.fieldDisabled,
                className
            )}
        >
            <span className={styles.fieldTitle}>{label}</span>
            <div className={styles.inputWrapper}>
                <InlineNumber
                    onChange={(v) => onChange(toFractionResolution(v))}
                    value={toPercentage(value)}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    disabled={disabled}
                    allowFractions
                    ensureDigits={3}
                />
                %
            </div>
        </label>
    );
}
