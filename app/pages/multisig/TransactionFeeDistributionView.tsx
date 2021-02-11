import React from 'react';
import { Progress } from 'semantic-ui-react';
import { ColorType, TransactionFeeDistribution } from '../../utils/types';
import updateConstants from '../../constants/updateConstants.json';

interface Props {
    transactionFeeDistribution: TransactionFeeDistribution;
}

/**
 * Displays an overview of a transaction fee distribution transaction payload.
 */
export default function TransactionFeeDistributionView({
    transactionFeeDistribution,
}: Props) {
    const foundationShare =
        updateConstants.rewardFractionResolution -
        (transactionFeeDistribution.baker +
            transactionFeeDistribution.gasAccount);

    return (
        <>
            <Progress
                value={transactionFeeDistribution.baker}
                total={updateConstants.rewardFractionResolution}
                progress="percent"
                label="Baker reward"
                color={ColorType.Blue}
            />
            <Progress
                value={transactionFeeDistribution.gasAccount}
                total={updateConstants.rewardFractionResolution}
                progress="percent"
                label="GAS account share"
                color={ColorType.Teal}
            />
            <Progress
                value={foundationShare}
                total={updateConstants.rewardFractionResolution}
                progress="percent"
                label="Foundation share"
                color={ColorType.Grey}
            />
        </>
    );
}
