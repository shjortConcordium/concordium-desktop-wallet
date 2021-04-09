import { findEntries } from '../database/AddressBookDao';
import { getNextAccountNonce, getTransactionStatus } from './nodeRequests';
import { getDefaultExpiry, getNow } from './timeHelpers';
import {
    TransactionKindId,
    TransferTransaction,
    SimpleTransfer,
    TransactionEvent,
    TransactionStatus,
    ScheduledTransfer,
    SchedulePoint,
    TransferToEncrypted,
    AccountTransaction,
    TransactionPayload,
    UpdateInstruction,
    UpdateInstructionPayload,
    TimeStampUnit,
} from './types';
import {
    TransactionAccountSignature,
    TransactionCredentialSignature,
} from './transactionTypes';
import {
    getScheduledTransferEnergy,
    getTransactionKindEnergy,
} from './transactionCosts';
import { serializeTransferPayload } from './transactionSerialization';

/**
 * Attempts to find the address in the accounts, and then AddressBookEntries
 * If the address is found, return the name, otherwise returns undefined;
 */
export async function lookupName(address: string): Promise<string | undefined> {
    const entries = await findEntries({ address });
    if (entries.length > 0) {
        return entries[0].name;
    }
    return undefined;
}

/**
 * Attempts to find names on the addresses of the transaction, and adds
 * toAddressName/fromAddressName fields, if successful.
 * returns the potentially modified transaction.
 */
async function attachName(
    transaction: TransferTransaction
): Promise<TransferTransaction> {
    const updatedTransaction = { ...transaction };
    const toName = await lookupName(transaction.toAddress);
    if (toName) {
        updatedTransaction.toAddressName = toName;
    }
    const fromName = await lookupName(transaction.fromAddress);
    if (fromName) {
        updatedTransaction.fromAddressName = fromName;
    }
    return updatedTransaction;
}

/**
 * AttachName for a list of transaction. See attachName.
 */
export async function attachNames(
    transactions: TransferTransaction[]
): Promise<TransferTransaction[]> {
    return Promise.all(transactions.map(attachName));
}

/**
 *  Constructs a, simple transfer, transaction object,
 * Given the fromAddress, toAddress and the amount.
 * @param estimatedEnergyAmount, is the energyAmount on the transaction. If it is not provided, the energyAmount is calculated using only the payload size and transactionKind. Should be used for incomplete payloads, or for transaction types with variable type costs.
 */
async function createTransferTransaction<T extends TransactionPayload>(
    fromAddress: string,
    expiry: bigint = getDefaultExpiry(),
    transactionKind: number,
    payload: T,
    estimatedEnergyAmount?: bigint
) {
    let energyAmount;
    if (!estimatedEnergyAmount) {
        const payloadSize = serializeTransferPayload(transactionKind, payload)
            .length;
        energyAmount = getTransactionKindEnergy(transactionKind, payloadSize);
    } else {
        energyAmount = estimatedEnergyAmount;
    }
    const { nonce } = await getNextAccountNonce(fromAddress);
    const transferTransaction: AccountTransaction<T> = {
        sender: fromAddress,
        nonce,
        energyAmount: energyAmount.toString(),
        expiry,
        transactionKind,
        payload,
    };
    return transferTransaction;
}

/**
 *  Constructs a, simple transfer, transaction object,
 * Given the fromAddress, toAddress and the amount.
 */
export function createSimpleTransferTransaction(
    fromAddress: string,
    amount: BigInt,
    toAddress: string,
    expiry: bigint = getDefaultExpiry()
): Promise<SimpleTransfer> {
    const payload = {
        toAddress,
        amount: amount.toString(),
    };
    return createTransferTransaction(
        fromAddress,
        expiry,
        TransactionKindId.Simple_transfer,
        payload
    );
}

export function createShieldAmountTransaction(
    address: string,
    amount: bigint,
    expiry: bigint = getDefaultExpiry()
): Promise<TransferToEncrypted> {
    const payload = {
        amount: amount.toString(),
    };
    return createTransferTransaction(
        address,
        expiry,
        TransactionKindId.Transfer_to_encrypted,
        payload
    );
}

export async function createUnshieldAmountTransaction(
    address: string,
    amount: BigInt,
    expiry: bigint = getDefaultExpiry()
) {
    const payload = {
        transferAmount: amount.toString(),
    };
    return createTransferTransaction(
        address,
        expiry,
        TransactionKindId.Transfer_to_public,
        payload,
        getTransactionKindEnergy(TransactionKindId.Transfer_to_public) // Supply the energy, so that the cost is not computed using the incomplete payload.
    );
}

export function createRegularIntervalSchedule(
    totalAmount: bigint,
    releases: number,
    starting: number,
    interval: number
): SchedulePoint[] {
    const releaseAmount = totalAmount / BigInt(releases);
    const restAmount = totalAmount % BigInt(releases);
    const schedule = [];
    let timestamp = starting;
    for (let i = 0; i < releases - 1; i += 1) {
        schedule.push({
            amount: releaseAmount.toString(),
            timestamp: timestamp.toString(),
        });
        timestamp += interval;
    }
    schedule.push({
        amount: (releaseAmount + restAmount).toString(),
        timestamp: timestamp.toString(),
    });
    return schedule;
}

/**
 *  Constructs a, simple transfer, transaction object,
 * Given the fromAddress, toAddress and the amount.
 */
export async function createScheduledTransferTransaction(
    fromAddress: string,
    toAddress: string,
    schedule: SchedulePoint[],
    expiry: bigint = getDefaultExpiry()
) {
    const payload = {
        toAddress,
        schedule,
    };

    return createTransferTransaction(
        fromAddress,
        expiry,
        TransactionKindId.Transfer_with_schedule,
        payload,
        getScheduledTransferEnergy(schedule.length)
    );
}

export async function getDataObject(
    transactionHash: string
): Promise<Record<string, TransactionEvent>> {
    const data = (await getTransactionStatus(transactionHash)).getValue();
    if (data === 'null') {
        throw new Error('Unexpected missing data object!');
    }
    return JSON.parse(data);
}

/**
 * Queries the node for the status of the transaction with the provided transaction hash.
 * The polling will continue until the transaction becomes absent or finalized.
 * @param transactionHash the hash of the transaction to get the status for
 * @param pollingIntervalM, optional, interval between polling in milliSeconds, defaults to every 20 seconds.
 */
export async function getStatus(
    transactionHash: string,
    pollingIntervalMs = 20000
): Promise<TransactionStatus> {
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            let response;
            try {
                response = (
                    await getTransactionStatus(transactionHash)
                ).getValue();
            } catch (err) {
                // This happens if the node cannot be reached. Just wait for the next
                // interval and try again.
                return;
            }
            if (response === 'null') {
                clearInterval(interval);
                resolve(TransactionStatus.Rejected);
                return;
            }

            const { status } = JSON.parse(response);
            if (status === 'finalized') {
                clearInterval(interval);
                resolve(TransactionStatus.Finalized);
            }
        }, pollingIntervalMs);
    });
}

export function getScheduledTransferAmount(
    transaction: ScheduledTransfer
): bigint {
    return transaction.payload.schedule.reduce(
        (total, point) => total + BigInt(point.amount),
        0n
    );
}

export function isFailed(transaction: TransferTransaction) {
    return (
        transaction.success === false ||
        transaction.status === TransactionStatus.Rejected
    );
}
/** Used to build a simple TransactionAccountSignature, with only a single signature. */
export function buildTransactionAccountSignature(
    credentialAccountIndex: number,
    signatureIndex: number,
    signature: Buffer
): TransactionAccountSignature {
    const transactionCredentialSignature: TransactionCredentialSignature = {};
    transactionCredentialSignature[signatureIndex] = signature;
    const transactionAccountSignature: TransactionAccountSignature = {};
    transactionAccountSignature[
        credentialAccountIndex
    ] = transactionCredentialSignature;
    return transactionAccountSignature;
}

export const isExpired = (
    transaction: UpdateInstruction<UpdateInstructionPayload>
) => transaction.header.timeout <= getNow(TimeStampUnit.seconds);
