import React from 'react';

import { EqualRecord } from '~/utils/types';
import { UpdateProps } from '~/utils/transactionTypes';
import {
    RelativeRateField,
    FormRelativeRateField,
} from '../../common/RelativeRateField';
import { commonFieldProps, getCurrentValue } from './util';
import {
    isPositiveNumber,
    validBigIntValues,
    fromExchangeRate,
    RelativeRateValue,
} from '../../common/RelativeRateField/util';

export interface UpdateMicroGtuPerEuroRateFields {
    microGtuPerEuroRate: RelativeRateValue;
}

const fieldNames: EqualRecord<UpdateMicroGtuPerEuroRateFields> = {
    microGtuPerEuroRate: 'microGtuPerEuroRate',
};

export default function UpdateMicroGtuPerEuroRate({
    defaults,
    blockSummary,
}: UpdateProps): JSX.Element | null {
    const exchangeRate = getCurrentValue(blockSummary);
    const currentValue: RelativeRateValue = fromExchangeRate(exchangeRate);

    return (
        <>
            <RelativeRateField
                {...commonFieldProps}
                label="Current micro GTU per euro rate"
                value={currentValue}
                disabled
            />
            <FormRelativeRateField
                {...commonFieldProps}
                name={fieldNames.microGtuPerEuroRate}
                label="New micro GTU per euro rate"
                defaultValue={defaults.microGtuPerEuroRate || currentValue}
                rules={{
                    validate: {
                        isPositiveNumber,
                        validBigIntValues,
                    },
                }}
            />
        </>
    );
}
