import React from 'react';
import { List, Button, Header, Divider } from 'semantic-ui-react';
import TransactionListElement from './TransactionListElement';
import CopiableListElement from '../../components/CopiableListElement';
import { TransactionStatus, TransferTransaction } from '../../utils/types';
import { isFailed } from '../../utils/transactionHelpers';
import { rejectReasonToDisplayText } from '~/utils/node/RejectReasonHelper';

interface Props {
    transaction: TransferTransaction;
    returnFunction: () => void;
}

function displayRejectReason(transaction: TransferTransaction) {
    if (isFailed(transaction)) {
        return (
            <List.Item>
                <Header color="red" textAlign="center">
                    Failed:{' '}
                    {transaction.status === TransactionStatus.Rejected
                        ? 'Transaction was rejected'
                        : rejectReasonToDisplayText(transaction.rejectReason)}
                </Header>
                <Divider />
            </List.Item>
        );
    }
    return null;
}

/**
 * Detailed view of the given transaction.
 */
function TransactionView({ transaction, returnFunction }: Props) {
    return (
        <List>
            <List.Item>
                <Header textAlign="center">Transaction Details</Header>
                <Button onClick={returnFunction}>x</Button>
            </List.Item>
            <List.Item>
                <Divider />
                <TransactionListElement transaction={transaction} />
                <Divider />
            </List.Item>
            {displayRejectReason(transaction)}
            <CopiableListElement
                title="From Address:"
                value={transaction.fromAddress}
                note={transaction.fromAddressName}
            />
            <Divider />
            <CopiableListElement
                title="To Address:"
                value={transaction.toAddress}
                note={transaction.toAddressName}
            />
            <Divider />
            <CopiableListElement
                title="Transaction Hash"
                value={transaction.transactionHash || 'No Transaction.'}
            />
            <Divider />
            <CopiableListElement
                title="Block Hash"
                value={transaction.blockHash}
            />
        </List>
    );
}

export default TransactionView;
