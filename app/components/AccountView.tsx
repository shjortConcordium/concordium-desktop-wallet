import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { Switch, Route, useLocation } from 'react-router-dom';
import { Card, Button } from 'semantic-ui-react';
import {
    chosenAccountSelector,
    chosenAccountInfoSelector,
} from '../features/AccountSlice';
import {
    viewingShieldedSelector,
    updateTransactions,
} from '../features/TransactionSlice';
import styles from './Accounts.css';
import routes from '../constants/routes.json';
import moreActions from './MoreActions';
import simpleTransfer from './Transfers/SimpleTransfer';
import transferHistory from './TransferHistory';
import AccountBalanceView from './AccountBalanceView';
import DecryptComponent from './DecryptComponent';

export default function AccountView() {
    const dispatch = useDispatch();
    const account = useSelector(chosenAccountSelector);
    const accountInfo = useSelector(chosenAccountInfoSelector);
    const location = useLocation();
    const buttons = [
        { route: routes.ACCOUNTS_SIMPLETRANSFER, text: 'Send' },
        { route: routes.ACCOUNTS_SIMPLETRANSFER, text: 'Shield' },
        { route: routes.ACCOUNTS_MORE, text: 'More' },
    ];

    useEffect(() => {
        if (account) {
            updateTransactions(account);
        }
    }, [account]);

    if (account === undefined) {
        return null;
    }

    return (
        <Card fluid>
            <AccountBalanceView />
            <Button.Group>
                {buttons.map(({ route, text }) => (
                    <Button
                        key={route + text}
                        onClick={() => dispatch(push(route))}
                        className={styles.accountActionButton}
                        disabled={location.pathname.startsWith(route)}
                    >
                        {text}
                    </Button>
                ))}
            </Button.Group>
            <Switch>
                <Route
                    path={routes.ACCOUNTS_MORE}
                    component={() => moreActions(account, accountInfo)}
                />
                <Route
                    path={routes.ACCOUNTS_SIMPLETRANSFER}
                    component={() => simpleTransfer(account)}
                />
                <Route
                    path={routes.DEFAULT}
                    component={() => transferHistory(account)}
                />
            </Switch>
            <DecryptComponent account={account} />
        </Card>
    );
}
