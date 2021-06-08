import React from 'react';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import DoubleCheckmarkIcon from '@resources/svg/double-grey-checkmark.svg';
import CheckmarkIcon from '@resources/svg/grey-checkmark.svg';
import Warning from '@resources/svg/warning.svg';
import { abs } from '~/utils/basicHelpers';
import { parseTime } from '~/utils/timeHelpers';
import { getGTUSymbol, displayAsGTU } from '~/utils/gtu';
import {
    TransferTransaction,
    TransactionStatus,
    TransactionKindString,
    Account,
} from '~/utils/types';
import { chosenAccountSelector } from '~/features/AccountSlice';
import { viewingShieldedSelector } from '~/features/TransactionSlice';
import SidedRow from '~/components/SidedRow';
import {
    isFailed,
    isTransferKind,
    isRewardKind,
} from '~/utils/transactionHelpers';
import styles from './Transactions.module.scss';

const isInternalTransfer = (transaction: TransferTransaction) =>
    [
        TransactionKindString.TransferToEncrypted,
        TransactionKindString.TransferToPublic,
    ].includes(transaction.transactionKind);

const isGreen = (
    transaction: TransferTransaction,
    viewingShielded: boolean,
    isOutgoingTransaction: boolean
) => {
    const kind = transaction.transactionKind;
    if (TransactionKindString.TransferToEncrypted === kind) {
        return viewingShielded;
    }
    if (TransactionKindString.TransferToPublic === kind) {
        return (
            !viewingShielded &&
            BigInt(transaction.subtotal) > BigInt(transaction.cost)
        );
    }
    return !isOutgoingTransaction;
};

function determineOutgoing(transaction: TransferTransaction, account: Account) {
    return transaction.fromAddress === account.address;
}

function getName(
    transaction: TransferTransaction,
    isOutgoingTransaction: boolean
) {
    if (isInternalTransfer(transaction)) {
        return '';
    }
    if (isOutgoingTransaction) {
        // Current Account is the sender
        if (transaction.toAddressName !== undefined) {
            return transaction.toAddressName;
        }
        return transaction.toAddress.slice(0, 6);
    }
    if (transaction.fromAddressName !== undefined) {
        return transaction.fromAddressName;
    }
    return transaction.fromAddress.slice(0, 6);
}

function buildOutgoingAmountStrings(subtotal: bigint, fee: bigint) {
    return {
        amount: `${displayAsGTU(-(subtotal + fee))}`,
        amountFormula: `${displayAsGTU(BigInt(subtotal))} + ${displayAsGTU(
            fee
        )} Fee`,
    };
}

function buildCostString(fee: bigint) {
    return {
        amount: `${displayAsGTU(-fee)}`,
        amountFormula: `${displayAsGTU(fee)} Fee`,
    };
}

function buildCostFreeAmountString(amount: bigint, absolute = false) {
    const displayAmount = absolute ? abs(amount) : amount;
    return {
        amount: `${displayAsGTU(displayAmount)}`,
        amountFormula: '',
    };
}

function parseShieldedAmount(
    transaction: TransferTransaction,
    isOutgoingTransaction: boolean
) {
    if (transaction.decryptedAmount) {
        if (isInternalTransfer(transaction)) {
            return buildCostFreeAmountString(
                BigInt(transaction.decryptedAmount)
            );
        }
        if (
            transaction.transactionKind ===
            TransactionKindString.EncryptedAmountTransfer
        ) {
            return buildCostFreeAmountString(
                BigInt(transaction.decryptedAmount),
                !isOutgoingTransaction
            );
        }
        return buildCostFreeAmountString(BigInt(transaction.decryptedAmount));
    }
    const negative = isOutgoingTransaction ? '-' : '';
    return {
        amount: `${negative} ${getGTUSymbol()} ?`,
        amountFormula: '',
    };
}

function parseAmount(
    transaction: TransferTransaction,
    isOutgoingTransaction: boolean
) {
    if (isTransferKind(transaction.transactionKind)) {
        if (isOutgoingTransaction) {
            const cost = BigInt(transaction.cost || '0');
            if (
                transaction.transactionKind ===
                TransactionKindString.EncryptedAmountTransfer
            ) {
                return {
                    amount: `${displayAsGTU(-cost)}`,
                    amountFormula: `${displayAsGTU(cost)} Fee`,
                };
            }

            if (
                TransactionKindString.TransferToPublic ===
                transaction.transactionKind
            ) {
                // A transfer to public is the only transaction, where we pay a cost and receive gtu on the public balance.
                return buildOutgoingAmountStrings(
                    -BigInt(transaction.subtotal),
                    cost
                );
            }

            return buildOutgoingAmountStrings(
                BigInt(transaction.subtotal),
                cost
            );
        }
        // incoming transaction:
        return buildCostFreeAmountString(BigInt(transaction.subtotal), true);
    }
    if (isRewardKind(transaction.transactionKind)) {
        return buildCostFreeAmountString(BigInt(transaction.subtotal));
    }
    return buildCostString(BigInt(transaction.cost || '0'));
}

function displayType(kind: TransactionKindString) {
    switch (kind) {
        case TransactionKindString.TransferWithSchedule:
            return <i className="mL10">(With schedule)</i>;
        case TransactionKindString.TransferToEncrypted:
            return <i>Shielded amount</i>;
        case TransactionKindString.TransferToPublic:
            return <i>Unshielded amount</i>;
        case TransactionKindString.EncryptedAmountTransfer:
            return <i className="mL10">(Encrypted)</i>;
        case TransactionKindString.BakingReward:
            return <i>Baker reward</i>;
        case TransactionKindString.BlockReward:
            return <i>Block reward</i>;
        case TransactionKindString.FinalizationReward:
            return <i>Finalization reward</i>;
        case TransactionKindString.AddBaker:
            return <i>Add baker</i>;
        case TransactionKindString.RemoveBaker:
            return <i>Remove baker</i>;
        case TransactionKindString.UpdateBakerStake:
            return <i>Update baker stake</i>;
        case TransactionKindString.UpdateBakerRestakeEarnings:
            return <i>Update baker restake Earnings</i>;
        case TransactionKindString.UpdateBakerKeys:
            return <i>Update baker keys</i>;
        case TransactionKindString.UpdateCredentials:
            return <i>Update account credentials</i>;
        default:
            return '';
    }
}

function statusSymbol(status: TransactionStatus) {
    switch (status) {
        case TransactionStatus.Pending:
            return '';
        case TransactionStatus.Committed:
            return <CheckmarkIcon className={styles.checkmark} height="10" />;
        case TransactionStatus.Finalized:
            return (
                <DoubleCheckmarkIcon className={styles.checkmark} height="10" />
            );
        case TransactionStatus.Rejected:
            return '!';
        default:
            return '?';
    }
}

interface Props {
    transaction: TransferTransaction;
    onClick?: () => void;
}

/**
 * Displays the given transaction basic information.
 */
function TransactionListElement({ transaction, onClick }: Props): JSX.Element {
    const account = useSelector(chosenAccountSelector);
    const viewingShielded = useSelector(viewingShieldedSelector);
    if (!account) {
        throw new Error('Unexpected missing chosen account');
    }
    const isOutgoingTransaction = determineOutgoing(transaction, account);
    const time = parseTime(transaction.blockTime);
    const name = getName(transaction, isOutgoingTransaction);
    const amountParser = viewingShielded ? parseShieldedAmount : parseAmount;
    const { amount, amountFormula } = amountParser(
        transaction,
        isOutgoingTransaction
    );

    const failed = isFailed(transaction);

    return (
        <div
            className={clsx(
                styles.transactionListElement,
                !failed || styles.failedElement
            )}
            onClick={onClick}
            onKeyPress={onClick}
            tabIndex={0}
            role="button"
        >
            {failed ? <Warning className={styles.warning} height="20" /> : null}
            <SidedRow
                left={
                    <>
                        {name}
                        {displayType(transaction.transactionKind)}
                    </>
                }
                right={
                    <p
                        className={clsx(
                            'mV0',
                            isGreen(
                                transaction,
                                viewingShielded,
                                isOutgoingTransaction
                            ) && styles.greenText
                        )}
                    >
                        {amount}
                    </p>
                }
            />
            <SidedRow
                className="body4 textFaded"
                left={
                    <>
                        {time} {statusSymbol(transaction.status)}
                    </>
                }
                right={
                    amountFormula
                        ? amountFormula.concat(
                              ` ${
                                  transaction.status !==
                                  TransactionStatus.Finalized
                                      ? ' (Estimated)'
                                      : ''
                              }`
                          )
                        : ''
                }
            />
        </div>
    );
}

export default TransactionListElement;
