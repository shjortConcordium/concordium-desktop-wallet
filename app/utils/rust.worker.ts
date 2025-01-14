import 'regenerator-runtime/runtime';
import registerPromiseWorker from 'promise-worker/register';
import { parse } from './JSONHelper';
import workerCommands from '../constants/workerCommands.json';

type RustInterface = typeof import('@pkg/index');

export type BakerKeyVariants = 'ADD' | 'UPDATE';

let rustReference: RustInterface;
async function getRust(): Promise<RustInterface> {
    if (!rustReference) {
        rustReference = await import('@pkg/index');
    }
    return rustReference;
}

function buildPublicInformationForIp(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.buildPublicInformationForIp(
        message.context,
        message.idCredSec,
        message.prfKey
    );
}

function createIdRequest(rust: RustInterface, message: Record<string, string>) {
    return rust.createIdRequest(
        message.context,
        message.signature,
        message.idCredSec,
        message.prfKey
    );
}

function createUnsignedCredential(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.generateUnsignedCredential(message.input);
}

function createCredentialInfo(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.getDeploymentInfo(message.signature, message.unsignedInfo);
}

function createCredentialDetails(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.getDeploymentDetails(
        message.signature,
        message.unsignedInfo,
        parse(message.expiry)
    );
}

function decryptAmounts(rust: RustInterface, message: Record<string, string>) {
    const decryptedAmounts = rust.decrypt_amounts_ext(message.input);
    return decryptedAmounts;
}

function createTransferToPublicData(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.createTransferToPublicData(message.input);
}

function createTransferToEncryptedData(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.createTransferToEncryptedData(message.input);
}

function createEncryptedTransferData(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.createEncryptedTransferData(message.input);
}

function createGenesisAccount(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.createGenesisAccount(
        message.context,
        message.idCredSec,
        message.prfKey
    );
}

function generateBakerKeys(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.generateBakerKeys(
        message.sender,
        message.keyVariant === 'ADD'
            ? rust.BakerKeyVariant.ADD
            : rust.BakerKeyVariant.UPDATE
    );
}

function getAddressFromCredId(
    rust: RustInterface,
    message: Record<string, string>
) {
    return rust.getAddressFromCredId(message.credId);
}

function getCredId(rust: RustInterface, message: Record<string, string>) {
    return rust.getCredId(
        message.prfKey,
        parseInt(message.credentialNumber, 10),
        message.global
    );
}

function mapCommand(command: string) {
    switch (command) {
        case workerCommands.buildPublicInformationForIp:
            return buildPublicInformationForIp;
        case workerCommands.createIdRequest:
            return createIdRequest;
        case workerCommands.createUnsignedCredential:
            return createUnsignedCredential;
        case workerCommands.createCredentialInfo:
            return createCredentialInfo;
        case workerCommands.createCredentialDetails:
            return createCredentialDetails;
        case workerCommands.decryptAmounts:
            return decryptAmounts;
        case workerCommands.createTransferToPublicData:
            return createTransferToPublicData;
        case workerCommands.createTransferToEncryptedData:
            return createTransferToEncryptedData;
        case workerCommands.createEncryptedTransferData:
            return createEncryptedTransferData;
        case workerCommands.createGenesisAccount:
            return createGenesisAccount;
        case workerCommands.generateBakerKeys:
            return generateBakerKeys;
        case workerCommands.getAddressFromCredId:
            return getAddressFromCredId;
        case workerCommands.getCredId:
            return getCredId;
        default:
            return () => 'unknown command';
    }
}

async function workerFunction(message: Record<string, string>) {
    const rust = await getRust();
    const func = mapCommand(message.command);
    return func(rust, message);
}

registerPromiseWorker(workerFunction);
