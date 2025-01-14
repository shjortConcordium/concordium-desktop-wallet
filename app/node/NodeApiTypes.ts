import {
    ExchangeRate,
    GasRewards,
    RewardFraction,
    TransactionFeeDistribution,
    VerifyKey,
} from '../utils/types';

// This file contains interfaces that matches what is returned
// from the Concordium Node using GRPC.

/**
 * Model that matches what is returned by the node when getting the
 * current consensus status.
 */
export interface ConsensusStatus {
    bestBlock: string;
    bestBlockHeight: number;
    blockArriveLatencyEMA: number;
    blockArriveLatencyEMSD: number;
    blockArrivePeriodEMA: number;
    blockArrivePeriodEMSD: number;
    blockLastArrivedTime: string;
    blockLastReceivedTime: string | null;
    blockReceiveLatencyEMA: number;
    blockReceiveLatencyEMSD: number;
    blockReceivePeriodEMA: number;
    blockReceivePeriodEMSD: number;
    blocksReceivedCount: number;
    blocksVerifiedCount: number;
    epochDuration: number;
    finalizationCount: number;
    finalizationPeriodEMA: number;
    finalizationPeriodEMSD: number;
    genesisBlock: string;
    genesisTime: string;
    lastFinalizedBlock: string;
    lastFinalizedBlockHeight: number;
    lastFinalizedTime: string | null;
    slotDuration: number;
    transactionsPerBlockEMA: number;
    transactionsPerBlockEMSD: number;
    protocolVersion: number;
}

interface UpdateQueue {
    nextSequenceNumber: bigint;
    queue: unknown; // FIXME: add the actual type
}

interface UpdateQueues {
    microGTUPerEuro: UpdateQueue;
    euroPerEnergy: UpdateQueue;
    transactionFeeDistribution: UpdateQueue;
    foundationAccount: UpdateQueue;
    electionDifficulty: UpdateQueue;
    mintDistribution: UpdateQueue;
    protocol: UpdateQueue;
    gasRewards: UpdateQueue;
    bakerStakeThreshold: UpdateQueue;
    rootKeys: UpdateQueue;
    level1Keys: UpdateQueue;
    level2Keys: UpdateQueue;
    addIdentityProvider: UpdateQueue;
}

export interface Authorization {
    threshold: number;
    authorizedKeys: number[];
}

export interface Key {
    verifyKey: string;
    schemeId: string;
}

export interface Authorizations {
    emergency: Authorization;
    microGTUPerEuro: Authorization;
    euroPerEnergy: Authorization;
    transactionFeeDistribution: Authorization;
    foundationAccount: Authorization;
    mintDistribution: Authorization;
    protocol: Authorization;
    paramGASRewards: Authorization;
    bakerStakeThreshold: Authorization;
    electionDifficulty: Authorization;
    addAnonymityRevoker: Authorization;
    addIdentityProvider: Authorization;
    keys: Key[];
}

// The node returns the mint per slot value as a scientific notation String,
// which does not match the serialization format entirely. Therefore
// this interface is required.
export interface MintDistributionNode {
    mintPerSlot: number;
    bakingReward: RewardFraction;
    finalizationReward: RewardFraction;
}

interface RewardParameters {
    transactionFeeDistribution: TransactionFeeDistribution;
    mintDistribution: MintDistributionNode;
    gASRewards: GasRewards;
}

interface ChainParameters {
    microGTUPerEuro: ExchangeRate;
    euroPerEnergy: ExchangeRate;
    rewardParameters: RewardParameters;
    minimumThresholdForBaking: bigint;
    bakerCooldownEpochs: number;
    electionDifficulty: number;
}

export interface KeysWithThreshold {
    keys: VerifyKey[];
    threshold: number;
}

export interface Keys {
    rootKeys: KeysWithThreshold;
    level1Keys: KeysWithThreshold;
    level2Keys: Authorizations;
}

interface Updates {
    chainParameters: ChainParameters;
    keys: Keys;
    updateQueues: UpdateQueues;
}

interface MintEvent {
    tag: string;
    foundationAccount: string;
    mintPlatformDevleopmentCharge: number;
    mintFinalizationReward: number;
    mintBakingReward: number;
}

export interface BlockSummary {
    updates: Updates;
    specialEvents: [MintEvent];
}

export interface AccountNonce {
    nonce: string;
}

export interface BirkParametersBaker {
    bakerAccount: string;
    bakerId: number;
    bakerLotteryPower: number;
}

export interface BirkParametersInfo {
    bakers: BirkParametersBaker[];
    electionDifficulty: number;
    electionNonce: string;
}
