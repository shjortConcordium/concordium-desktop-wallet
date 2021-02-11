import { AddressBookEntry } from '../utils/types';
import knex from './knex';
import dbNames from '../constants/databaseNames.json';

function sanitizeAddressBookEntry(e: AddressBookEntry): AddressBookEntry {
    return { ...e, readOnly: Boolean(e.readOnly) };
}

export async function getAddressBook(): Promise<AddressBookEntry[]> {
    return (await knex())
        .select()
        .table(dbNames.addressBookTable)
        .then((e) => e.map(sanitizeAddressBookEntry));
}

export async function insertEntry(
    entry: AddressBookEntry | AddressBookEntry[]
) {
    return (await knex())(dbNames.addressBookTable).insert(entry);
}

export async function updateEntry(
    name: string,
    updatedValues: Partial<AddressBookEntry>
) {
    return (await knex())(dbNames.addressBookTable)
        .where({ name })
        .update(updatedValues);
}

export async function removeEntry(entry: AddressBookEntry) {
    return (await knex())(dbNames.addressBookTable).where(entry).del();
}

export async function findEntries(
    condition: Partial<AddressBookEntry>
): Promise<AddressBookEntry[]> {
    return (await knex())
        .select()
        .table(dbNames.addressBookTable)
        .where(condition)
        .then((e) => e.map(sanitizeAddressBookEntry));
}
