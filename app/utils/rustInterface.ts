import PromiseWorker from 'promise-worker';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import RustWorker from 'worker-loader!./rust.worker';
import { PublicInformationForIP } from './types';
import ConcordiumLedgerClient from '../features/ledger/ConcordiumLedgerClient';
import workerCommands from '../constants/workerCommands.json';

export async function createIdentityRequestObjectLedger(
    identity,
    ipInfo,
    arsInfos,
    global,
    displayMessage
) {
    const transport = await TransportNodeHid.open('');
    const ledger = new ConcordiumLedgerClient(transport);

    displayMessage('Please confirm exporting prf key on device');
    const prfKeySeed = await ledger.getPrfKey(identity);

    displayMessage('Please confirm exporting id cred sec on device');
    const idCredSecSeed = await ledger.getIdCredSec(identity);

    const prfKey = prfKeySeed.toString('hex');
    const idCredSec = idCredSecSeed.toString('hex');
    displayMessage('Please wait');

    displayMessage('Please confirm exporting public key on device');
    const publicKey = await ledger.getPublicKey([0, 0, identity, 2, 0, 0]);
    displayMessage('Please wait');

    const rawWorker = new RustWorker();
    const worker = new PromiseWorker(rawWorker);

    const context = {
        ipInfo,
        arsInfos,
        global: global.value,
        publicKeys: [
            {
                schemeId: 'Ed25519',
                verifyKey: publicKey.toString('hex'),
            },
        ],
        threshold: 1,
    };

    const contextString = JSON.stringify(context);

    const pubInfoForIpString = await worker.postMessage({
        command: workerCommands.buildPublicInformationForIp,
        context: contextString,
        idCredSec,
        prfKey,
    });

    console.log(pubInfoForIpString);
    const pubInfoForIp: PublicInformationForIP = JSON.parse(pubInfoForIpString);
    pubInfoForIp.publicKeys.keys[0].verifyKey = `00${pubInfoForIp.publicKeys.keys[0].verifyKey}`; // TODO: attach schemeId properly.

    const path = [0, 0, identity, 2, 0, 0];
    displayMessage(`
Please sign information on device:
Identity Credentials Public (IdCredPub): ${pubInfoForIp.idCredPub}
Registration ID (RegId): ${pubInfoForIp.regId}
Verification Key: ${pubInfoForIp.publicKeys.keys[0].verifyKey}
Threshold: ${pubInfoForIp.publicKeys.threshold}
`);
    const signature = await ledger.signPublicInformationForIp(
        pubInfoForIp,
        path
    );
    displayMessage('Please wait');
    const idRequest = await worker.postMessage({
        command: workerCommands.createIdRequest,
        context: contextString,
        signature: signature.toString('hex'),
        idCredSec,
        prfKey,
    });
    console.log(idRequest);
    return JSON.parse(idRequest);
}
