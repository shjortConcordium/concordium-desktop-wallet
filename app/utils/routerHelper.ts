import routes from '../constants/routes.json';
import { TransactionTypes, UpdateType, TransactionKindId } from './types';
// eslint-disable-next-line import/no-cycle
import { ExportKeyType } from '~/pages/multisig/MultiSignatureMenu/ExportKeyList';

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

export const submittedProposalRoute = (id: number) =>
    routes.MULTISIGTRANSACTIONS_SUBMITTED_TRANSACTION.replace(':id', `${id}`);

export function createProposalRoute(
    transactionType: TransactionTypes,
    specificType: UpdateType | TransactionKindId
) {
    if (transactionType === TransactionTypes.UpdateInstruction) {
        return routes.MULTISIGTRANSACTIONS_PROPOSAL.replace(
            ':updateType',
            `${specificType}`
        );
    }
    return {
        pathname: routes.MULTISIGTRANSACTIONS_CREATE_ACCOUNT_TRANSACTION,
        state: specificType,
    };
}
