import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Button, List, Divider } from 'semantic-ui-react';

import routes from '../../constants/routes.json';
import { accountsSelector } from '../../features/AccountSlice';
import AccountListElement from '../AccountListElement';

interface Props {
    accountName: string;
}

export default function AccountCreationFinal({
    accountName,
}: Props): JSX.Element {
    const accounts = useSelector(accountsSelector);

    if (accounts === undefined) {
        return null;
    }

    const account = accounts.find((acc) => acc.name === accountName);

    return (
        <Card fluid centered>
            <Card.Content textAlign="center">
                <Card.Header>Your account has been submitted</Card.Header>
                <Card.Description>
                    That was it! Now you just have to wait for your account to
                    be finalized on the block-chain.
                </Card.Description>
                <Divider />
                <List horizontal>
                    <List.Item>
                        <AccountListElement account={account} />
                    </List.Item>
                </List>
                <Divider />
                <Link to={routes.ACCOUNTS}>
                    <Button>Finished!</Button>
                </Link>
            </Card.Content>
        </Card>
    );
}
