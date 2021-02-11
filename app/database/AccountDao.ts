import { Account } from '../utils/types';
import knex from './knex';
import dbNames from '../constants/databaseNames.json';

/**
 * Returns all stored accounts
 *  - Attaches the identityName unto the account object.
 */
export async function getAllAccounts(): Promise<Account[]> {
    return (await knex())
        .table(dbNames.accountsTable)
        .join(
            dbNames.identitiesTable,
            `${dbNames.accountsTable}.identityId`,
            '=',
            `${dbNames.identitiesTable}.id`
        )
        .select(
            `${dbNames.accountsTable}.*`,
            `${dbNames.identitiesTable}.name as identityName`
        );
}

export async function insertAccount(account: Account | Account[]) {
    return (await knex())(dbNames.accountsTable).insert(account);
}

export async function updateAccount(
    accountName: string,
    updatedValues: Record<string, unknown>
) {
    return (await knex())(dbNames.accountsTable)
        .where({ name: accountName })
        .update(updatedValues);
}

export async function findAccounts(condition: Record<string, unknown>) {
    return (await knex())
        .select()
        .table(dbNames.accountsTable)
        .where(condition);
}

export async function getAccountsOfIdentity(
    identityId: number
): Promise<Account[]> {
    return findAccounts({ identityId });
}
