import React, { useState } from 'react';
import { Switch, Route } from 'react-router-dom';
import routes from '../constants/routes.json';
import pickName from './AccountCreationPickName';
import chooseIdentity from './AccountCreationChooseIdentity';
import pickAttributes from './AccountCreationPickAttributes';
import generate from './AccountCreationGenerate';
import finalPage from './AccountCreationFinal';

// The entrance into the flow is the last Route (which should have the parent route), otherwise the flow is controlled by the components themselves
export default function AccountCreation(): JSX.Element {
    const [accountName, setAccountName] = useState('');
    const [identity, setIdentity] = useState('');

    // <Route path={routes.ACCOUNTCREATION_PICK_ATTRIBUTES} component={pickAttributes} />

    return (
        <Switch>
            <Route
                path={routes.ACCOUNTCREATION_CHOOSEIDENTITY}
                component={() => chooseIdentity(setIdentity)}
            />
            <Route
                path={routes.ACCOUNTCREATION_FINAL}
                component={() => finalPage(accountName)}
            />
            <Route
                path={routes.ACCOUNTCREATION_GENERATE}
                component={() => generate(accountName, identity)}
            />
            <Route
                path={routes.ACCOUNTCREATION}
                component={() => pickName(setAccountName)}
            />
        </Switch>
    );
}
