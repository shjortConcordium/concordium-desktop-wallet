import React from 'react';
import type { LocationDescriptorObject } from 'history';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import clsx from 'clsx';
import Modal from '~/cross-app-components/Modal';
import Button from '~/cross-app-components/Button';

export interface Action {
    label: string;
    onPicked?: () => void;
    location?: LocationDescriptorObject | string;
    inverted?: boolean;
}

interface Props {
    title: string;
    description: string | JSX.Element;
    actions: Action[];
    open: boolean;
    postAction(location?: string | LocationDescriptorObject): void;
    disableClose?: boolean;
}

export default function ChoiceModal({
    title,
    description,
    actions,
    open,
    postAction,
    disableClose = false,
}: Props) {
    const dispatch = useDispatch();
    return (
        <Modal disableClose={disableClose} open={open}>
            <h3>{title}</h3>
            {typeof description === 'string' ? (
                <p>{description}</p>
            ) : (
                <div>{description}</div>
            )}
            <div className="flex justifySpaceBetween mT30">
                {actions.map(({ label, location, onPicked, inverted }, i) => (
                    <Button
                        inverted={inverted}
                        className={clsx('flexChildFill', i !== 0 && 'mL30')}
                        key={label}
                        onClick={() => {
                            if (onPicked) {
                                onPicked();
                            }
                            if (location) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                dispatch(push(location as any));
                            }
                            postAction(location);
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </div>
        </Modal>
    );
}
