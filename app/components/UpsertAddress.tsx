import React, { ComponentProps, useMemo, useState } from 'react';
import { Modal } from 'semantic-ui-react';
import { SubmitHandler } from 'react-hook-form';

import { AddressBookEntry, EqualRecord, NotOptional } from '../utils/types';
import { isValidAddress } from '../utils/accountHelpers';
import Form from './Form';

interface Props
    extends Pick<NotOptional<ComponentProps<typeof Modal>>, 'trigger'> {
    submit(name: string, address: string, note?: string): void;
    initialValues?: AddressBookEntryForm;
}

type AddressBookEntryForm = Omit<AddressBookEntry, 'readOnly'>;

const fieldNames: NotOptional<EqualRecord<AddressBookEntryForm>> = {
    name: 'name',
    address: 'address',
    note: 'note',
};

const noteMaxLength = 255;

function validateAddress(v: string): string | undefined {
    if (isValidAddress(v)) {
        return undefined;
    }
    return 'Address format is invalid';
}

export default function UpsertAddress({
    submit,
    initialValues,
    trigger,
}: Props) {
    const [open, setOpen] = useState(false);

    const isEditMode = initialValues !== undefined;
    const header = useMemo(
        () => (isEditMode ? 'Edit recipient' : 'Add new recipient'),
        [isEditMode]
    );

    const handleSubmit: SubmitHandler<AddressBookEntryForm> = ({
        address,
        name,
        note,
    }) => {
        submit(name, address, note);
        setOpen(false);
    };

    return (
        <Modal
            closeIcon
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
            trigger={trigger}
            dimmer="blurring"
            closeOnDimmerClick={false}
        >
            <Modal.Header>{header}</Modal.Header>
            <Modal.Content>
                <Form<AddressBookEntryForm> onSubmit={handleSubmit}>
                    <Form.Input
                        name={fieldNames.name}
                        rules={{ required: 'Name required' }}
                        placeholder="Recipient Name"
                    />
                    <Form.Input
                        name={fieldNames.address}
                        rules={{
                            required: 'Address should be 50 characters',
                            minLength: {
                                value: 50,
                                message: 'Address should be 50 characters',
                            },
                            maxLength: {
                                value: 50,
                                message: 'Address should be 50 characters',
                            },
                            validate: validateAddress,
                        }}
                        placeholder="Paste the account address here"
                    />
                    <Form.Input
                        name={fieldNames.note}
                        rules={{
                            maxLength: {
                                value: noteMaxLength,
                                message:
                                    'Message cannot be longer than 255 characters',
                            },
                        }}
                        placeholder="You can add a note here"
                    />
                    <button type="submit">Submit</button>
                </Form>
            </Modal.Content>
        </Modal>
    );
}
