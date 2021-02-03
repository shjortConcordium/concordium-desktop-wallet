import { Account, TransferTransaction } from '../utils/types';
import knex from './knex';
import { transactionTable } from '../constants/databaseNames.json';

export async function getTransactionsOfAccount(
    account: Account,
    filter: (transction: TransferTransaction) => boolean = undefined,
    orderBy = 'id'
): Promise<TransferTransaction[]> {
    const { address } = account;
    const transactions = await (await knex())
        .select()
        .table(transactionTable)
        .where({ toAddress: address })
        .orWhere({ fromAddress: address })
        .orderBy(orderBy);
    if (filter) {
        return transactions.filter(filter);
    }
    return transactions;
}

// Move or replace
function partition(arr, criteria) {
    return [
        arr.filter((item) => criteria(item)),
        arr.filter((item) => !criteria(item)),
    ];
}

export async function updateTransaction(identifier, updatedValues) {
    return (await knex())(transactionTable)
        .where(identifier)
        .update(updatedValues);
}

export async function insertTransactions(transactions: TransferTransaction[]) {
    const table = (await knex())(transactionTable);
    const existingTransactions = await table.select();
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
    return (await knex())(transactionTable).del();
}

export async function getMaxTransactionsIdOfAccount(account) {
    const { address } = account;
    const query = await (await knex())
        .table(transactionTable)
        .where({ toAddress: address })
        .orWhere({ fromAddress: address })
        .max('id as maxId')
        .first();
    return query.maxId;
}