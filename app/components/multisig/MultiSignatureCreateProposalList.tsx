import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Menu } from 'semantic-ui-react';
import { foundationTransactionsEnabledSelector } from '../../features/SettingsSlice';
import { UpdateType } from '../../utils/types';

// TODO Show non-foundation transaction types.

/**
 * Component that displays a menu containing the available multi signature
 * transaction types. If foundation transactions area enabled in settings,
 * then these are also listed here.
 */
export default function MultiSignatureCreateProposalView() {
    const foundationTransactionsEnabled: boolean = useSelector(
        foundationTransactionsEnabledSelector
    );

    let availableTransactionTypes = [];
    if (foundationTransactionsEnabled) {
        const foundationTransactionTypes = Object.keys(
            UpdateType
        ).filter((key) => Number.isNaN(Number(key)));
        availableTransactionTypes = availableTransactionTypes.concat(
            foundationTransactionTypes
        );
    }

    return (
        <Menu vertical fluid size="massive">
            {availableTransactionTypes.map((item) => (
                <Menu.Item
                    key={item}
                    as={Link}
                    // TODO Must also be able to handle account transaction types.
                    to={{
                        pathname: `/MultiSignatureTransaction/create`,
                        state: UpdateType[item],
                    }}
                >
                    {item}
                </Menu.Item>
            ))}
        </Menu>
    );
}
