import clsx from 'clsx';
import React, {
    FocusEventHandler,
    InputHTMLAttributes,
    useCallback,
    useEffect,
    useState,
} from 'react';

import styles from './RewardDistribution.module.scss';

function formatValue(v?: number): string {
    if (v === undefined || Number.isNaN(v)) {
        return '';
    }

    return (v / 1000).toFixed(3);
}

function parseValue(v: string): number {
    const parsed = parseFloat(v);

    return Math.round(parsed * 1000);
}

function isValid(v: number): boolean {
    return !Number.isNaN(v) && v <= 100000 && v >= 0;
}

const noOp = () => null;

interface RewardDistributionFieldProps
    extends Pick<
        InputHTMLAttributes<HTMLInputElement>,
        'disabled' | 'className'
    > {
    label: string;
    value: number;
    isInvalid?: boolean;
    onBlur?(v: number): void;
}

export default function RewardDistributionField({
    label,
    className,
    isInvalid = false,
    value,
    onBlur = noOp,
    ...inputProps
}: RewardDistributionFieldProps): JSX.Element {
    const [stringValue, setStringValue] = useState(formatValue(value));

    const handleBlur: FocusEventHandler<HTMLInputElement> = useCallback(
        (e) => {
            const v = parseValue(e.target.value);

            if (isValid(v)) {
                onBlur(v);
            } else {
                setStringValue(formatValue(value));
            }
        },
        [onBlur, value]
    );

    useEffect(() => setStringValue(formatValue(value)), [value]);

    return (
        <label
            className={clsx(
                styles.field,
                isInvalid && styles.fieldInvalid,
                className
            )}
        >
            {label}
            <input
                {...inputProps}
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
                onBlur={handleBlur}
            />
        </label>
    );
}
