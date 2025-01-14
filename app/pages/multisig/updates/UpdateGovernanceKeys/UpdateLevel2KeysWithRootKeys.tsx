import React from 'react';
import { UpdateProps } from '~/utils/transactionTypes';
import { UpdateType } from '~/utils/types';
import UpdateAuthorizationKeys from './UpdateAuthorizationKeys';

export default function UpdateLevel2KeysWithRootKeys({
    blockSummary,
    handleAuthorizationKeySubmit,
    defaults,
}: UpdateProps): JSX.Element | null {
    if (!handleAuthorizationKeySubmit) {
        throw new Error('A key submission function has to be provided.');
    }

    return (
        <UpdateAuthorizationKeys
            defaults={defaults}
            blockSummary={blockSummary}
            type={UpdateType.UpdateLevel2KeysUsingRootKeys}
            handleKeySubmit={handleAuthorizationKeySubmit}
        />
    );
}
