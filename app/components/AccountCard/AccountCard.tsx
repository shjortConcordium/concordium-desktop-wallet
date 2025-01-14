import React, { useEffect, useState, SyntheticEvent } from 'react';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import MultiSigIcon from '@resources/svg/multisig.svg';
import PendingImage from '@resources/svg/pending-arrows.svg';
import RejectedImage from '@resources/svg/warning.svg';
import ShieldImage from '@resources/svg/shield.svg';
import BakerImage from '@resources/svg/baker.svg';
import ReadonlyImage from '@resources/svg/read-only.svg';
import LedgerImage from '@resources/svg/ledger.svg';
import InfoImage from '@resources/svg/info.svg';
import { displayAsGTU } from '~/utils/gtu';
import { AccountInfo, Account, AccountStatus, ClassName } from '~/utils/types';
import { isInitialAccount, isMultiCred } from '~/utils/accountHelpers';
import SidedRow from '~/components/SidedRow';
import { walletIdSelector } from '~/features/WalletSlice';
import { findLocalDeployedCredential } from '~/utils/credentialHelper';
import { accountHasDeployedCredentialsSelector } from '~/features/CredentialSlice';

import styles from './AccountCard.module.scss';

interface ViewProps extends ClassName {
    accountName: string;
    identityName?: string;
    onClick?(shielded: boolean): void;
    active?: boolean;
    disabled?: boolean;
    initialAccount?: boolean;
    accountStatus?: AccountStatus;
    connected?: boolean;
    multiSig?: boolean;
    isBaker?: boolean;
    hasEncryptedFunds?: boolean;
    hasDeployedCredentials?: boolean;
    shielded?: bigint;
    unShielded?: bigint;
    amountAtDisposal?: bigint;
    stakedAmount?: bigint;
}

function ShieldedBalance({
    multiSig,
    shielded = 0n,
    onClick,
    hasEncryptedFunds,
}: Partial<ViewProps>) {
    const [showingInfo, setShowingInfo] = useState(false);

    const hidden = hasEncryptedFunds && (
        <>
            {' '}
            + <ShieldImage height="15" />
        </>
    );

    const rowLeftSide = <h3>Shielded Balance:</h3>;

    const closeInfo = (e: SyntheticEvent) => {
        e.stopPropagation(); // So that we avoid triggering the parent's onClick
        return setShowingInfo(false);
    };

    return (
        <>
            {multiSig || (
                <SidedRow
                    className={clsx(styles.row, 'mB0')}
                    left={rowLeftSide}
                    right={
                        <h3>
                            {displayAsGTU(shielded)}
                            {hidden}
                        </h3>
                    }
                    onClick={(e) => {
                        e.stopPropagation(); // So that we avoid triggering the parent's onClick
                        return onClick && onClick(true);
                    }}
                />
            )}
            {multiSig && !showingInfo && (
                <SidedRow
                    className={clsx(styles.row, 'textFaded mB0')}
                    left={rowLeftSide}
                    right={
                        <>
                            <h3>Unavailable</h3>
                            <InfoImage
                                onClick={(e: Event) => {
                                    e.stopPropagation(); // So that we avoid triggering the parent's onClick
                                    return setShowingInfo(true);
                                }}
                                className="mL10"
                            />
                        </>
                    }
                />
            )}
            {multiSig && showingInfo && (
                <>
                    <div
                        tabIndex={0}
                        role="button"
                        className={styles.info}
                        onClick={closeInfo}
                        onKeyPress={closeInfo}
                    >
                        <p className={styles.infoText}>
                            Shielded balances cannot be used on accounts with
                            multiple credentials.
                        </p>
                    </div>
                    <InfoImage
                        onClick={closeInfo}
                        className={styles.infoImageActivated}
                    />
                </>
            )}
        </>
    );
}

export function AccountCardView({
    className,
    active = false,
    disabled = false,
    onClick,
    accountName,
    initialAccount = false,
    isBaker = false,
    accountStatus,
    hasDeployedCredentials = false,
    connected = false,
    multiSig = false,
    identityName,
    shielded = 0n,
    unShielded = 0n,
    hasEncryptedFunds = false,
    amountAtDisposal = 0n,
    stakedAmount = 0n,
}: ViewProps): JSX.Element {
    const hidden = hasEncryptedFunds && !multiSig && (
        <>
            {' '}
            + <ShieldImage height="15" />
        </>
    );

    return (
        <div
            className={clsx(
                styles.accountListElement,
                className,
                active && styles.active,
                disabled && styles.disabled,
                Boolean(onClick) && styles.clickable
            )}
            onClick={() => onClick && onClick(false)}
            onKeyPress={() => onClick && onClick(false)}
            tabIndex={0}
            role="button"
        >
            <SidedRow
                className={styles.header}
                left={
                    <>
                        <b className={styles.accountName}>{accountName}</b>
                        {initialAccount && <>&nbsp;(Initial)</>}
                        {accountStatus === AccountStatus.Pending && (
                            <PendingImage
                                height="24"
                                className={styles.statusImage}
                            />
                        )}
                        {accountStatus === AccountStatus.Rejected && (
                            <RejectedImage
                                height="28"
                                className={styles.statusImage}
                            />
                        )}
                        {isBaker && (
                            <BakerImage
                                width="20"
                                className={styles.bakerImage}
                            />
                        )}
                        {accountStatus === AccountStatus.Confirmed &&
                            !hasDeployedCredentials && (
                                <ReadonlyImage
                                    height="15"
                                    className={styles.statusImage}
                                />
                            )}
                    </>
                }
                right={
                    <>
                        {connected && (
                            <LedgerImage height="15" className="mR10" />
                        )}
                        {multiSig ? (
                            <>
                                <div className="textRight textNoWrap">
                                    {identityName} +{' '}
                                </div>
                                <MultiSigIcon className={styles.multisig} />
                            </>
                        ) : (
                            <div className="textRight textNoWrap">
                                {identityName}
                            </div>
                        )}
                    </>
                }
            />
            <SidedRow
                className={styles.row}
                left={<h3>Account Total:</h3>}
                right={
                    <h3>
                        {displayAsGTU(shielded + unShielded)}
                        {hidden}
                    </h3>
                }
            />
            <div className={styles.dividingLine} />
            <SidedRow
                className={styles.row}
                left={<h3>Balance:</h3>}
                right={<h3>{displayAsGTU(unShielded)}</h3>}
            />
            <SidedRow
                className={styles.row}
                left="- At Disposal:"
                right={displayAsGTU(amountAtDisposal)}
            />
            <SidedRow
                className={styles.row}
                left="- Staked:"
                right={displayAsGTU(stakedAmount)}
            />
            <div className={styles.dividingLine} />
            <ShieldedBalance
                multiSig={multiSig}
                shielded={shielded}
                onClick={onClick}
                hasEncryptedFunds={hasEncryptedFunds}
            />
        </div>
    );
}

interface Props
    extends Pick<ViewProps, 'active' | 'onClick' | 'className' | 'disabled'> {
    account: Account;
    accountInfo?: AccountInfo;
}

/**
 * Displays the information and balances of the given account.
 * Takes an onClick, which is triggered by when clicking either
 * the shielded balance (with argument true)
 * or the public balances (with argument false)
 */
export default function AccountCard({
    account,
    accountInfo,
    ...viewProps
}: Props): JSX.Element {
    const walletId = useSelector(walletIdSelector);
    const [connected, setConnected] = useState(false);
    const accountHasDeployedCredentials = useSelector(
        accountHasDeployedCredentialsSelector(account)
    );

    useEffect(() => {
        if (walletId) {
            findLocalDeployedCredential(walletId, account.address)
                .then((cred) => setConnected(Boolean(cred)))
                .catch(() => setConnected(false));
        } else {
            setConnected(false);
        }
    }, [walletId, account.address]);

    const shielded = account.totalDecrypted
        ? BigInt(account.totalDecrypted)
        : 0n;
    const unShielded = accountInfo ? BigInt(accountInfo.accountAmount) : 0n;
    const scheduled =
        accountInfo && accountInfo.accountReleaseSchedule
            ? BigInt(accountInfo.accountReleaseSchedule.total)
            : 0n;
    const accountBaker = accountInfo?.accountBaker;
    const stakedAmount = accountBaker ? BigInt(accountBaker.stakedAmount) : 0n;
    const amountAtDisposal = unShielded - scheduled - stakedAmount;

    return (
        <AccountCardView
            {...viewProps}
            hasEncryptedFunds={!account.allDecrypted}
            shielded={shielded}
            unShielded={unShielded}
            amountAtDisposal={amountAtDisposal}
            stakedAmount={stakedAmount}
            connected={connected}
            hasDeployedCredentials={accountHasDeployedCredentials}
            accountName={account.name}
            accountStatus={account.status}
            multiSig={accountInfo && isMultiCred(accountInfo)}
            identityName={account.identityName}
            isBaker={Boolean(accountBaker)}
            initialAccount={isInitialAccount(account)}
        />
    );
}
