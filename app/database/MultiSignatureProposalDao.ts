import { MultiSignatureTransaction } from '../utils/types';
import knex from './knex';
import dbNames from '../constants/databaseNames.json';

/**
 * Function for inserting a multi signature transaction proposal
 * into the database.
 */
export async function insert(transaction: Partial<MultiSignatureTransaction>) {
    return (await knex())
        .table(dbNames.multiSignatureProposalTable)
        .insert(transaction);
}

/**
 * Updates the given proposal entry.
 */
export async function updateEntry(
    multiSigTransaction: MultiSignatureTransaction
) {
    return (await knex())(dbNames.multiSignatureProposalTable)
        .where({ id: multiSigTransaction.id })
        .update(multiSigTransaction);
}

/**
 * Function for reading all items in the multi signature transaction proposal table.
 */
export async function getAll(): Promise<MultiSignatureTransaction[]> {
    return (await knex()).select().table(dbNames.multiSignatureProposalTable);
}
