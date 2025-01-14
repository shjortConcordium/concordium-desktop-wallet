import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { Redirect, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { parse } from '~/utils/JSONHelper';
import {
    proposalsSelector,
    updateCurrentProposal,
} from '~/features/MultiSignatureSlice';
import TransactionDetails from '~/components/TransactionDetails';
import TransactionSignDigestView from '~/components/TransactionSignatureDigestView';
import {
    MultiSignatureTransaction,
    MultiSignatureTransactionStatus,
    Transaction,
    UpdateInstructionSignature,
    instanceOfAccountTransaction,
    TransactionCredentialSignature,
} from '~/utils/types';
import saveFile from '~/utils/FileHelper';
import SimpleErrorModal, {
    ModalErrorInput,
} from '~/components/SimpleErrorModal';
import routes from '~/constants/routes.json';
import findHandler from '~/utils/transactionHandlers/HandlerFinder';
import { expirationEffect } from '~/utils/ProposalHelper';
import ExpiredTransactionView from '../ExpiredTransactionView';
import Button from '~/cross-app-components/Button';
import Columns from '~/components/Columns';
import MultiSignatureLayout from '../MultiSignatureLayout';
import Form from '~/components/Form';
import FileInput from '~/components/Form/FileInput';
import { FileInputValue } from '~/components/Form/FileInput/FileInput';
import CloseProposalModal from './CloseProposalModal';
import { fileListToFileArray } from '~/components/Form/FileInput/util';
import SignatureCheckboxes from './SignatureCheckboxes';
import { getCheckboxName } from './SignatureCheckboxes/SignatureCheckboxes';
import { submittedProposalRoute } from '~/utils/routerHelper';
import getTransactionSignDigest from '~/utils/transactionHash';
import { HandleSignatureFiles, getSignatures } from './util';
import ProposalViewStatusText from './ProposalViewStatusText';
import TransactionHashView from '~/components/TransactionHash';
import { TransactionExportType } from '~/utils/transactionTypes';
import FormSubmissionWindowButton from './FormSubmissionWindowButton';

import styles from './ProposalView.module.scss';

const CLOSE_ROUTE = routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING;

interface ProposalViewProps {
    proposal: MultiSignatureTransaction;
}

/**
 * Component that displays the multi signature transaction proposal that is currently the
 * active one in the state. The component allows the user to export the proposal,
 * add signatures to the proposal, and if the signature threshold has been reached,
 * then the proposal can be submitted to a node.
 */
function ProposalView({ proposal }: ProposalViewProps) {
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showError, setShowError] = useState<ModalErrorInput>({
        show: false,
    });
    const [currentlyLoadingFile, setCurrentlyLoadingFile] = useState(false);
    const [files, setFiles] = useState<FileInputValue>(null);
    const [image, setImage] = useState<string>();
    const dispatch = useDispatch();
    const form = useForm();

    const transaction: Transaction = useMemo(
        () => parse(proposal.transaction),
        [proposal]
    );

    const signatures = getSignatures(transaction);

    useEffect(() => {
        return expirationEffect(proposal, dispatch);
    }, [proposal, dispatch]);

    async function loadSignatureFiles(signatureFiles: File[]) {
        setCurrentlyLoadingFile(true);
        const buffers = (
            await Promise.all(signatureFiles.map((f) => f.arrayBuffer()))
        ).map((f) => Buffer.from(f));
        const error = await HandleSignatureFiles(dispatch, buffers, proposal);
        if (error) {
            setShowError(error);
        }
        setCurrentlyLoadingFile(false);
    }

    // Every time a signature file is dropped, try loading as signature.
    useEffect(() => {
        loadSignatureFiles(fileListToFileArray(files));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    // Update form based on signatures on proposal.
    useEffect(() => {
        signatures.forEach(
            (
                _: TransactionCredentialSignature | UpdateInstructionSignature,
                i: number
            ) => form.setValue(getCheckboxName(i), true)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signatures]);

    const handler = findHandler(transaction);
    const [
        transactionSignDigest,
        setTransactionSignDigest,
    ] = useState<string>();
    useEffect(() => {
        getTransactionSignDigest(transaction)
            .then((digest) => setTransactionSignDigest(digest))
            .catch(() => {});
    }, [transaction]);

    function submitTransaction() {
        dispatch(
            push({
                pathname: submittedProposalRoute(proposal.id),
            })
        );
    }

    async function closeProposal() {
        const closedProposal: MultiSignatureTransaction = {
            ...proposal,
            status: MultiSignatureTransactionStatus.Closed,
        };
        updateCurrentProposal(dispatch, closedProposal);
    }

    const missingSignatures = signatures.length !== proposal.threshold;

    const isOpen = proposal.status === MultiSignatureTransactionStatus.Open;

    if (!transactionSignDigest) {
        return null;
    }

    return (
        <MultiSignatureLayout
            pageTitle={handler.title}
            print={handler.print(transaction, proposal.status, image)}
            stepTitle={`Transaction Proposal - ${handler.type}`}
            disableBack={instanceOfAccountTransaction(transaction)}
            closeRoute={CLOSE_ROUTE}
            delegateScroll
        >
            <CloseProposalModal
                open={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                proposal={proposal}
                onConfirm={async () => {
                    await closeProposal();
                    dispatch(push(CLOSE_ROUTE));
                }}
            />
            <SimpleErrorModal
                show={showError.show}
                header={showError.header}
                content={showError.content}
                onClick={() => setShowError({ show: false })}
            />
            <Form
                formMethods={form}
                onSubmit={submitTransaction}
                className={styles.subtractContainerPadding}
            >
                <Columns divider columnScroll columnClassName={styles.column}>
                    <Columns.Column header="Transaction Details">
                        <div className={styles.columnContent}>
                            <TransactionDetails transaction={transaction} />
                            <ExpiredTransactionView
                                transaction={transaction}
                                proposal={proposal}
                            />
                        </div>
                    </Columns.Column>
                    <Columns.Column
                        header="Signatures"
                        className={styles.stretchColumn}
                    >
                        <div className={styles.columnContent}>
                            <div>
                                <h5>
                                    {signatures.length} of {proposal.threshold}{' '}
                                    signatures.
                                </h5>
                                <div className={styles.signatureCheckboxes}>
                                    <SignatureCheckboxes
                                        threshold={proposal.threshold}
                                        signatures={signatures}
                                    />
                                </div>
                            </div>
                            {isOpen && (
                                <FileInput
                                    placeholder="Drag and drop signatures here"
                                    buttonTitle="or browse to file"
                                    value={files}
                                    onChange={setFiles}
                                    multiple
                                    className={styles.fileInput}
                                    disabled={
                                        !missingSignatures ||
                                        currentlyLoadingFile ||
                                        !isOpen
                                    }
                                />
                            )}
                        </div>
                    </Columns.Column>
                    <Columns.Column
                        header="Security & Submission Details"
                        className={styles.stretchColumn}
                    >
                        <div className={styles.columnContent}>
                            <div>
                                <ProposalViewStatusText {...proposal} />
                                <TransactionSignDigestView
                                    transactionSignDigest={
                                        transactionSignDigest
                                    }
                                    setScreenshot={setImage}
                                />
                                {missingSignatures ? null : (
                                    <TransactionHashView
                                        transaction={transaction}
                                    />
                                )}
                                <br />
                                {isOpen && (
                                    <Button
                                        size="tiny"
                                        inverted
                                        className={styles.closeProposalButton}
                                        onClick={() => setShowCloseModal(true)}
                                    >
                                        Cancel proposal
                                    </Button>
                                )}
                            </div>
                            {isOpen && (
                                <div className={styles.actions}>
                                    <Button
                                        className={styles.exportButton}
                                        onClick={
                                            () =>
                                                saveFile(proposal.transaction, {
                                                    title: 'Export transaction',
                                                    defaultPath: handler.getFileNameForExport(
                                                        transaction,
                                                        TransactionExportType.Proposal
                                                    ),
                                                })
                                            // TODO Handle failure
                                        }
                                    >
                                        Export transaction proposal
                                    </Button>
                                    <Form.Checkbox
                                        className={styles.finalCheckbox}
                                        name="finalCheck"
                                        rules={{ required: true }}
                                    >
                                        I understand this is the final
                                        submission and cannot be reverted
                                    </Form.Checkbox>
                                    <FormSubmissionWindowButton
                                        transaction={transaction}
                                    />
                                </div>
                            )}
                        </div>
                    </Columns.Column>
                </Columns>
            </Form>
        </MultiSignatureLayout>
    );
}

export default function ProposalViewContainer(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const proposals = useSelector(proposalsSelector);
    const proposal = proposals.find((p) => p.id === parseInt(id, 10));

    if (!proposal) {
        return <Redirect to={routes.MULTISIGTRANSACTIONS_PROPOSAL_EXISTING} />;
    }

    return <ProposalView proposal={proposal} />;
}
