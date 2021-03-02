import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useLocation, Link } from 'react-router-dom';
import { Button, Header, Grid } from 'semantic-ui-react';
import { stringify } from '../../utils/JSONHelper';
import routes from '../../constants/routes.json';
import PickAmount from './PickAmount';
import FinalPage from './FinalPage';
import { Account } from '../../utils/types';
import { toMicroUnits } from '../../utils/gtu';
import locations from '../../constants/transferLocations.json';
import { TransferState } from '../../utils/transactionTypes';

interface Specific<T> {
    title: string;
    amountHeader: string;
    createTransaction: (address: string, amount: bigint) => T;
    location: string;
}

interface Props<T> {
    account: Account;
    specific: Specific<T>;
}

/**
 * Controls the flow of creating a TransferToEncrypted/TransferToPublic transfer.
 */
export default function InternalTransfer<T>({ account, specific }: Props<T>) {
    const dispatch = useDispatch();
    const location = useLocation<TransferState>();

    const [subLocation, setSubLocation] = useState<string>(
        location?.state?.initialPage || locations.pickAmount
    );

    // This is a string, to allows user input in GTU
    const [amount, setAmount] = useState<string>(location?.state?.amount);

    function ChosenComponent() {
        switch (subLocation) {
            case locations.pickAmount:
                return (
                    <PickAmount
                        header={specific.amountHeader}
                        amount={amount}
                        setAmount={setAmount}
                        toPickRecipient={undefined}
                        toConfirmTransfer={async () => {
                            const transaction = await specific.createTransaction(
                                account.address,
                                toMicroUnits(amount)
                            );

                            const transactionJSON = stringify(transaction);
                            dispatch(
                                push({
                                    pathname: routes.SUBMITTRANSFER,
                                    state: {
                                        confirmed: {
                                            pathname: specific.location,
                                            state: {
                                                initialPage:
                                                    locations.transferSubmitted,
                                                transaction: transactionJSON,
                                            },
                                        },
                                        cancelled: {
                                            pathname: specific.location,
                                            state: {
                                                initialPage:
                                                    locations.pickAmount,
                                                amount,
                                            },
                                        },
                                        transaction: transactionJSON,
                                        account,
                                    },
                                })
                            );
                        }}
                    />
                );
            case locations.transferSubmitted: {
                return <FinalPage location={location} />;
            }
            default:
                return null;
        }
    }

    return (
        <>
            <Grid columns="3">
                <Grid.Column>
                    {subLocation === locations.confirmTransfer ? (
                        <Button
                            onClick={() => setSubLocation(locations.pickAmount)}
                        >
                            {'<--'}
                        </Button>
                    ) : null}
                </Grid.Column>
                <Grid.Column textAlign="center">
                    <Header>{specific.title}</Header>
                </Grid.Column>
                <Grid.Column textAlign="right">
                    <Link to={routes.ACCOUNTS}>
                        <Button>x</Button>
                    </Link>
                </Grid.Column>
            </Grid>
            <ChosenComponent />
        </>
    );
}
