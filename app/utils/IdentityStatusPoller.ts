import {
    AddressBookEntry,
    Credential,
    Dispatch,
    Identity,
    IdentityStatus,
} from './types';
import { getIdObject } from './httpRequests';
import { getAccountsOfIdentity } from '../database/AccountDao';
import { loadIdentities } from '../features/IdentitySlice';
import { loadAccounts } from '../features/AccountSlice';
import { isInitialAccount } from './accountHelpers';
import {
    confirmIdentity,
    getAllIdentities,
    rejectIdentityAndInitialAccount,
} from '../database/IdentityDao';
import { loadCredentials } from '~/features/CredentialSlice';
import { loadAddressBook } from '~/features/AddressBookSlice';

/**
 * Poll the identity provider for an identity until the identity and initial account either
 * are confirmed as being created, or until the identity provider returns an error for the
 * identity creation. If confirmed the identity object is received and used to update
 * the identity and initial account in the database, and if failed then the identity is
 * marked as rejected.
 */
export async function confirmIdentityAndInitialAccount(
    dispatch: Dispatch,
    identityName: string,
    identityId: number,
    accountName: string,
    location: string
): Promise<void> {
    const idObjectResponse = await getIdObject(location);

    // The identity provider failed the identity creation request. Clean up the
    // identity and account in the database and refresh the state.
    if (idObjectResponse.error) {
        await rejectIdentityAndInitialAccount(identityId);
        await loadIdentities(dispatch);
        await loadAccounts(dispatch);
        return;
    }

    // An identity object was received, so the identity has been created
    // by the provider. Update the corresponding state in the database.
    const { token } = idObjectResponse;
    const { accountAddress } = token;
    const credential = token.credential.value.credential.contents;

    const credentialToStore: Credential = {
        credId: credential.credId || credential.regId,
        policy: JSON.stringify(credential.policy),
        accountAddress,
        credentialNumber: 0,
        credentialIndex: 0,
        identityId,
    };
    const addressBookEntry: AddressBookEntry = {
        name: accountName,
        address: accountAddress,
        note: `Initial account of identity: ${identityName}`,
        readOnly: true,
    };

    await confirmIdentity(
        identityId,
        JSON.stringify(token.identityObject),
        accountAddress,
        credentialToStore,
        addressBookEntry
    );

    // Update the state with the changes made in the database.
    loadIdentities(dispatch);
    loadAccounts(dispatch);
    loadCredentials(dispatch);
    loadAddressBook(dispatch);
}

async function findInitialAccount(identity: Identity) {
    const accounts = await getAccountsOfIdentity(identity.id);
    return accounts.find(isInitialAccount);
}

export async function resumeIdentityStatusPolling(
    identity: Identity,
    dispatch: Dispatch
) {
    const { name: identityName, codeUri: location, id } = identity;
    const initialAccount = await findInitialAccount(identity);
    if (!initialAccount) {
        throw new Error('Unexpected missing initial account.');
    }
    const { name: accountName } = initialAccount;
    return confirmIdentityAndInitialAccount(
        dispatch,
        identityName,
        id,
        accountName,
        location
    );
}

export default async function listenForIdentityStatus(dispatch: Dispatch) {
    const identities = await getAllIdentities();
    identities
        .filter((identity) => identity.status === IdentityStatus.Pending)
        .forEach((identity) => resumeIdentityStatusPolling(identity, dispatch));
}
