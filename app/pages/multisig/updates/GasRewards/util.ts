import { BlockSummary } from '~/node/NodeApiTypes';
import { GasRewards } from '~/utils/types';
import { rewardFractionResolution } from '~/constants/updateConstants.json';

export const getCurrentValue = (blockSummary: BlockSummary): GasRewards =>
    blockSummary.updates.chainParameters.rewardParameters.gASRewards;

export function toRewardFractions(gasRewards: GasRewards): GasRewards {
    return (Object.keys(gasRewards) as Array<keyof GasRewards>).reduce(
        (a, c) => ({ ...a, [c]: gasRewards[c] * rewardFractionResolution }),
        {} as GasRewards
    );
}
