import ConcordiumLedgerClient from '../../features/ledger/ConcordiumLedgerClient';
import { getGovernancePath } from '../../features/ledger/Path';
import ProtocolUpdateView from '../../pages/multisig/ProtocolUpdateView';
import UpdateProtocol from '../../pages/multisig/UpdateProtocol';
import { TransactionHandler } from '../transactionTypes';
import {
    isProtocolUpdate,
    ProtocolUpdate,
    UpdateInstruction,
    UpdateInstructionPayload,
} from '../types';
import { serializeProtocolUpdate } from '../UpdateSerialization';

type TransactionType = UpdateInstruction<ProtocolUpdate>;

export default class ProtocolUpdateHandler
    implements TransactionHandler<TransactionType, ConcordiumLedgerClient> {
    confirmType(
        transaction: UpdateInstruction<UpdateInstructionPayload>
    ): TransactionType {
        if (isProtocolUpdate(transaction)) {
            return transaction;
        }
        throw Error('Invalid transaction type was given as input.');
    }

    serializePayload(transaction: TransactionType) {
        return serializeProtocolUpdate(transaction.payload).serialization;
    }

    signTransaction(
        transaction: TransactionType,
        ledger: ConcordiumLedgerClient
    ) {
        const path: number[] = getGovernancePath({ keyIndex: 0, purpose: 0 });
        return ledger.signProtocolUpdate(
            transaction,
            this.serializePayload(transaction),
            path
        );
    }

    view(transaction: TransactionType) {
        return ProtocolUpdateView({ protocolUpdate: transaction.payload });
    }

    update = UpdateProtocol;

    title = 'Foundation Transaction | Update Chain Protocol';
}