import {
    Account,
    TransferTransaction,
    TransactionStatus,
} from '../utils/types';
import knex from './knex';
import dbNames from '../constants/databaseNames.json';
import { partition } from '../utils/basicHelpers';

export async function getTransactionsOfAccount(
    account: Account,
    filter: (transaction: TransferTransaction) => boolean = () => true,
    orderBy = 'id'
): Promise<TransferTransaction[]> {
    const { address } = account;
    const transactions = await (await knex())
        .select()
        .table(dbNames.transactionTable)
        .where({ toAddress: address })
        .orWhere({ fromAddress: address })
        .orderBy(orderBy);
    return transactions.filter(filter);
}

export async function updateTransaction(
    identifier: Record<string, unknown>,
    updatedValues: Partial<TransferTransaction>
) {
    return (await knex())(dbNames.transactionTable)
        .where(identifier)
        .update(updatedValues);
}

export async function insertTransactions(transactions: TransferTransaction[]) {
    const table = (await knex())(dbNames.transactionTable);
    const existingTransactions: TransferTransaction[] = await table.select();
    const [updates, additions] = partition(transactions, (t) =>
        existingTransactions.some(
            (t_) => t.transactionHash === t_.transactionHash
        )
    );
    if (additions.length > 0) {
        await table.insert(additions);
    }
    return Promise.all(
        updates.map(async (transaction) => {
            const { transactionHash, ...otherFields } = transaction;
            return updateTransaction(
                { transactionHash: transaction.transactionHash },
                otherFields
            );
        })
    );
}

export async function resetTransactions() {
    // TODO: used for testing, eventually should be removed
    return (await knex())(dbNames.transactionTable).del();
}

export async function getMaxTransactionsIdOfAccount(
    account: Account
): Promise<number | undefined> {
    const { address } = account;
    const query = await (await knex())
        .table<TransferTransaction>(dbNames.transactionTable)
        .where({ toAddress: address })
        .orWhere({ fromAddress: address })
        .max<{ maxId: TransferTransaction['id'] }>('id as maxId')
        .first();

    return query?.maxId;
}

export async function getPendingTransactions(
    orderBy = 'id'
): Promise<TransferTransaction[]> {
    const transactions = await (await knex())
        .select()
        .table(dbNames.transactionTable)
        .where({ status: TransactionStatus.Pending })
        .orderBy(orderBy);
    return transactions;
}
