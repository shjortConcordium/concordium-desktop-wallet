import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    loadAccounts,
    decryptAccountBalance,
} from '../../features/AccountSlice';
import { globalSelector } from '../../features/GlobalSlice';
import {
    transactionsSelector,
    decryptTransactions,
    loadTransactions,
    viewingShieldedSelector,
} from '../../features/TransactionSlice';
import { Account } from '../../utils/types';
import ConcordiumLedgerClient from '../../features/ledger/ConcordiumLedgerClient';
import SimpleLedger from '../../components/ledger/SimpleLedger';
import { getCredentialsOfAccount } from '~/database/CredentialDao';

interface Props {
    account: Account;
}

/**
 * Wrapper for the ledger component, for decrypting the account'
 * shielded balance and transactions.
 */
export default function DecryptComponent({ account }: Props) {
    const dispatch = useDispatch();
    const transactions = useSelector(transactionsSelector);
    const viewingShielded = useSelector(viewingShieldedSelector);
    const global = useSelector(globalSelector);

    if (!viewingShielded || account.allDecrypted) {
        return null;
    }

    async function ledgerCall(
        ledger: ConcordiumLedgerClient,
        setMessage: (message: string) => void
    ) {
        if (!global) {
            throw new Error('Unexpected missing global object');
        }

        if (!account.identityNumber) {
            throw new Error(
                'The account must have been joined with the identity table, to resolve its identity number'
            );
        }
        setMessage('Please confirm exporting PRF key on device');
        const prfKeySeed = await ledger.getPrfKey(account.identityNumber);
        setMessage('Please wait');
        const prfKey = prfKeySeed.toString('hex');

        // TODO The correct credential can only be found by also using the pairing key.

        const credentialNumber = (
            await getCredentialsOfAccount(account.address)
        ).find((cred) => cred.credentialIndex === 0)?.credentialNumber;

        if (credentialNumber === undefined) {
            throw new Error(
                'Unable to decrypt amounts, because we were unable to find original credential'
            );
        }
        await decryptAccountBalance(prfKey, account, credentialNumber, global);
        await decryptTransactions(
            transactions,
            prfKey,
            credentialNumber,
            global
        );
        await loadTransactions(account, dispatch);
        await loadAccounts(dispatch);
    }

    return <SimpleLedger ledgerCall={ledgerCall} />;
}
