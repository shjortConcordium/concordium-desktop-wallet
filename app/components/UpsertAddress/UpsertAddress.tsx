import React, {
    ElementType,
    PropsWithChildren,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { SubmitHandler, Validate } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import {
    AddressBookEntry,
    EqualRecord,
    NotOptional,
    PolymorphicComponentProps,
} from '~/utils/types';
import { commonAddressValidators } from '~/utils/accountHelpers';
import {
    addressBookSelector,
    addToAddressBook,
    updateAddressBookEntry,
} from '~/features/AddressBookSlice';
import Modal from '~/cross-app-components/Modal';
import Button from '~/cross-app-components/Button';
import Card from '~/cross-app-components/Card';
import Form from '../Form';

import styles from './UpsertAddress.module.scss';

type Props = PropsWithChildren<{
    initialValues?: AddressBookEntryForm;
    readOnly?: boolean;
    onSubmit?(entry: AddressBookEntry): void;
}>;

type UpsertAddressProps<
    TAs extends ElementType = typeof Button
> = PolymorphicComponentProps<TAs, Props>;

type AddressBookEntryForm = Omit<AddressBookEntry, 'readOnly'>;

const fieldNames: NotOptional<EqualRecord<AddressBookEntryForm>> = {
    name: 'name',
    address: 'address',
    note: 'note',
};

const noteMaxLength = 100;

export default function UpsertAddress<TAs extends ElementType = typeof Button>({
    onSubmit,
    initialValues,
    readOnly = false,
    as,
    ...asProps
}: UpsertAddressProps<TAs>) {
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const entries = useSelector(addressBookSelector);

    const isEditMode = initialValues !== undefined;
    const header = useMemo(
        () => (isEditMode ? 'Edit recipient' : 'Add new recipient'),
        [isEditMode]
    );

    const As = as || Button;

    const upsertAddress = useCallback(
        async (values: AddressBookEntryForm) => {
            const entry: AddressBookEntry = { ...values, readOnly };

            if (isEditMode && initialValues) {
                return updateAddressBookEntry(
                    dispatch,
                    initialValues.address,
                    entry
                );
            }
            return addToAddressBook(dispatch, entry);
        },
        [isEditMode, initialValues, dispatch, readOnly]
    );

    const addressUnique: Validate = useCallback(
        (address: string) => {
            if (address === initialValues?.address) {
                return true;
            }

            const existing = entries.find((e) => e.address === address);

            return (
                !existing ||
                `Address already exists under name: ${existing.name}`
            );
        },
        [entries, initialValues]
    );

    const handleSubmit: SubmitHandler<AddressBookEntryForm> = useCallback(
        async (values) => {
            await upsertAddress(values);

            if (onSubmit) {
                onSubmit({ ...values, readOnly });
            }
            setOpen(false);
        },
        [onSubmit, setOpen, upsertAddress, readOnly]
    );

    return (
        <Modal
            trigger={<As {...asProps} />}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
        >
            <h2 className={styles.header}>{header}</h2>
            <Form<AddressBookEntryForm> onSubmit={handleSubmit}>
                <Card className={styles.card}>
                    <div className={styles.content}>
                        <Form.Input
                            className={styles.name}
                            name={fieldNames.name}
                            rules={{
                                required: 'Name required',
                                maxLength: {
                                    value: 40,
                                    message:
                                        'Name cannot exceed 40 characters.',
                                },
                            }}
                            placeholder="Recipient Name"
                            defaultValue={initialValues?.name}
                            readOnly={readOnly}
                        />
                        <Form.TextArea
                            className={styles.input}
                            name={fieldNames.address}
                            spellCheck="false"
                            rules={{
                                required: 'Address required',
                                ...commonAddressValidators,
                                validate: {
                                    ...commonAddressValidators.validate,
                                    addressUnique,
                                },
                            }}
                            placeholder="Paste the account address here"
                            defaultValue={initialValues?.address}
                            readOnly={readOnly}
                        />
                        <Form.TextArea
                            className={styles.input}
                            name={fieldNames.note}
                            label={<span className="h3">Notes</span>}
                            rules={{
                                maxLength: {
                                    value: noteMaxLength,
                                    message: `Message cannot be longer than ${noteMaxLength} characters`,
                                },
                            }}
                            placeholder="You can add a note here"
                            defaultValue={initialValues?.note}
                        />
                    </div>
                </Card>
                <Form.Submit className={styles.submit}>
                    Save recipient
                </Form.Submit>
            </Form>
        </Modal>
    );
}
