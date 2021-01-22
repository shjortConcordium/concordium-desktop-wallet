import { ExchangeRate, UpdateHeader, UpdateInstruction } from './types';

/**
 * Serializes an ExchangeRate to bytes.
 */
function serializeExchangeRate(exchangeRate: ExchangeRate) {
    const serializedExchangeRate = Buffer.alloc(16);
    serializedExchangeRate.writeBigUInt64BE(BigInt(exchangeRate.numerator), 0);
    serializedExchangeRate.writeBigUInt64BE(
        BigInt(exchangeRate.denominator),
        8
    );
    return serializedExchangeRate;
}

/**
 * Serializes the payload of an UpdateInstruction. As the payload can contain
 * different types, this function has to determine the type and then serialize
 * accordingly.
 */
function serializeUpdatePayload(payload): Buffer {
    return serializeExchangeRate(payload);
}

/**
 * Serializes an UpdateHeader to exactly 28 bytes. See the interface
 * UpdateHeader for comments regarding the byte allocation for each field.
 */
function serializeUpdateHeader(updateHeader: UpdateHeader): Buffer {
    const serializedUpdateHeader = Buffer.alloc(28);
    serializedUpdateHeader.writeBigUInt64BE(
        BigInt(updateHeader.sequenceNumber),
        0
    );
    serializedUpdateHeader.writeBigUInt64BE(
        BigInt(updateHeader.effectiveTime),
        8
    );
    serializedUpdateHeader.writeBigUInt64BE(BigInt(updateHeader.timeout), 16);
    serializedUpdateHeader.writeInt32BE(updateHeader.payloadSize, 24);
    return serializedUpdateHeader;
}

/**
 * Serializes an UpdateInstruction into its byte representation that can be
 * understood by the chain. Note that this excludes the signatures, and the
 * result of the method is what should be signed before being submitted to
 * the chain.
 */
export default function serializeUpdateInstruction(
    updateInstruction: UpdateInstruction
) {
    const serializedPayload = serializeUpdatePayload(updateInstruction.payload);
    const updateHeaderWithPayloadSize = {
        ...updateInstruction.header,
        payloadSize: serializedPayload.length,
    };
    const serializedHeader = serializeUpdateHeader(updateHeaderWithPayloadSize);

    const serializedUpdateType = Buffer.alloc(1);
    serializedUpdateType.writeInt8(updateInstruction.type, 0);

    return Buffer.concat([
        serializedHeader,
        serializedUpdateType,
        serializedPayload,
    ]);
}
