import React from 'react';
import { push } from 'connected-react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
    Account,
    AccountTransaction,
    Credential,
    MultiSignatureTransactionStatus,
    MultiSignatureTransaction,
} from '~/utils/types';
import { stringify } from '~/utils/JSONHelper';
import ConcordiumLedgerClient from '~/features/ledger/ConcordiumLedgerClient';
import { globalSelector } from '~/features/GlobalSlice';
import { findAccountTransactionHandler } from '~/utils/transactionHandlers/HandlerFinder';
import { insert } from '~/database/MultiSignatureProposalDao';
import { addProposal } from '~/features/MultiSignatureSlice';
import { buildTransactionAccountSignature } from '~/utils/transactionHelpers';
import SignTransactionColumn from '../SignTransactionProposal/SignTransaction';
import { selectedProposalRoute } from '~/utils/routerHelper';

interface Props {
    transaction: AccountTransaction;
    account: Account | undefined;
    primaryCredential: Credential;
}

/**
 * Prompts the user to sign the transaction.
 */
export default function SignTransaction({
    transaction,
    account,
    primaryCredential,
}: Props): JSX.Element {
    const dispatch = useDispatch();
    const global = useSelector(globalSelector);

    async function sign(ledger: ConcordiumLedgerClient) {
        if (!account || !global) {
            throw new Error('unexpected missing global/account');
        }
        if (
            primaryCredential.identityId === undefined ||
            primaryCredential.credentialNumber === undefined ||
            primaryCredential.credentialIndex === undefined
        ) {
            throw new Error(
                'Unable to sign transaction, because given credential was not local and deployed.'
            );
        }
        const path = {
            identityIndex: primaryCredential.identityId,
            accountIndex: primaryCredential.credentialNumber,
            signatureIndex: 0,
        };

        const handler = findAccountTransactionHandler(
            transaction.transactionKind
        );
        const signature = await handler.signTransaction(
            transaction,
            ledger,
            path
        );

        const signatureIndex = 0;
        const multiSignatureTransaction: Partial<MultiSignatureTransaction> = {
            // The JSON serialization of the transaction
            transaction: stringify({
                ...transaction,
                signatures: buildTransactionAccountSignature(
                    primaryCredential.credentialIndex,
                    signatureIndex,
                    signature
                ),
            }),
            // The minimum required signatures for the transaction
            // to be accepted on chain.
            threshold: account.signatureThreshold,
            // The current state of the proposal
            status: MultiSignatureTransactionStatus.Open,
        };

        // Save to database and use the assigned id to update the local object.
        const entryId = (await insert(multiSignatureTransaction))[0];
        multiSignatureTransaction.id = entryId;

        // Set the current proposal in the state to the one that was just generated.
        dispatch(addProposal(multiSignatureTransaction));

        dispatch(push(selectedProposalRoute(entryId)));
    }

    return <SignTransactionColumn signingFunction={sign} />;
}
