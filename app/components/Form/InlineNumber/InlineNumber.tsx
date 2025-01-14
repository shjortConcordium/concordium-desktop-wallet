/* eslint-disable react-hooks/exhaustive-deps */
import clsx from 'clsx';
import React, {
    InputHTMLAttributes,
    MouseEventHandler,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { noOp } from '~/utils/basicHelpers';
import { useUpdateEffect } from '~/utils/hooks';
import { scaleFieldWidth } from '~/utils/htmlHelpers';
import {
    formatNumberStringWithDigits,
    trimLeadingZeros as trimLeadingZerosHelper,
} from '~/utils/numberStringHelpers';
import { ClassName } from '~/utils/types';
import { CommonFieldProps } from '../common';

import styles from './InlineNumber.module.scss';

const withTrimLeadingZeros = (f: (v: string | undefined) => string) => (
    v = ''
) => f(trimLeadingZerosHelper(v));

const ensureValidBigInt = (v = ''): string => {
    try {
        BigInt(v);
        return v;
    } catch {
        return '';
    }
};

const ensureValue = (v = '') => v;

const isNumber = <T extends unknown>(v: T | number): v is number =>
    typeof v === 'number';

export interface InlineNumberProps
    extends ClassName,
        Pick<
            InputHTMLAttributes<HTMLInputElement>,
            'disabled' | 'autoFocus' | 'readOnly' | 'title'
        >,
        Pick<CommonFieldProps, 'isInvalid'> {
    /**
     * Amount of digits to ensure in rendered value (e.g. `3` => `0.000`). Defaults to `0`.
     */
    ensureDigits?: number;
    /**
     * Whether to work with floats or integers. If set to a number, value is rounded to amount of digits specified. Defaults to `false`.
     */
    allowFractions?: boolean | number;
    /**
     * Allow value in the form of f.x. 1e-5. Defaults to false.
     */
    allowExponent?: boolean;
    value: string | undefined;
    /**
     * Defaults to `0`. This is the value used if field is unfocused without a value.
     */
    fallbackValue?: number | bigint;
    /**
     * If true, falls back to `fallbackValue` when fields `isInvalid` prop is set to `true` on blur. Defaults to `false`.
     */
    fallbackOnInvalid?: boolean;
    /**
     * Trims leading zeros from value ("01" => "1").
     */
    trimLeadingZeros?: boolean;
    /**
     * If set, clears input when user clicks the field. Defaults to false.
     */
    clearOnClick?: boolean;
    customFormatter?(v?: string): string;
    onChange?(v?: string): void;
    /**
     * As internal formatting functionality is triggered on blur, settings value on blur externally is prone to trigger an infinite loop. Please take caution!
     */
    onBlur?(): void;
    onFocus?(): void;
}

/**
 * Number input that aligns with surrouding content in an inline fashion. Is also available as sub-component on \<Form /\>
 *
 * @example
 * I would like to submit the transaction in <InlineNumber value={value} onChange={setValue} /> releases.
 */
export default function InlineNumber({
    ensureDigits = 0,
    fallbackValue = 0,
    fallbackOnInvalid = false,
    value,
    customFormatter,
    onChange = noOp,
    onBlur = noOp,
    onFocus = noOp,
    allowFractions = false,
    allowExponent = false,
    className,
    isInvalid = false,
    trimLeadingZeros = false,
    clearOnClick = false,
    ...inputProps
}: InlineNumberProps): JSX.Element {
    const format = useMemo(() => {
        let f: (v: string | undefined) => string;

        if (customFormatter !== undefined) {
            f = customFormatter;
        } else if (allowFractions === false && !allowExponent) {
            f = ensureValidBigInt;
        } else if (
            isNumber(allowFractions) ||
            !allowExponent ||
            ensureDigits !== 0
        ) {
            f = formatNumberStringWithDigits(
                ensureDigits,
                isNumber(allowFractions) ? allowFractions : undefined,
                !allowExponent
            );
        } else {
            f = ensureValue;
        }

        return trimLeadingZeros ? withTrimLeadingZeros(f) : f;
    }, [ensureDigits, allowFractions, customFormatter, trimLeadingZeros]);

    const formattedFallback = format(fallbackValue.toString());
    const initialFormatted = useMemo(() => {
        try {
            return format(value) || formattedFallback;
        } catch {
            return formattedFallback;
        }
    }, []);
    const [innerValue, setInnerValue] = useState<string>(initialFormatted);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const ref = useRef<HTMLInputElement>(null);
    useLayoutEffect(() => {
        scaleFieldWidth(ref.current);
    }, [innerValue]);

    const handleBlur = useCallback(() => {
        // Basically ensure correct formatting of field and that field has a value (otherwise it'll be invisible on screen)
        if (!innerValue || (fallbackOnInvalid && isInvalid)) {
            setInnerValue(formattedFallback);
        } else {
            try {
                const formatted = format(value);
                if (formatted !== '') {
                    setInnerValue(formatted);
                }
            } catch {
                // Do nothing..
            }
        }

        setIsFocused(false);
        onBlur();
    }, [
        format,
        onBlur,
        innerValue,
        formattedFallback,
        value,
        fallbackOnInvalid,
        isInvalid,
    ]);

    const handleClick: MouseEventHandler<HTMLInputElement> = useCallback(
        (e) => {
            if (clearOnClick && e.currentTarget.value === formattedFallback) {
                setInnerValue('');
                e.currentTarget.style.width = '6px';
            }
        },
        [formattedFallback, clearOnClick]
    );

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        onFocus();
    }, [onFocus]);

    useEffect(() => {
        onChange(innerValue);
    }, [innerValue]);

    useUpdateEffect(() => {
        if (!isFocused) {
            try {
                setInnerValue(format(value));
            } catch {
                // do nothing.
            }
        }
    }, [value]);

    return (
        <input
            className={clsx(
                styles.input,
                isInvalid && styles.invalid,
                className
            )}
            type="text"
            value={innerValue}
            onChange={(e) => setInnerValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={handleClick}
            ref={ref}
            {...inputProps}
            style={{ width: 5 }} // To prevent initial UI jitter.
        />
    );
}
