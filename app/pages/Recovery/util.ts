import { getAccountInfo } from '~/node/nodeRequests';
import { getAddressFromCredentialId, getCredId } from '~/utils/rustInterface';
import { findAccounts } from '~/database/AccountDao';
import { importAccount } from '~/features/AccountSlice';
import { createNewCredential } from '~/utils/credentialHelper';
import { importCredentials } from '~/features/CredentialSlice';
import {
    Account,
    AccountStatus,
    AccountInfo,
    Global,
    IdentityStatus,
    Policy,
} from '~/utils/types';
import { getCurrentYearMonth } from '~/utils/timeHelpers';
import { insertIdentity } from '~/database/IdentityDao';
import {
    maxCredentialsOnAccount,
    allowedSpacesCredentials,
} from '~/constants/recoveryConstants.json';
import { createAccount } from '~/utils/accountHelpers';
import { getNextCredentialNumber } from '~/database/CredentialDao';

export function getLostIdentityName(identityNumber: number) {
    return `Lost Identity - ${identityNumber}`;
}

/**
 * Creates an placeholder identity,
 * @param walletId the wallet on which the identity is created.
 * @param identityNumber the identity's number on the wallet.
 * @returns the id of the created identity, or the id of the already existing identity
 */
export async function createLostIdentity(
    walletId: number,
    identityNumber: number
): Promise<number> {
    const createdAt = getCurrentYearMonth();
    const validTo = getCurrentYearMonth();
    const identityObject = {
        v: 0,
        value: {
            attributeList: {
                chosenAttributes: {},
                createdAt,
                validTo,
            },
        },
    };

    const identity = {
        name: getLostIdentityName(identityNumber),
        identityNumber,
        identityObject: JSON.stringify(identityObject),
        status: IdentityStatus.Placeholder,
        detail: '',
        codeUri: '',
        identityProvider: '{}',
        randomness: '',
        walletId,
    };

    return (await insertIdentity(identity))[0];
}

interface CredentialIndexAndPolicy {
    credentialIndex?: number;
    policy: Policy;
}

/**
 * Given a credId, and accountInfo, extract the credential corresponding to the credId.
 * N.B. If the credId is not in the accountInfo, we assume that it has been removed.
 * @returns a CredentialIndexAndPolicy object. CredentialIndex is undefined if the credential is not in the accountInfo.
 */
function getCredentialOnChain(
    credId: string,
    accountInfo: AccountInfo
): CredentialIndexAndPolicy {
    const credentialOnChain = Object.entries(
        accountInfo.accountCredentials
    ).find(
        ([, cred]) =>
            (cred.value.contents.credId || cred.value.contents.regId) === credId
    );
    if (!credentialOnChain) {
        return {
            credentialIndex: undefined,
            policy: {
                validTo: getCurrentYearMonth(),
                createdAt: getCurrentYearMonth(),
                revealedAttributes: {},
            },
        };
    }

    return {
        credentialIndex: parseInt(credentialOnChain[0], 10),
        policy: credentialOnChain[1].value.contents.policy,
    };
}

/**
 * Attempts to recover the credential with the given credId.
 * @param credId: credId of the credential, which is to be recovered
 * @param blockHash: block at which the function will look up the account info
 * @param credentialNumber: credential number of the credential on it's identity
 * @param identityId: id of the credential's identity
 * @returns If the credential has existed on chain, returns an object containing the credential and its accounts. If it never existed, returns undefined.
 */
async function recoverCredential(
    credId: string,
    blockHash: string,
    credentialNumber: number,
    identityId: number
) {
    const accountInfo = await getAccountInfo(credId, blockHash);

    if (!accountInfo) {
        return undefined;
    }

    const firstCredential = accountInfo.accountCredentials[0].value.contents;
    const address = await getAddressFromCredentialId(
        firstCredential.regId || firstCredential.credId
    );

    const { credentialIndex, policy } = getCredentialOnChain(
        credId,
        accountInfo
    );

    const account = createAccount(
        identityId,
        address,
        AccountStatus.Confirmed,
        undefined,
        accountInfo.accountThreshold,
        credentialNumber === 0
    );

    const credential = createNewCredential(
        address,
        credentialNumber,
        identityId,
        credentialIndex,
        credId,
        policy
    );

    return { account, credential };
}

/**
 * Attempts to recover credentials on an identity.
 * @param prfKeySeed: Seed of the prfKey of the identity.
 * @param identityId: id of the identity
 * @param blockHash: block at which the function recover credentials
 * @param global: current global parameters
 * @param startingCredNumber: credentialNumber, from which to start attempting to recover credentials from.
 * @param allowedSpaces: Optional parameter that determines how many unused credentialNumbers in a row is tolerated, before the function breaks.
 * @returns Returns an object containing the list of all recovered credentials and their accounts. The length of these lists are always the same, and each account matches the credential on the same index.
 */
export async function recoverCredentials(
    prfKeySeed: string,
    identityId: number,
    blockHash: string,
    global: Global,
    startingCredNumber = 0,
    allowedSpaces = allowedSpacesCredentials
) {
    const credentials = [];
    const accounts = [];
    let credNumber = startingCredNumber;
    let skipsRemaining = allowedSpaces;
    while (skipsRemaining >= 0 && credNumber < maxCredentialsOnAccount) {
        const credId = await getCredId(prfKeySeed, credNumber, global);

        const recovered = await recoverCredential(
            credId,
            blockHash,
            credNumber,
            identityId
        );

        if (!recovered) {
            skipsRemaining -= 1;
        } else {
            skipsRemaining = allowedSpaces;
            credentials.push(recovered.credential);
            accounts.push(recovered.account);
        }
        credNumber += 1;
    }

    return { credentials, accounts };
}

/**
 * Imports a list of accounts, but only non-duplicates.
 */
export async function addAccounts(accounts: Account[]) {
    for (const account of accounts) {
        const { address } = account;
        const accountExists = (await findAccounts({ address })).length > 0;
        if (!accountExists) {
            importAccount(account);
        }
    }
}

/**
 * Attempts to recover credentials on an identity.
 * @param prfKeySeed: Seed of the prfKey of the identity.
 * @param blockHash: block at which the function recover credentials
 * @param global: current global parameters
 * @param identityId: id of the identity
 * @returns Returns the amount of credentials that has been recovered.
 */
export async function recoverFromIdentity(
    prfKeySeed: string,
    blockHash: string,
    global: Global,
    identityId: number
) {
    const nextCredentialNumber = await getNextCredentialNumber(identityId);
    const { credentials, accounts } = await recoverCredentials(
        prfKeySeed,
        identityId,
        blockHash,
        global,
        nextCredentialNumber
    );

    if (accounts.length > 0) {
        await addAccounts(accounts);
    }

    if (credentials.length > 0) {
        await importCredentials(credentials);
    }
    return credentials.length;
}
