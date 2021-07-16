import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import groupBy from 'lodash.groupby';
import { TransferTransaction } from '~/utils/types';
import {
    moreTransactionsSelector,
    loadingTransactionsSelector,
} from '~/features/TransactionSlice';
import LoadingComponent from '~/cross-app-components/Loading';
import { TimeConstants } from '~/utils/timeHelpers';
import TransactionListGroup from './TransactionListGroup';

const dateFormat = Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
    .format;

const getGroupHeader = (d: Date): string => {
    switch (d.toDateString()) {
        case new Date().toDateString():
            return 'Today';
        case new Date(new Date().getDate() - 1).toDateString():
            return 'Yesterday';
        default:
            return dateFormat(d);
    }
};

interface Props {
    transactions: TransferTransaction[];
    onTransactionClick: (transaction: TransferTransaction) => void;
}

/**
 * Displays a list of transactions, and executes the provided onTransactionClick
 * function when a specific transaction is clicked.
 */
function TransactionList({
    onTransactionClick,
    transactions,
}: Props): JSX.Element | null {
    const more = useSelector(moreTransactionsSelector);
    const loading = useSelector(loadingTransactionsSelector);
    const [showLoading, setShowLoading] = useState(false);

    const transactionGroups = useMemo(
        () =>
            groupBy(transactions, (t) =>
                getGroupHeader(
                    new Date(Number(t.blockTime) * TimeConstants.Second)
                )
            ),
        [transactions]
    );

    useEffect(() => {
        if (loading) {
            const timerId = setTimeout(() => setShowLoading(true), 500);
            return () => clearInterval(timerId);
        }
        setShowLoading(false);
        return () => {};
    }, [loading]);

    if (showLoading) {
        return (
            <div className="flex">
                <LoadingComponent
                    inline
                    className="marginCenter mV40"
                    text="loading transactions"
                />
            </div>
        );
    }

    if (loading) {
        return null;
    }

    if (transactions.length === 0) {
        return (
            <h3 className="flex justifyCenter pB20">
                This balance has no transactions yet.
            </h3>
        );
    }

    return (
        <>
            {Object.entries(transactionGroups).map(([h, ts]) => (
                <TransactionListGroup
                    key={h}
                    header={h}
                    transactions={ts}
                    onTransactionClick={onTransactionClick}
                />
            ))}
            {more && (
                <h3 className="flex justifyCenter mT10 pB10">
                    Export to see older transactions
                </h3>
            )}
        </>
    );
}

export default TransactionList;
