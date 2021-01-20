import React from 'react';
import { useSelector } from 'react-redux';
import { List, Divider } from 'semantic-ui-react';
import TransactionListElement from './TransactionListElement';
import { TransferTransaction } from '../utils/types';
import { transactionsSelector } from '../features/TransactionSlice';

interface Props {
    chooseElement: (transaction: TransferTransaction) => void;
}

function TransactionList({ chooseElement }: Props): JSX.Element {
    const transactions = useSelector(transactionsSelector);

    return (
        <List>
            <Divider />
            {transactions.map((transaction: TransferTransaction) => (
                <>
                    <TransactionListElement
                        transaction={transaction}
                        key={transaction.transactionHash}
                        onClick={() => chooseElement(transaction)}
                    />
                    <Divider />
                </>
            ))}
        </List>
    );
}

export default TransactionList;
