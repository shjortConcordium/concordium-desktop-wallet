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
import { createShieldAmountTransaction } from '../../utils/transactionHelpers';
import { TransferState } from '../../utils/transactionTypes';

interface Props {
    account: Account;
}

/**
 * Controls the flow of creating a transfer to encrypted.
 */
export default function ShieldAmount({ account }: Props) {
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
                        header="Shield funds"
                        amount={amount}
                        setAmount={setAmount}
                        toPickRecipient={undefined}
                        toConfirmTransfer={async () => {
                            const transaction = await createShieldAmountTransaction(
                                account.address,
                                toMicroUnits(amount)
                            );

                            dispatch(
                                push({
                                    pathname: routes.SUBMITTRANSFER,
                                    state: {
                                        confirmed: {
                                            pathname:
                                                routes.ACCOUNTS_SHIELDAMOUNT,
                                            state: {
                                                initialPage:
                                                    locations.transferSubmitted,
                                                transaction: stringify(
                                                    transaction
                                                ),
                                            },
                                        },
                                        cancelled: {
                                            pathname:
                                                routes.ACCOUNTS_SHIELDAMOUNT,
                                            state: {
                                                initialPage:
                                                    locations.pickAmount,
                                                amount,
                                            },
                                        },
                                        transaction: stringify(transaction),
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
                    <Header>Shield Amount</Header>
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