import React from 'react';
import { Switch, Route } from 'react-router-dom';
import routes from '~/constants/routes.json';
import MultiSignaturePage from './MultiSignaturePage';
import ProposalView from './ProposalView';
import CosignTransactionProposal from './CosignTransactionProposal';
import MultiSignatureCreateProposal from './MultiSignatureCreateProposal';
import SubmittedProposal from './SubmittedProposal';
import ExportKeyView from './ExportKeyView/ExportKeyView';
import CreateAccountTransactionView from './AccountTransactions/CreateAccountTransactionView';

export default function MultiSignatureRoutes(): JSX.Element {
    return (
        <Switch>
            <Route
                path={routes.MULTISIGTRANSACTIONS_SUBMITTED_TRANSACTION}
                component={SubmittedProposal}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS_CREATE_ACCOUNT_TRANSACTION}
                component={CreateAccountTransactionView}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS_COSIGN_TRANSACTION}
                component={CosignTransactionProposal}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING_SELECTED}
                component={ProposalView}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS_PROPOSAL}
                component={MultiSignatureCreateProposal}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS_EXPORT_KEY_SELECTED}
                component={ExportKeyView}
            />
            <Route
                path={routes.MULTISIGTRANSACTIONS}
                component={MultiSignaturePage}
            />
        </Switch>
    );
}
