import { Buffer } from 'buffer/';
import EventEmitter from 'events';
import {
    closeTransport,
    getLedgerClient,
    subscribeLedger,
} from './ledgerObserverHelper';
import { AccountPathInput } from '~/features/ledger/Path';
import {
    AccountTransaction,
    PublicInformationForIp,
    UnsignedCredentialDeploymentInformation,
    UpdateInstruction,
    ExchangeRate,
    TransactionFeeDistribution,
    FoundationAccount,
    MintDistribution,
    ProtocolUpdate,
    GasRewards,
    BakerStakeThreshold,
    ElectionDifficulty,
    HigherLevelKeyUpdate,
    AuthorizationKeysUpdate,
    UpdateAccountCredentials,
    AddIdentityProvider,
} from '~/utils/types';
import { LedgerCommands } from '~/preload/preloadTypes';

export default function exposedMethods(
    eventEmitter: EventEmitter
): LedgerCommands {
    return {
        getPublicKey: (keypath: number[]) =>
            getLedgerClient().getPublicKey(keypath),
        getPublicKeySilent: (keypath: number[]) =>
            getLedgerClient().getPublicKeySilent(keypath),
        getSignedPublicKey: (keypath: number[]) =>
            getLedgerClient().getSignedPublicKey(keypath),
        getPrivateKeySeeds: (identity: number) =>
            getLedgerClient().getPrivateKeySeeds(identity),
        getPrfKeyRecovery: (identity: number) =>
            getLedgerClient().getPrfKeyRecovery(identity),
        getPrfKeyDecrypt: (identity: number) =>
            getLedgerClient().getPrfKeyDecrypt(identity),
        signTransfer: (transaction: AccountTransaction, keypath: number[]) => {
            return getLedgerClient().signTransfer(transaction, keypath);
        },
        signPublicInformationForIp: (
            publicInfoForIp: PublicInformationForIp,
            accountPathInput: AccountPathInput
        ) => {
            return getLedgerClient().signPublicInformationForIp(
                publicInfoForIp,
                accountPathInput
            );
        },
        signUpdateCredentialTransaction: (
            transaction: UpdateAccountCredentials,
            path: number[]
        ) => {
            return getLedgerClient().signUpdateCredentialTransaction(
                transaction,
                path
            );
        },
        signCredentialDeploymentOnExistingAccount: (
            credentialDeployment: UnsignedCredentialDeploymentInformation,
            address: string,
            keypath: number[]
        ) => {
            return getLedgerClient().signCredentialDeploymentOnExistingAccount(
                credentialDeployment,
                address,
                keypath
            );
        },
        signCredentialDeploymentOnNewAccount: (
            credentialDeployment: UnsignedCredentialDeploymentInformation,
            expiry: bigint,
            keypath: number[]
        ) => {
            return getLedgerClient().signCredentialDeploymentOnNewAccount(
                credentialDeployment,
                expiry,
                keypath
            );
        },
        signMicroGtuPerEuro: (
            transaction: UpdateInstruction<ExchangeRate>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signMicroGtuPerEuro(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signEuroPerEnergy: (
            transaction: UpdateInstruction<ExchangeRate>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signEuroPerEnergy(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signTransactionFeeDistribution: (
            transaction: UpdateInstruction<TransactionFeeDistribution>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signTransactionFeeDistribution(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signFoundationAccount: (
            transaction: UpdateInstruction<FoundationAccount>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signFoundationAccount(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signMintDistribution: (
            transaction: UpdateInstruction<MintDistribution>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signMintDistribution(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signProtocolUpdate: (
            transaction: UpdateInstruction<ProtocolUpdate>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signProtocolUpdate(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signAddIdentityProvider: (
            transaction: UpdateInstruction<AddIdentityProvider>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signAddIdentityProvider(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signGasRewards: (
            transaction: UpdateInstruction<GasRewards>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signGasRewards(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signBakerStakeThreshold: (
            transaction: UpdateInstruction<BakerStakeThreshold>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signBakerStakeThreshold(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signElectionDifficulty: (
            transaction: UpdateInstruction<ElectionDifficulty>,
            serializedPayload: Buffer,
            keypath: number[]
        ) => {
            return getLedgerClient().signElectionDifficulty(
                transaction,
                serializedPayload,
                keypath
            );
        },
        signHigherLevelKeysUpdate: (
            transaction: UpdateInstruction<HigherLevelKeyUpdate>,
            serializedPayload: Buffer,
            keypath: number[],
            INS: number
        ) => {
            return getLedgerClient().signHigherLevelKeysUpdate(
                transaction,
                serializedPayload,
                keypath,
                INS
            );
        },
        signAuthorizationKeysUpdate: (
            transaction: UpdateInstruction<AuthorizationKeysUpdate>,
            serializedPayload: Buffer,
            keypath: number[],
            INS: number
        ) => {
            return getLedgerClient().signAuthorizationKeysUpdate(
                transaction,
                serializedPayload,
                keypath,
                INS
            );
        },
        getAppAndVersion: () => getLedgerClient().getAppAndVersion(),
        subscribe: () => subscribeLedger(eventEmitter),
        closeTransport,
    };
}
