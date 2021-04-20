import routes from '../constants/routes.json';
import { UpdateType, TransactionKindString } from './types';
// eslint-disable-next-line import/no-cycle
import { ExportKeyType } from '~/pages/multisig/menu/ExportKeyList';

export const selectedAddressBookEntryRoute = (address: string) =>
    routes.ADDRESSBOOK_SELECTED.replace(':address', address);

export const selectedProposalRoute = (proposalId: number) => {
    return routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING_SELECTED.replace(
        ':id',
        `${proposalId}`
    );
};

export function selectedExportKeyRoute(keyType: string) {
    if (keyType === ExportKeyType.Credential) {
        return routes.GENERATE_CREDENTIAL;
    }
    return routes.MULTISIGTRANSACTIONS_EXPORT_KEY_SELECTED.replace(
        ':keyType',
        keyType
    );
}

export const submittedProposalRoute = (proposalId: number) =>
    routes.MULTISIGTRANSACTIONS_SUBMITTED_TRANSACTION.replace(
        ':id',
        `${proposalId}`
    );

export function createProposalRoute(
    transactionType: UpdateType | TransactionKindString
) {
    if (transactionType in UpdateType) {
        return routes.MULTISIGTRANSACTIONS_PROPOSAL.replace(
            ':updateType',
            `${transactionType}`
        );
    }
    return {
        pathname: routes.UPDATE_ACCOUNT_CREDENTIALS,
        state: transactionType,
    };
}
