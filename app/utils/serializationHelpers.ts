import { Buffer } from 'buffer/';
import { decode as bs58Decode } from 'bs58check';

import {
    VerifyKey,
    YearMonth,
    SchemeId,
    CredentialDeploymentInformation,
    Description,
    IpInfo,
    SerializedDescription,
    SerializedTextWithLength,
    AttributeKey,
} from './types';

export function putBase58Check(
    array: Uint8Array,
    startIndex: number,
    base58Sstring: string
) {
    const decoded = bs58Decode(base58Sstring);
    for (let i = 1; i < decoded.length; i += 1) {
        array[startIndex + i - 1] = decoded[i];
    }
}

export function base58ToBuffer(base58Sstring: string): Buffer {
    // Remove the first check byte
    return Buffer.from(bs58Decode(base58Sstring).slice(1));
}

type Indexable = Buffer | Uint8Array;

export function put(array: Indexable, start: number, input: Indexable) {
    for (let i = 0; i < input.length; i += 1) {
        array[start + i] = input[i];
    }
}

export function encodeWord16(value: number): Buffer {
    const arr = new ArrayBuffer(2); // an Int16 takes 2 bytes
    const view = new DataView(arr);
    view.setUint16(0, value, false); // byteOffset = 0; litteEndian = false
    return Buffer.from(new Uint8Array(arr));
}

export function encodeWord32(value: number): Buffer {
    const arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    const view = new DataView(arr);
    view.setUint32(0, value, false); // byteOffset = 0; litteEndian = false
    return Buffer.from(new Uint8Array(arr));
}

export function encodeWord64(value: bigint): Buffer {
    const arr = new ArrayBuffer(8); // an Int64 takes 8 bytes
    const view = new DataView(arr);
    view.setBigUint64(0, value, false); // byteOffset = 0; litteEndian = false
    return Buffer.from(new Uint8Array(arr));
}

export function hashSha256(...inputs: Indexable[]): Buffer {
    const hash = window.cryptoMethods.sha256(inputs);
    return Buffer.from(hash);
}

export function parseHexString(hexString: string): Buffer {
    return Buffer.from(hexString, 'hex');
}

// Given an integer, outputs the value as Hex,
// with prepended zeroes according to minLength.
export function toHex(value: number, minLength = 2) {
    let hex = value.toString(16);
    while (hex.length < minLength) {
        hex = `0${hex}`;
    }
    return hex;
}

export function serializeVerifyKey(key: VerifyKey): Buffer {
    const scheme = key.schemeId as keyof typeof SchemeId;
    let schemeId;
    if (SchemeId[scheme] !== undefined) {
        schemeId = SchemeId[scheme];
    } else {
        throw new Error(`Unknown key type: ${scheme}`);
    }
    const keyBuffer = Buffer.from(key.verifyKey, 'hex');
    const schemeBuffer = Buffer.alloc(1);
    schemeBuffer.writeUInt8(schemeId, 0);
    return Buffer.concat([schemeBuffer, keyBuffer]);
}

export function serializeMap<K extends string | number | symbol, T>(
    map: Record<K, T>,
    putSize: (size: number) => Buffer,
    putKey: (k: K) => Buffer,
    putValue: (t: T) => Buffer
): Buffer {
    const keys = Object.keys(map) as K[];
    const buffers = [putSize(keys.length)];
    keys.forEach((key: K) => {
        buffers.push(putKey(key));
        buffers.push(putValue(map[key]));
    });
    return Buffer.concat(buffers);
}

export function serializeList<T>(
    list: T[],
    putSize: (size: number) => Buffer,
    putMember: (t: T) => Buffer
): Buffer {
    const buffers = [putSize(list.length)];
    list.forEach((member: T) => {
        buffers.push(putMember(member));
    });
    return Buffer.concat(buffers);
}

export function serializeYearMonth(yearMonth: YearMonth) {
    const year = parseInt(yearMonth.substring(0, 4), 10);
    const month = parseInt(yearMonth.substring(4, 6), 10);

    const buffer = Buffer.alloc(3);
    buffer.writeUInt16BE(year, 0);
    buffer.writeUInt8(month, 2);
    return buffer;
}

export const putInt8 = (i: number) => Buffer.from(Uint8Array.of(i));

export const putHexString = (s: string) => Buffer.from(s, 'hex');

export function serializeBoolean(b: boolean): Buffer {
    return Buffer.from(Uint8Array.of(b ? 1 : 0));
}

export function serializeCredentialDeploymentInformation(
    credential: CredentialDeploymentInformation
) {
    const buffers = [];
    buffers.push(
        serializeMap(
            credential.credentialPublicKeys.keys,
            putInt8,
            putInt8,
            serializeVerifyKey
        )
    );
    buffers.push(
        Buffer.from(Uint8Array.of(credential.credentialPublicKeys.threshold))
    );
    buffers.push(Buffer.from(credential.credId, 'hex'));
    buffers.push(encodeWord32(credential.ipIdentity));
    buffers.push(putInt8(credential.revocationThreshold));
    buffers.push(
        serializeMap(
            credential.arData,
            encodeWord16,
            (key) => encodeWord32(parseInt(key, 10)),
            (arData) => Buffer.from(arData.encIdCredPubShare, 'hex')
        )
    );
    buffers.push(serializeYearMonth(credential.policy.validTo));
    buffers.push(serializeYearMonth(credential.policy.createdAt));
    const revealedAttributes = Object.entries(
        credential.policy.revealedAttributes
    );
    const attributesLength = Buffer.alloc(2);
    attributesLength.writeUInt16BE(revealedAttributes.length, 0);
    buffers.push(attributesLength);

    const revealedAttributeTags: [
        number,
        string
    ][] = revealedAttributes.map(([tagName, value]) => [
        AttributeKey[tagName as keyof typeof AttributeKey],
        value,
    ]);
    revealedAttributeTags
        .sort((a, b) => a[0] - b[0])
        .forEach(([tag, value]) => {
            const serializedAttributeValue = Buffer.from(value, 'utf-8');
            const data = Buffer.alloc(2);
            data.writeUInt8(tag, 0);
            data.writeUInt8(serializedAttributeValue.length, 1);
            buffers.push(data);
            buffers.push(serializedAttributeValue);
        });
    const proofs = Buffer.from(credential.proofs, 'hex');
    buffers.push(encodeWord32(proofs.length));
    buffers.push(proofs);
    return Buffer.concat(buffers);
}

/**
 *  Given a string, return a serializedTextWithLength object.
 * N.B. This function assumes the text length can fit into a uint32, and the length buffer will always have a length of 4 bytes.
 */
function getSerializedTextWithLength(text: string): SerializedTextWithLength {
    const encoded = Buffer.from(new TextEncoder().encode(text));
    const serializedLength = encodeWord32(encoded.length);
    return {
        data: encoded,
        length: serializedLength,
    };
}

/**
 * converts a Description object into a SerializedDescription.
 * (Which is used in IpInfo and ArInfo)
 */
export function getSerializedDescription(
    description: Description
): SerializedDescription {
    return {
        name: getSerializedTextWithLength(description.name),
        url: getSerializedTextWithLength(description.url),
        description: getSerializedTextWithLength(description.description),
    };
}

function serializeDescription(description: Description): Buffer {
    const sd = getSerializedDescription(description);
    return Buffer.concat([
        sd.name.length,
        sd.name.data,
        sd.url.length,
        sd.url.data,
        sd.description.length,
        sd.description.data,
    ]);
}

/**
 * Serializes an IpInfo object.
 * N.B. does not include the length of the entire object.
 */
export function serializeIpInfo(ipInfo: IpInfo) {
    const id = encodeWord32(ipInfo.ipIdentity);
    const description = serializeDescription(ipInfo.ipDescription);
    const verifyKey = Buffer.from(ipInfo.ipVerifyKey, 'hex');
    const cdiVerifyKey = Buffer.from(ipInfo.ipCdiVerifyKey, 'hex');
    return Buffer.concat([id, description, verifyKey, cdiVerifyKey]);
}
