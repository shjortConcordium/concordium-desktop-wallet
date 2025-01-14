import {
    AttributeKeyName,
    AccountInfo,
    CredentialDeploymentInformation,
    EqualRecord,
    Identity,
    CommitmentsRandomness,
} from '~/utils/types';

export interface CredentialBlob {
    credential: CredentialDeploymentInformation;
    randomness: CommitmentsRandomness;
    identityId: number;
    credentialNumber: number;
    address: string;
}

export interface AccountForm {
    identity: Identity;
    address: string;
    accountInfo: AccountInfo;
    accountName: string;
    chosenAttributes: AttributeKeyName[];
    credential: CredentialBlob;
}

export const fieldNames: EqualRecord<AccountForm> = {
    identity: 'identity',
    address: 'address',
    accountInfo: 'accountInfo',
    accountName: 'accountName',
    chosenAttributes: 'chosenAttributes',
    credential: 'credential',
};
