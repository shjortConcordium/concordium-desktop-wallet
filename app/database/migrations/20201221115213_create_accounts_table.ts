import * as Knex from 'knex';
import databaseNames from '../../constants/databaseNames.json';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable(
        databaseNames.accountsTable,
        (table: Knex.TableBuilder) => {
            table.integer('accountNumber');
            table.string('name');
            table.string('status');
            table.string('address');
            table
                .integer('identityId')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable(databaseNames.identitiesTable)
                .index();
            table.string('credential');
            table.string('credentialDeploymentHash');
            table.string('incomingAmounts').defaultTo('[]');
            table.string('selfAmounts').defaultTo('');
            table.string('totalDecrypted').defaultTo('');
            table.boolean('allDecrypted').defaultTo(true);
        }
    );
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable(databaseNames.accountsTable);
}
