import {
    MultiSignatureTransaction,
    MultiSignatureTransactionStatus,
} from '../utils/types';
import { parse } from '../utils/JSONHelper';
import { max } from '../utils/basicHelpers';
import { knex } from './knex';
import { multiSignatureProposalTable } from '../constants/databaseNames.json';

/**
 * Function for inserting a multi signature transaction proposal
 * into the database.
 */
export async function insert(transaction: Partial<MultiSignatureTransaction>) {
    return (await knex())
        .table(multiSignatureProposalTable)
        .insert(transaction);
}

/**
 * Updates the given proposal entry.
 */
export async function updateEntry(
    multiSigTransaction: MultiSignatureTransaction
) {
    return (await knex())(multiSignatureProposalTable)
        .where({ id: multiSigTransaction.id })
        .update(multiSigTransaction);
}

/**
 * Function for reading all items in the multi signature transaction proposal table.
 */
export async function getAll(): Promise<MultiSignatureTransaction[]> {
    return (await knex()).select().table(multiSignatureProposalTable);
}

export async function getMaxOpenNonceOnAccount(
    address: string
): Promise<bigint> {
    const openProposals = await (await knex())
        .select()
        .table(multiSignatureProposalTable)
        .where({ status: MultiSignatureTransactionStatus.Open });
    const transactions = openProposals
        .map((prop) => parse(prop.transaction))
        .filter((transaction) => transaction.sender === address);
    return transactions.reduce((acc, x) => max(acc, BigInt(x)), 0n);
}
