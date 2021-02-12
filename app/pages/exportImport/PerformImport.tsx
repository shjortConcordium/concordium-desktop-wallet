import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import {
    Grid,
    Button,
    List,
    Header,
    Segment,
    Divider,
} from 'semantic-ui-react';
import {
    AddressBookEntry,
    Account,
    Identity,
    ExportData,
} from '../../utils/types';
import routes from '../../constants/routes.json';
import {
    importIdentities,
    identitiesSelector,
} from '../../features/IdentitySlice';
import { importAccount, accountsSelector } from '../../features/AccountSlice';
import {
    importAddressBookEntry,
    addressBookSelector,
} from '../../features/AddressBookSlice';
import MessageModal from '../../components/MessageModal';
import { checkDuplicates } from '../../utils/importHelpers';
import { partition } from '../../utils/basicHelpers';

type IdentityKey = keyof Identity;
type AccountKey = keyof Account;
type AddressBookEntryKey = keyof AddressBookEntry;

export const identityFields: IdentityKey[] = ['id', 'name', 'randomness']; // TODO are there any other fields we should check?
export const accountFields: AccountKey[] = [
    'name',
    'address',
    'accountNumber',
    'identityId',
    'credential',
];
export const addressBookFields: AddressBookEntryKey[] = [
    'name',
    'address',
    'note',
];

export async function importNewIdentities(
    newIdentities: Identity[],
    existingIdentities: Identity[]
): Promise<Identity[]> {
    const [nonDuplicates, duplicates] = partition(
        newIdentities,
        (newIdentity) =>
            checkDuplicates(newIdentity, existingIdentities, identityFields, [])
    );
    if (nonDuplicates.length > 0) {
        await importIdentities(nonDuplicates);
    }
    return duplicates;
}

export async function importAccounts(
    newAccounts: Account[],
    existingAccounts: Account[]
): Promise<Account[]> {
    const [nonDuplicates, duplicates] = partition(newAccounts, (newAccount) =>
        checkDuplicates(newAccount, existingAccounts, accountFields, [])
    );
    if (nonDuplicates.length > 0) {
        await importAccount(nonDuplicates);
    }
    return duplicates;
}

export async function importEntries(
    entries: AddressBookEntry[],
    addressBook: AddressBookEntry[]
): Promise<AddressBookEntry[]> {
    const [nonDuplicates, duplicates] = partition(entries, (entry) =>
        checkDuplicates(entry, addressBook, addressBookFields, ['note'])
    );
    if (nonDuplicates.length > 0) {
        await importAddressBookEntry(nonDuplicates);
    }
    return duplicates;
}

interface State {
    accounts: Account[];
    identities: Identity[];
    addressBook: AddressBookEntry[];
}

interface Location {
    state: State;
}

interface Props {
    location: Location;
}

interface SetDuplicates {
    identities(duplicates: Identity[]): void;
    accounts(duplicates: Account[]): void;
    addressBook(duplicates: AddressBookEntry[]): void;
}

async function performImport(
    importedData: ExportData,
    existingData: ExportData,
    setDuplicates: SetDuplicates
) {
    const duplicateIdentities = await importNewIdentities(
        importedData.identities,
        existingData.identities
    );
    setDuplicates.identities(duplicateIdentities);
    const duplicateAccounts = await importAccounts(
        importedData.accounts,
        existingData.accounts
    );
    setDuplicates.accounts(duplicateAccounts);
    const duplicateEntries = await importEntries(
        importedData.addressBook,
        existingData.addressBook
    );
    setDuplicates.addressBook(duplicateEntries);
}

/**
 * Component to import identities/accounts/addressBookEntries.
 * Expects prop.location.state to contain identities/accounts/addressBookEntries.
 * Checks for duplicates and saves the input.
 * Displays the imported entries.
 */
export default function PerformImport({ location }: Props) {
    const dispatch = useDispatch();
    const importedData = location.state;
    const accounts = useSelector(accountsSelector);
    const identities = useSelector(identitiesSelector);
    const addressBook = useSelector(addressBookSelector);
    const [duplicateIdentities, setDuplicateIdentities] = useState<Identity[]>(
        []
    );
    const [duplicateAccounts, setDuplicateAccounts] = useState<Account[]>([]);
    const [duplicateEntries, setDuplicateEntries] = useState<
        AddressBookEntry[]
    >([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const setters = {
            identities: setDuplicateIdentities,
            accounts: setDuplicateAccounts,
            addressBook: setDuplicateEntries,
        };
        performImport(
            importedData,
            {
                identities,
                accounts,
                addressBook,
            },
            setters
        ).catch(() => setOpen(true));
    }, [
        importedData,
        identities,
        accounts,
        addressBook,
        setDuplicateEntries,
        setDuplicateAccounts,
        setDuplicateIdentities,
    ]);

    const accountList = (identity: Identity) => (
        <List.List relaxed="false">
            {importedData.accounts
                .filter(
                    (account: Account) => account.identityId === identity.id
                )
                .map((account: Account) => (
                    <List.Item key={account.address}>
                        {account.name}
                        {duplicateAccounts.includes(account)
                            ? ' (Already existed)'
                            : ''}
                    </List.Item>
                ))}
        </List.List>
    );

    const AddressBookList = (
        <List size="big">
            <List.Item>
                <List.Header>Recipient accounts:</List.Header>
            </List.Item>
            {importedData.addressBook.map((entry: AddressBookEntry) => (
                <List.Item key={entry.address}>
                    {entry.name}
                    {duplicateEntries.includes(entry)
                        ? ' (Already existed)'
                        : ''}
                </List.Item>
            ))}
        </List>
    );

    return (
        <>
            <MessageModal
                title="Unable to complete import!"
                buttonText="return!"
                onClose={() => dispatch(push(routes.EXPORTIMPORT))}
                open={open}
            />

            <Segment textAlign="center">
                <Grid columns="equal" divided>
                    <Grid.Column>
                        <Segment basic>
                            <Header size="large">Import successful</Header>
                            That&apos;s it! Your import completed successfully.
                            <Divider hidden />
                            <Button
                                fluid
                                primary
                                onClick={() =>
                                    dispatch(push(routes.EXPORTIMPORT))
                                }
                            >
                                Okay, thanks!
                            </Button>
                        </Segment>
                    </Grid.Column>
                    <Grid.Column>
                        <List size="big" relaxed="very">
                            {importedData.identities.map(
                                (identity: Identity) => (
                                    <List.Item key={identity.id}>
                                        <List.Header>
                                            ID: {identity.name}
                                            {duplicateIdentities.includes(
                                                identity
                                            )
                                                ? ' (Already existed)'
                                                : ''}
                                        </List.Header>
                                        <List.Content>
                                            Accounts:
                                            {accountList(identity)}
                                        </List.Content>
                                    </List.Item>
                                )
                            )}
                        </List>
                        <Header>Address Book</Header>
                        {AddressBookList}
                    </Grid.Column>
                </Grid>
            </Segment>
        </>
    );
}