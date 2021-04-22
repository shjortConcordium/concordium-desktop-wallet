import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Account,
    Credential,
    AddedCredential,
    MultiSignatureTransactionStatus,
    MultiSignatureTransaction,
} from '~/utils/types';
import { stringify } from '~/utils/JSONHelper';
import ConcordiumLedgerClient from '~/features/ledger/ConcordiumLedgerClient';
import SimpleLedger from '~/components/ledger/SimpleLedger';
import { globalSelector } from '~/features/GlobalSlice';
import {
    createUpdateCredentialsTransaction,
    buildTransactionAccountSignature,
} from '~/utils/transactionHelpers';
import { getAccountPath } from '~/features/ledger/Path';
import { insert } from '~/database/MultiSignatureProposalDao';
import { addProposal } from '~/features/MultiSignatureSlice';

interface Props {
    setReady: (ready: boolean) => void;
    account: Account | undefined;
    primaryCredential: Credential;
    addedCredentials: AddedCredential[];
    removedCredIds: string[];
    currentCredentialAmount: number;
    newThreshold: number;
    setProposalId: (id: number) => void;
}

/**
 * Creates the accountCredentialUpdate, and prompts the user to sign it.
 */
export default function CreateUpdate({
    setReady,
    account,
    primaryCredential,
    addedCredentials,
    removedCredIds,
    currentCredentialAmount,
    newThreshold,
    setProposalId,
}: Props): JSX.Element {
    const dispatch = useDispatch();
    const global = useSelector(globalSelector);

    async function sign(
        ledger: ConcordiumLedgerClient,
        setMessage: (message: string) => void
    ) {
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

        const transaction = await createUpdateCredentialsTransaction(
            account.address,
            addedCredentials,
            removedCredIds,
            newThreshold,
            currentCredentialAmount,
            account.signatureThreshold
        );

        const signatureIndex = 0;

        const path = getAccountPath({
            identityIndex: primaryCredential.identityId,
            accountIndex: primaryCredential.credentialNumber,
            signatureIndex,
        });

        const signature = await ledger.signUpdateCredentialTransaction(
            transaction,
            path
        );

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

        setMessage('Update generated succesfully!');
        setReady(true);
        setProposalId(entryId);
    }

    return <SimpleLedger ledgerCall={sign} />;
}