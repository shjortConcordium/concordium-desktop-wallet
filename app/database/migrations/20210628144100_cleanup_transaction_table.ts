import { Knex } from 'knex';
import {
    transactionTable,
    accountsTable,
} from '~/constants/databaseNames.json';
import { up as createTransactionTable } from './20201230111229_create_transaction_table';

export async function up(knex: Knex): Promise<void> {
    await knex.transaction(async (t) => {
        await t.table(accountsTable).update({ maxTransactionId: 0 });

        await t.schema.dropTableIfExists(transactionTable);
        await t.schema.createTable(
            transactionTable,
            (table: Knex.TableBuilder) => {
                // Type Fields
                table.string('transactionKind').notNullable();
                // Always present from proxy
                table.string('id').unique();
                table.string('blockHash');
                table.string('blockTime').notNullable();
                // Optionals
                table.string('transactionHash');
                table.string('subtotal').notNullable();
                table.string('cost');
                // Local storage of decrypted amount
                table.string('decryptedAmount');
                // Blobs:
                table.json('encrypted');
                table.json('schedule');
                // Others
                table.string('fromAddress').index();
                table.string('toAddress').index();
                table.string('status').notNullable();
                table.string('rejectReason');
            }
        );
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(transactionTable);
    await createTransactionTable(knex);
    await knex.table(accountsTable).update({ maxTransactionId: 0 });
}
