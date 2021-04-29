import React from 'react';
import { useSelector } from 'react-redux';
import { Identity } from '~/utils/types';
import { createCredentialInfo } from '~/utils/rustInterface';
import ConcordiumLedgerClient from '~/features/ledger/ConcordiumLedgerClient';
import SimpleLedger from '~/components/ledger/SimpleLedger';
import { getNextCredentialNumber } from '~/database/CredentialDao';
import { globalSelector } from '~/features/GlobalSlice';
import { CredentialBlob } from './types';

interface Props {
    identity: Identity | undefined;
    address: string;
    attributes: string[];
    setReady: (ready: boolean) => void;
    setCredential: (cred: CredentialBlob) => void;
}

/**
 * Component for creating the credential information. The user is prompted to sign
 * the necessary information to create it as part of the flow.
 */
export default function SignCredential({
    identity,
    address,
    setCredential,
    setReady,
    attributes,
}: Props): JSX.Element {
    const global = useSelector(globalSelector);

    async function sign(
        ledger: ConcordiumLedgerClient,
        setMessage: (message: string) => void
    ) {
        if (!identity) {
            throw new Error(
                'An identity has to be supplied. This is an internal error.'
            );
        } else if (!global) {
            throw new Error(
                'The global information is missing. Make sure that you have previously connected to a node.'
            );
        }

        const credentialNumber = await getNextCredentialNumber(identity.id);

        const credential = await createCredentialInfo(
            identity,
            credentialNumber,
            global,
            attributes,
            setMessage,
            ledger,
            address
        );
        setCredential({
            credential,
            address,
            credentialNumber,
            identityId: identity.id,
        });
        setMessage('Credential generated succesfully!');
        setReady(true);
    }

    return <SimpleLedger ledgerCall={sign} />;
}
