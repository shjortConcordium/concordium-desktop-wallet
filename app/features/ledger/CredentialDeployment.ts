import type Transport from '@ledgerhq/hw-transport';
import {
    UnsignedCredentialDeploymentInformation,
    IdOwnershipProofs,
    ChosenAttributes,
} from '../../utils/types';
import {
    putBase58Check,
    serializeVerifyKey,
} from '../../utils/serializationHelpers';
import pathAsBuffer from './Path';

function serializeIdOwnerShipProofs(proofs: IdOwnershipProofs) {
    const proofIdCredPub = Buffer.alloc(4);
    proofIdCredPub.writeInt32BE(
        Object.entries(proofs.proofIdCredPub).length,
        0
    );
    // TODO: Make sure that these are sorted, otherwise sort them.
    const idCredPubProofs = Buffer.concat(
        Object.entries(proofs.proofIdCredPub).map(([index, value]) => {
            const proof = Buffer.alloc(4 + 96);
            proof.writeInt32BE(parseInt(index, 10), 0);
            proof.write(value, 4, 100, 'hex');
            return proof;
        })
    );

    return Buffer.concat([
        Buffer.from(proofs.sig, 'hex'),
        Buffer.from(proofs.commitments, 'hex'),
        Buffer.from(proofs.challenge, 'hex'),
        proofIdCredPub,
        idCredPubProofs,
        Buffer.from(proofs.proofIpSig, 'hex'),
        Buffer.from(proofs.proofRegId, 'hex'),
        Buffer.from(proofs.credCounterLessThanMaxAccounts, 'hex'),
    ]);
}

const INS_SIGN_CREDENTIAL_DEPLOYMENT = 0x04;

async function signCredentialDeployment(
    transport: Transport,
    credentialDeployment: UnsignedCredentialDeploymentInformation,
    newOrExisting: Buffer,
    path: number[]
): Promise<Buffer> {
    const pathPrefix = pathAsBuffer(path);

    let p1 = 0x00;
    const p2 = 0x00;

    const publicKeys = credentialDeployment.credentialPublicKeys;
    const verificationKeyListLength = Object.entries(publicKeys.keys).length;

    await transport.send(
        0xe0,
        INS_SIGN_CREDENTIAL_DEPLOYMENT,
        p1,
        p2,
        pathPrefix
    );
    p1 = 0x0a;
    let data = Buffer.alloc(1);
    data.writeUInt8(verificationKeyListLength, 0);
    await transport.send(0xe0, INS_SIGN_CREDENTIAL_DEPLOYMENT, p1, p2, data);

    const keyIndices = Object.keys(publicKeys.keys)
        .map((idx) => parseInt(idx, 10))
        .sort();

    p1 = 0x01;
    for (let i = 0; i < verificationKeyListLength; i += 1) {
        const index = keyIndices[i];
        const verificationKey = publicKeys.keys[index];
        data = Buffer.concat([
            Uint8Array.of(index),
            serializeVerifyKey(verificationKey),
        ]);

        // eslint-disable-next-line  no-await-in-loop
        await transport.send(
            0xe0,
            INS_SIGN_CREDENTIAL_DEPLOYMENT,
            p1,
            p2,
            data
        );
    }

    const signatureThreshold = Uint8Array.of(publicKeys.threshold);
    const credId = Buffer.from(credentialDeployment.credId, 'hex');

    const identityProviderIdentity = Buffer.alloc(4);
    identityProviderIdentity.writeInt32BE(credentialDeployment.ipIdentity, 0);

    const arThreshold = Uint8Array.of(credentialDeployment.revocationThreshold);
    const arListLength = Object.entries(credentialDeployment.arData).length;
    const arListLengthAsBytes = Buffer.alloc(2);
    arListLengthAsBytes.writeUInt16BE(arListLength, 0);

    data = Buffer.concat([
        signatureThreshold,
        credId,
        identityProviderIdentity,
        arThreshold,
        arListLengthAsBytes,
    ]);
    p1 = 0x02;
    await transport.send(0xe0, INS_SIGN_CREDENTIAL_DEPLOYMENT, p1, p2, data);

    p1 = 0x03;

    const arIdentities = Object.keys(credentialDeployment.arData);
    for (let i = 0; i < arIdentities.length; i += 1) {
        const arIdentity = arIdentities[i];
        const encIdCredPub = Buffer.from(
            credentialDeployment.arData[arIdentity].encIdCredPubShare,
            'hex'
        );
        const arData = Buffer.alloc(4);
        arData.writeUInt32BE(parseInt(arIdentity, 10), 0);
        data = Buffer.concat([arData, encIdCredPub]);

        // eslint-disable-next-line  no-await-in-loop
        await transport.send(
            0xe0,
            INS_SIGN_CREDENTIAL_DEPLOYMENT,
            p1,
            p2,
            data
        );
    }

    p1 = 0x04;
    const validTo = Buffer.alloc(3);
    const ValidToYear = parseInt(
        credentialDeployment.policy.validTo.substring(0, 4),
        10
    );
    const ValidToMonth = parseInt(
        credentialDeployment.policy.validTo.substring(4, 6),
        10
    );

    validTo.writeUInt16BE(ValidToYear, 0);
    validTo.writeUInt8(ValidToMonth, 2);

    const createdAt = Buffer.alloc(3);
    const createdAtYear = parseInt(
        credentialDeployment.policy.createdAt.substring(0, 4),
        10
    );
    const createdAtMonth = parseInt(
        credentialDeployment.policy.createdAt.substring(4, 6),
        10
    );

    createdAt.writeUInt16BE(createdAtYear, 0);
    createdAt.writeUInt8(createdAtMonth, 2);

    const revealedAttributeTags: [number, string][] = Object.entries(
        credentialDeployment.policy.revealedAttributes
    ).map(([tagName, value]) => [
        ChosenAttributes[tagName as keyof typeof ChosenAttributes],
        value,
    ]);
    revealedAttributeTags.sort((a, b) => a[0] - b[0]);

    const attributeListLength = revealedAttributeTags.length;
    const attributeListLengthAsBytes = Buffer.alloc(2);
    attributeListLengthAsBytes.writeUInt16BE(attributeListLength, 0);

    data = Buffer.concat([validTo, createdAt, attributeListLengthAsBytes]);
    await transport.send(0xe0, INS_SIGN_CREDENTIAL_DEPLOYMENT, p1, p2, data);

    for (let i = 0; i < attributeListLength; i += 1) {
        const [attributeTag, attributeValue] = revealedAttributeTags[i];
        data = Buffer.alloc(2);
        data.writeUInt8(attributeTag, 0);
        const serializedAttributeValue = Buffer.from(attributeValue, 'utf-8');
        data.writeUInt8(serializedAttributeValue.length, 1);

        p1 = 0x05;
        // eslint-disable-next-line  no-await-in-loop
        await transport.send(
            0xe0,
            INS_SIGN_CREDENTIAL_DEPLOYMENT,
            p1,
            p2,
            data
        );

        p1 = 0x06;
        data = serializedAttributeValue;
        // eslint-disable-next-line  no-await-in-loop
        await transport.send(
            0xe0,
            INS_SIGN_CREDENTIAL_DEPLOYMENT,
            p1,
            p2,
            data
        );
    }

    const proofs = serializeIdOwnerShipProofs(credentialDeployment.proofs);
    const proofLength = Buffer.alloc(4);
    proofLength.writeInt32BE(proofs.length, 0);
    p1 = 0x07;
    await transport.send(
        0xe0,
        INS_SIGN_CREDENTIAL_DEPLOYMENT,
        p1,
        p2,
        proofLength
    );

    p1 = 0x08;

    let i = 0;
    while (i < proofs.length) {
        // eslint-disable-next-line  no-await-in-loop
        await transport.send(
            0xe0,
            INS_SIGN_CREDENTIAL_DEPLOYMENT,
            p1,
            p2,
            proofs.slice(i, Math.min(i + 255, proofs.length))
        );
        i += 255;
    }

    p1 = 0x09;
    const response = await transport.send(
        0xe0,
        INS_SIGN_CREDENTIAL_DEPLOYMENT,
        p1,
        p2,
        newOrExisting
    );

    const signature = response.slice(0, 64);
    return signature;
}

export async function signNewCredentialDeployment(
    transport: Transport,
    credentialDeployment: UnsignedCredentialDeploymentInformation,
    expiry: bigint,
    path: number[]
): Promise<Buffer> {
    const expiryBuffer = Buffer.alloc(1 + 64);
    expiryBuffer.writeInt8(0, 0);
    expiryBuffer.writeBigInt64BE(expiry, 1);
    return signCredentialDeployment(
        transport,
        credentialDeployment,
        expiryBuffer,
        path
    );
}

export async function signExistingCredentialDeployment(
    transport: Transport,
    credentialDeployment: UnsignedCredentialDeploymentInformation,
    accountAddress: string,
    path: number[]
): Promise<Buffer> {
    const accountBuffer = Buffer.alloc(1 + 32);
    accountBuffer.writeInt8(1, 0);
    putBase58Check(accountBuffer, 1, accountAddress);
    return signCredentialDeployment(
        transport,
        credentialDeployment,
        accountBuffer,
        path
    );
}