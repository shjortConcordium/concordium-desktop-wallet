import PromiseWorker from 'promise-worker';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import RustWorker from 'worker-loader!./rust.worker';
import { PublicInformationForIP } from './types';
import ConcordiumLedgerClient from '../features/ledger/ConcordiumLedgerClient';
import workerCommands from '../constants/workerCommands.json';
import { sendTransaction } from './client';

export async function createIdentityRequestObjectLedger(
    ipInfo,
    arsInfos,
    global,
    displayMessage
) {
    const transport = await TransportNodeHid.open('');
    const ledger = new ConcordiumLedgerClient(transport);

    const identity = 4;

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
    const pubInfoForIp = JSON.parse(pubInfoForIpString);
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

export async function createCredential(identity, context, displayMessage) {
    const transport = await TransportNodeHid.open('');
    const ledger = new ConcordiumLedgerClient(transport);

    const rawWorker = new RustWorker();
    const worker = new PromiseWorker(rawWorker);

    displayMessage('Please confirm exporting public key on device');
    // const publicKey = await ledger.getPublicKey([0, 0, identity.getLedgerId, 2, 0, 0]);
    displayMessage('Please wait');

    displayMessage('Please confirm exporting prf key on device');
    const prfKeySeed = await ledger.getPrfKey(identity);

    displayMessage('Please confirm exporting id cred sec on device');
    const idCredSecSeed = await ledger.getIdCredSec(identity);
    displayMessage('Please wait');

    const credentialInput = {
        ipInfo: context.ipInfo,
        arsInfos: context.arsInfos,
        global: context.global.value,
        identityObject: identity.getIdentityObject(),
        publicKeys: [
            {
                schemeId: 'Ed25519',
                verifyKey:
                    '3d0f6d2919f9b47d446426a9b4c3f80557175856b4f886e6340aef337aaf5c6a', // publicKey.toString('hex'),
            },
        ],
        threshold: 1,
        accountNumber: 1,
        revealedAttributes: [],
        randomness: {
            randomness: identity.getRandomness(),
        },
        prfKey: prfKeySeed.toString('hex'),
        idCredSec: idCredSecSeed.toString('hex'),
    };

    console.log(credentialInput.identityObject);
    const unsignedCredentialDeploymentInfoString = await worker.postMessage({
        command: workerCommands.createUnsignedCredential,
        input: JSON.stringify(credentialInput),
    });
    console.log(unsignedCredentialDeploymentInfoString);
    const unsignedCredentialDeploymentInfo = JSON.parse(
        unsignedCredentialDeploymentInfoString
    );
    console.log(unsignedCredentialDeploymentInfo);
    displayMessage(`
Please sign challenge on device:
Challenge: ${unsignedCredentialDeploymentInfo.proofs.unsigned_challenge}
`);
    // sign: unsigned_credential.proofs.unsigned_challenge
    const challengeSignature; // TODO: fix this
    displayMessage('Please wait');

    const credentialDeploymentInfo = await worker.postMessage({
        command: workerCommands.createCredential,
        input: JSON.stringify({
            unsignedInfo: unsignedCredentialDeploymentInfo,
            signature: challengeSignature,
        }),
    });
    return credentialDeploymentInfo;
}
