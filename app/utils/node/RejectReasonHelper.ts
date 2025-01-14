/**
 * An enum containing all the possible reject reasons that can be
 * received from a node as a response to a transaction submission.
 *
 * This should be kept in sync with the list of reject reasons
 * found here: https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Types/Execution.hs
 *
 * The 'Unknown' rejection is a local rejection reason, and not shared
 * with the node.
 */
export enum RejectReason {
    ModuleNotWF = 'ModuleNotWF',
    ModuleHashAlreadyExists = 'ModuleHashAlreadyExists',
    InvalidAccountReference = 'InvalidAccountReference',
    InvalidInitMethod = 'InvalidInitMethod',
    InvalidReceiveMethod = 'InvalidReceiveMethod',
    InvalidModuleReference = 'InvalidModuleReference',
    InvalidContractAddress = 'InvalidContractAddress',
    RuntimeFailure = 'RuntimeFailure',
    AmountTooLarge = 'AmountTooLarge',
    SerializationFailure = 'SerializationFailure',
    OutOfEnergy = 'OutOfEnergy',
    RejectedInit = 'RejectedInit',
    RejectedReceive = 'RejectedReceive',
    NonExistentRewardAccount = 'NonExistentRewardAccount',
    InvalidProof = 'InvalidProof',
    AlreadyABaker = 'AlreadyABaker',
    NotABaker = 'NotABaker',
    InsufficientBalanceForBakerStake = 'InsufficientBalanceForBakerStake',
    StakeUnderMinimumThresholdForBaking = 'StakeUnderMinimumThresholdForBaking',
    BakerInCooldown = 'BakerInCooldown',
    DuplicateAggregationKey = 'DuplicateAggregationKey',
    NonExistentCredentialID = 'NonExistentCredentialID',
    KeyIndexAlreadyInUse = 'KeyIndexAlreadyInUse',
    InvalidAccountThreshold = 'InvalidAccountThreshold',
    InvalidCredentialKeySignThreshold = 'InvalidCredentialKeySignThreshold',
    InvalidEncryptedAmountTransferProof = 'InvalidEncryptedAmountTransferProof',
    InvalidTransferToPublicProof = 'InvalidTransferToPublicProof',
    EncryptedAmountSelfTransfer = 'EncryptedAmountSelfTransfer',
    InvalidIndexOnEncryptedTransfer = 'InvalidIndexOnEncryptedTransfer',
    ZeroScheduledAmount = 'ZeroScheduledAmount',
    NonIncreasingSchedule = 'NonIncreasingSchedule',
    FirstScheduledReleaseExpired = 'FirstScheduledReleaseExpired',
    ScheduledSelfTransfer = 'ScheduledSelfTransfer',
    InvalidCredentials = 'InvalidCredentials',
    DuplicateCredIDs = 'DuplicateCredIDs',
    NonExistentCredIDs = 'NonExistentCredIDs',
    RemoveFirstCredential = 'RemoveFirstCredential',
    CredentialHolderDidNotSign = 'CredentialHolderDidNotSign',
    NotAllowedMultipleCredentials = 'NotAllowedMultipleCredentials',
    NotAllowedToReceiveEncrypted = 'NotAllowedToReceiveEncrypted',
    NotAllowedToHandleEncrypted = 'NotAllowedToHandleEncrypted',
}

/**
 * Translates a reject reason to its corresponding display text that can be
 * shown to the user.
 * @param rejectReason reason for rejection
 * @returns a displayable version of the rejection
 */
export function rejectReasonToDisplayText(
    rejectReason?: RejectReason | string
) {
    // A rejection reason might not have been received yet, and so we show that
    // to the user.
    if (!rejectReason) {
        return 'Rejection reason is missing';
    }

    if (!(rejectReason in RejectReason)) {
        return rejectReason;
    }

    switch (rejectReason) {
        case RejectReason.ModuleNotWF:
            return 'Smart contract module failed to typecheck';
        case RejectReason.ModuleHashAlreadyExists:
            return 'A module with the same hash already exists';
        case RejectReason.InvalidAccountReference:
            return 'The referenced account does not exist';
        case RejectReason.InvalidInitMethod:
            return 'Invalid Initial method, no such contract found in module';
        case RejectReason.InvalidReceiveMethod:
            return 'Invalid receive function in module, missing receive function in contract';
        case RejectReason.InvalidModuleReference:
            return 'Referenced module does not exists';
        case RejectReason.InvalidContractAddress:
            return 'No smart contract instance exists with the given contract address';
        case RejectReason.RuntimeFailure:
            return 'Runtime failure while executing smart contract';
        case RejectReason.AmountTooLarge:
            return 'Insufficient funds';
        case RejectReason.SerializationFailure:
            return 'The transaction body was malformed';
        case RejectReason.OutOfEnergy:
            return 'The transaction ran out of energy';
        case RejectReason.RejectedInit:
            return 'Contract refused to initialize';
        case RejectReason.RejectedReceive:
            return 'Rejected by contract logic';
        case RejectReason.NonExistentRewardAccount:
            return 'The designated reward account does not exist';
        case RejectReason.InvalidProof:
            return 'Proof that the baker owns relevant private keys is not valid';
        case RejectReason.AlreadyABaker:
            return 'Baker with ID already exists';
        case RejectReason.NotABaker:
            return 'Account is not a baker';
        case RejectReason.InsufficientBalanceForBakerStake:
            return 'Sender account has insufficient balance to cover the requested stake';
        case RejectReason.StakeUnderMinimumThresholdForBaking:
            return 'The amount provided is under the threshold required for becoming a baker';
        case RejectReason.BakerInCooldown:
            return 'Request to make change to the baker while the baker is in the cooldown period';
        case RejectReason.DuplicateAggregationKey:
            return 'Duplicate aggregation key';
        case RejectReason.NonExistentCredentialID:
            return 'Encountered credential ID that does not exist on the account';
        case RejectReason.KeyIndexAlreadyInUse:
            return 'The requested key index is already in use';
        case RejectReason.InvalidAccountThreshold:
            return 'The account threshold would exceed the number of credentials';
        case RejectReason.InvalidCredentialKeySignThreshold:
            return 'The signature threshold would exceed the number of keys of the credential';
        case RejectReason.InvalidEncryptedAmountTransferProof:
            return 'The shielded amount transfer has an invalid proof';
        case RejectReason.InvalidTransferToPublicProof:
            return 'The unshield amount has an invalid proof';
        case RejectReason.EncryptedAmountSelfTransfer:
            return 'An shielded amount transfer from the account to itself is not allowed';
        case RejectReason.InvalidIndexOnEncryptedTransfer:
            return 'The provided shielded transfer index is out of bounds';
        case RejectReason.ZeroScheduledAmount:
            return 'Attempt to transfer 0 GTU with schedule';
        case RejectReason.NonIncreasingSchedule:
            return 'Attempt to transfer amount with non-increasing schedule';
        case RejectReason.FirstScheduledReleaseExpired:
            return 'The first scheduled release is in the past';
        case RejectReason.ScheduledSelfTransfer:
            return 'Attempt to transfer from an account to itself with a schedule';
        case RejectReason.InvalidCredentials:
            return 'One or more of the credentials';
        case RejectReason.DuplicateCredIDs:
            return 'There was a duplicate credential registration id';
        case RejectReason.NonExistentCredIDs:
            return 'The credential registration id does not exist';
        case RejectReason.RemoveFirstCredential:
            return 'First credential of the account cannot be removed';
        case RejectReason.CredentialHolderDidNotSign:
            return 'Credential holder did not sign the credential key update';
        case RejectReason.NotAllowedMultipleCredentials:
            return 'Account is not allowed to have multiple credentials because it has non-zero encrypted balance';
        case RejectReason.NotAllowedToReceiveEncrypted:
            return 'Account is not allowed to receive encrypted transfers because it has multiple credentials';
        case RejectReason.NotAllowedToHandleEncrypted:
            return 'Account is not allowed to handle encrypted transfers because it has multiple credentials';
        default:
            return 'Unknown rejection reason';
    }
}
