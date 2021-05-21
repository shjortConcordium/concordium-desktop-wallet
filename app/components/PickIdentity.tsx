import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ClassName, Identity } from '~/utils/types';
import {
    confirmedIdentitiesSelector,
    confirmedAndGenesisIdentitiesSelector,
} from '~/features/IdentitySlice';
import IdentityCard from '~/components/IdentityCard';
import CardList from '~/cross-app-components/CardList';

interface Props extends ClassName {
    chosenIdentity?: Identity;
    setIdentity(identity: Identity): void;
    withGenesisIdentities?: boolean;
}

/**
 * Allows the user to pick an Identity
 */
export default function PickIdentity({
    chosenIdentity,
    setIdentity,
    className,
    withGenesisIdentities = true,
}: Props): JSX.Element {
    const selector = withGenesisIdentities
        ? confirmedAndGenesisIdentitiesSelector
        : confirmedIdentitiesSelector;
    const identities = useSelector(selector);

    const [chosenIndex, setChosenIndex] = useState<number | undefined>();

    useEffect(() => {
        if (chosenIdentity) {
            setChosenIndex(
                identities.findIndex(
                    (identity) => identity.id === chosenIdentity.id
                )
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <CardList className={className}>
            {identities.map((identity: Identity, index: number) => (
                <IdentityCard
                    identity={identity}
                    key={identity.id}
                    active={chosenIndex === index}
                    onClick={() => {
                        setChosenIndex(index);
                        setIdentity(identity);
                    }}
                />
            ))}
        </CardList>
    );
}
