import { Knex } from 'knex';
import {
    externalCredentialsTable,
    accountsTable,
} from '~/constants/databaseNames.json';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable(externalCredentialsTable, (table) => {
        table
            .string('accountAddress')
            .references('address')
            .inTable(accountsTable)
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
        table.string('credId').primary();
        table.string('note').defaultTo('');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable(externalCredentialsTable);
}
