import React from 'react';
import BakerStakeThresholdView from '~/pages/multisig/updates/BakerStakeThreshold/BakerStakeThresholdView';
import UpdateBakerStakeThreshold, {
    UpdateBakerStakeThresholdFields,
} from '~/pages/multisig/updates/BakerStakeThreshold/UpdateBakerStakeThreshold';
import ConcordiumLedgerClient from '../../features/ledger/ConcordiumLedgerClient';
import { getGovernanceLevel2Path } from '../../features/ledger/Path';
import { createUpdateMultiSignatureTransaction } from '../MultiSignatureTransactionHelper';
import { Authorizations, BlockSummary } from '../../node/NodeApiTypes';
import { UpdateInstructionHandler } from '../transactionTypes';
import {
    UpdateInstruction,
    isBakerStakeThreshold,
    BakerStakeThreshold,
    MultiSignatureTransaction,
    UpdateType,
} from '../types';
import { serializeBakerStakeThreshold } from '../UpdateSerialization';
import UpdateHandlerBase from './UpdateHandlerBase';

const TYPE = 'Update Baker Stake Threshold';

type TransactionType = UpdateInstruction<BakerStakeThreshold>;

export default class BakerStakeThresholdHandler
    extends UpdateHandlerBase<TransactionType>
    implements
        UpdateInstructionHandler<TransactionType, ConcordiumLedgerClient> {
    constructor() {
        super(TYPE, isBakerStakeThreshold);
    }

    async createTransaction(
        blockSummary: BlockSummary,
        { threshold: bakerStakeThreshold }: UpdateBakerStakeThresholdFields,
        effectiveTime: bigint,
        expiryTime: bigint
    ): Promise<Partial<MultiSignatureTransaction> | undefined> {
        if (!blockSummary) {
            return undefined;
        }

        const sequenceNumber =
            blockSummary.updates.updateQueues.bakerStakeThreshold
                .nextSequenceNumber;
        const {
            threshold,
        } = blockSummary.updates.keys.level2Keys.bakerStakeThreshold;

        return createUpdateMultiSignatureTransaction(
            { threshold: BigInt(bakerStakeThreshold) },
            UpdateType.UpdateBakerStakeThreshold,
            sequenceNumber,
            threshold,
            effectiveTime,
            expiryTime
        );
    }

    serializePayload(transaction: TransactionType) {
        return serializeBakerStakeThreshold(transaction.payload);
    }

    signTransaction(
        transaction: TransactionType,
        ledger: ConcordiumLedgerClient
    ) {
        const path: number[] = getGovernanceLevel2Path();
        return ledger.signBakerStakeThreshold(
            transaction,
            this.serializePayload(transaction),
            path
        );
    }

    view(transaction: TransactionType) {
        return (
            <BakerStakeThresholdView
                bakerStakeThreshold={transaction.payload}
            />
        );
    }

    getAuthorization(authorizations: Authorizations) {
        return authorizations.bakerStakeThreshold;
    }

    update = UpdateBakerStakeThreshold;
}
