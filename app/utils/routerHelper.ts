import routes from '../constants/routes.json';

export const selectedAddressBookEntryRoute = (address: string) =>
    routes.ADDRESSBOOK_SELECTED.replace(':address', address);

export const selectedProposalRoute = (id: number) =>
    routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING_SELECTED.replace(
        ':id',
        `${id}`
    );

export const selectedExportKeyRoute = (keyType: string) =>
    routes.MULTISIGTRANSACTIONS_EXPORT_KEY_SELECTED.replace(
        ':keyType',
        keyType
    );

export const createProposalRoute = (updateType: number) =>
    routes.MULTISIGTRANSACTIONS_PROPOSAL.replace(
        ':updateType',
        `${updateType}`
    );