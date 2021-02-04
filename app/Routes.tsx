/* eslint react/jsx-props-no-spreading: off */
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';
import TestPage from './containers/TestPage';
import AccountPage from './containers/AccountPage';
import IdentityPage from './containers/IdentityPage';
import AddressBookPage from './containers/AddressBookPage';
import IssuancePage from './containers/IssuancePage';
import AccountCreation from './containers/AccountCreationPage';
import ExportImport from './containers/ExportImportPage';
import PerformImport from './components/exportImport/PerformImport';
import SettingsPage from './containers/SettingsPage';
import MultiSignaturePage from './containers/MultiSignaturePage';
import ProposalView from './components/multisig/ProposalView';
import SignTransactionView from './components/multisig/SignTransactionView';
import ExportSignedTransactionView from './components/multisig/ExportSignedTransactionView';
import MultiSignatureCreateProposalView from './components/multisig/MultiSignatureCreateProposalView';
import SubmittedProposalView from './components/multisig/SubmittedProposalView';

export default function Routes() {
    return (
        <App>
            <Switch>
                <Route path={routes.TEST} component={TestPage} />
                <Route path={routes.ACCOUNTS} component={AccountPage} />
                <Route
                    path={routes.IDENTITYISSUANCE}
                    component={IssuancePage}
                />
                <Route
                    path={routes.ACCOUNTCREATION}
                    component={AccountCreation}
                />
                <Route path={routes.IDENTITIES} component={IdentityPage} />
                <Route path={routes.ADDRESSBOOK} component={AddressBookPage} />
                <Route path={routes.IMPORT} component={PerformImport} />
                <Route path={routes.EXPORTIMPORT} component={ExportImport} />
                <Route
                    path={routes.MULTISIGTRANSACTIONS_SUBMITTED_TRANSACTION}
                    component={SubmittedProposalView}
                />
                <Route
                    path={routes.MULTISIGTRANSACTIONS_EXPORT_TRANSACTION}
                    component={ExportSignedTransactionView}
                />
                <Route
                    path={routes.MULTISIGTRANSACTIONS_SIGN_TRANSACTION}
                    component={SignTransactionView}
                />
                <Route
                    path={routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING}
                    component={ProposalView}
                />
                <Route
                    path={routes.MULTISIGTRANSACTIONS_PROPOSAL}
                    component={MultiSignatureCreateProposalView}
                />
                <Route
                    path={routes.MULTISIGTRANSACTIONS}
                    component={MultiSignaturePage}
                />
                <Route path={routes.SETTINGS} component={SettingsPage} />
                <Route path={routes.HOME} component={HomePage} />
            </Switch>
        </App>
    );
}
