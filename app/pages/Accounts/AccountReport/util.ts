import {
    Account,
    TransferTransaction,
    TransactionKindString,
} from '~/utils/types';
import { getTransactionsOfAccount } from '~/database/TransactionDao';
import { toCSV } from '~/utils/basicHelpers';
import { attachNames } from '~/utils/transactionHelpers';
import exportTransactionFields from '~/constants/exportTransactionFields.json';
import { dateFromTimeStamp, getISOFormat } from '~/utils/timeHelpers';

type Filter = (transaction: TransferTransaction) => boolean;

export interface FilterOption {
    filter: Filter;
    label: string;
    key: string;
}

export function filterKind(
    label: string,
    kind: TransactionKindString
): FilterOption {
    return {
        label,
        key: kind,
        filter: (transaction: TransferTransaction) =>
            transaction.transactionKind === kind,
    };
}

const getName = (i: string[]) => i[0];
const getLabel = (i: string[]) => i[1];
const exportedFields = Object.entries(exportTransactionFields);

// Parse a transaction into a array of values, corresponding to those of the exported fields.
function parseTransaction(transaction: TransferTransaction) {
    const fieldValues: Record<string, string> = {};
    Object.entries(transaction).forEach(([key, value]) => {
        fieldValues[key] = value?.toString();
    });

    fieldValues.dateTime = getISOFormat(transaction.blockTime);

    return exportedFields.map((field) => fieldValues[getName(field)]);
}

// Updates transactions of the account, and returns them as a csv string.
export async function getAccountCSV(
    account: Account,
    filterOptions: FilterOption[],
    fromTime?: Date,
    toTime?: Date
) {
    let { transactions } = await getTransactionsOfAccount(account, [], 1000000); // load from database
    transactions = transactions.filter(
        (transaction) =>
            (!fromTime ||
                dateFromTimeStamp(transaction.blockTime) > fromTime) &&
            (!toTime || dateFromTimeStamp(transaction.blockTime) < toTime)
    );
    transactions = transactions.filter((transaction) =>
        filterOptions.some((filterOption) => filterOption.filter(transaction))
    );
    transactions = await attachNames(transactions);

    return toCSV(
        transactions.map(parseTransaction),
        exportedFields.map(getLabel)
    );
}