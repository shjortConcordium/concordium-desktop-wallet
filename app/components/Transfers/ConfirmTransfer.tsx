import React from 'react';
import { Card, Button, Table, Label } from 'semantic-ui-react';
import { sendTransaction } from '../../utils/client';
import {
    serializeTransaction,
    getTransactionHash,
} from '../../utils/transactionSerialization';
import LedgerComponent from '../LedgerComponent';
import {
    createSimpleTransferTransaction,
    waitForFinalization,
} from '../../utils/transactionHelpers';
import {
    Account,
    AccountTransaction,
    AddressBookEntry,
} from '../../utils/types';
import ConcordiumLedgerClient from '../../features/ledger/ConcordiumLedgerClient';
import locations from '../../constants/transferLocations.json';
import {
    addPendingTransaction,
    confirmTransaction,
    rejectTransaction,
} from '../../features/TransactionSlice';
import { displayAsGTU } from '../../utils/gtu';
import { getAccountPath } from '../../features/ledger/Path';

export interface Props {
    account: Account;
    amount: BigInt;
    recipient: AddressBookEntry;
    setLocation(location: string): void;
    setTransaction(transaction: AccountTransaction): void;
}

/**
 * Wait for the transaction to be finalized (or rejected) and update accordingly
 */
async function monitorTransaction(transactionHash) {
    const dataObject = await waitForFinalization(transactionHash);
    if (dataObject) {
        confirmTransaction(transactionHash, dataObject);
    } else {
        rejectTransaction(transactionHash);
    }
}

/**
 *   Builds and Allows signing a simple transfer.
 *  TODO: generalize this component (when adding other transfers)
 */
export default function ConfirmTransferComponent({
    account,
    amount,
    recipient,
    setLocation,
    setTransaction,
}: Props): JSX.Element {
    const estimatedFee = 200n; // TODO calculate

    // This function builds the transaction then signs the transaction,
    // send the transaction, saves it, begins monitoring it's status
    // and then redirects to final page.
    // TODO: Break this function up
    async function ledgerSignTransfer(ledger: ConcordiumLedgerClient) {
        const transferTransaction = await createSimpleTransferTransaction(
            account.address,
            amount,
            recipient.address
        );
        const path = getAccountPath({
            identityIndex: account.identityId,
            accountIndex: account.accountNumber,
            signatureIndex: 0,
        });
        const signature: Buffer = await ledger.signTransfer(
            transferTransaction,
            path
        );
        const serializedTransaction = serializeTransaction(
            transferTransaction,
            () => [signature]
        );
        const transactionHash = getTransactionHash(transferTransaction, () => [
            signature,
        ]).toString('hex');
        const response = await sendTransaction(serializedTransaction);
        if (response.getValue()) {
            setTransaction(transferTransaction);
            addPendingTransaction(
                transferTransaction,
                transactionHash,
                account
            );
            monitorTransaction(transactionHash);
            setLocation(locations.transferSubmitted);
        } else {
            // TODO: handle rejection from node
        }
    }

    return (
        <Card fluid centered>
            <Card.Content textAlign="center">
                <Button onClick={() => setLocation(locations.pickAmount)}>
                    {'<--'}
                </Button>
                <Card.Header>Confirm Transfer</Card.Header>
                <Table>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Amount:</Table.Cell>
                            <Table.Cell textAlign="right">
                                {displayAsGTU(amount)}
                            </Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Estimated fee:</Table.Cell>
                            <Table.Cell textAlign="right">
                                {displayAsGTU(estimatedFee)}
                            </Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>To:</Table.Cell>
                            <Table.Cell textAlign="right">
                                {recipient.name}{' '}
                                <Label>{recipient.address}</Label>
                            </Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
                <LedgerComponent ledgerCall={ledgerSignTransfer} />
            </Card.Content>
        </Card>
    );
}