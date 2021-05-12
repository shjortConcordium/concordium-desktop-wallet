import { getId, insertWallet } from '~/database/WalletDao';
import ConcordiumLedgerClient from '~/features/ledger/ConcordiumLedgerClient';
import { getPairingPath } from '~/features/ledger/Path';
import { WalletType } from './types';

/**
 * Pairs a (hardware) wallet with the desktop wallet. If the (hardware) wallet was already
 * paired with the desktop wallet, then no changes are made to the database.
 * @param ledger the wallet device to pair with
 * @returns the id of the inserted wallet, or the already paired wallet
 */
export default async function pairWallet(
    ledger: ConcordiumLedgerClient
): Promise<number> {
    const pairingKey = (
        await ledger.getPublicKeySilent(getPairingPath())
    ).toString('hex');
    const walletId = await getId(pairingKey);
    if (walletId === undefined) {
        return insertWallet(pairingKey, WalletType.LedgerNanoS);
    }
    return walletId;
}