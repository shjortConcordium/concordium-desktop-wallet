import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { Redirect, useParams } from 'react-router';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { parse } from '~/utils/JSONHelper';
import {
    proposalsSelector,
    updateCurrentProposal,
} from '~/features/MultiSignatureSlice';
import TransactionDetails from '~/components/TransactionDetails';
import TransactionHashView from '~/components/TransactionHashView';
import {
    MultiSignatureTransaction,
    MultiSignatureTransactionStatus,
    Transaction,
    UpdateInstructionSignature,
    instanceOfAccountTransaction,
    TransactionCredentialSignature,
} from '~/utils/types';
import { saveFile } from '~/utils/FileHelper';
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

import styles from './ProposalView.module.scss';
import Form from '~/components/Form';
import FileInput from '~/components/Form/FileInput';
import { FileInputValue } from '~/components/Form/FileInput/FileInput';
import CloseProposalModal from './CloseProposalModal';
import { fileListToFileArray } from '~/components/Form/FileInput/util';
import SignatureCheckboxes from './SignatureCheckboxes';
import TransactionExpirationDetails from '~/components/TransactionExpirationDetails';
import { dateFromTimeStamp } from '~/utils/timeHelpers';
import { getCheckboxName } from './SignatureCheckboxes/SignatureCheckboxes';
import { submittedProposalRoute } from '~/utils/routerHelper';
import { getTimeout } from '~/utils/transactionHelpers';
import getTransactionHash from '~/utils/transactionHash';
import { HandleSignatureFile, getSignatures } from './util';
import ProposalViewStatusText from './ProposalViewStatusText';

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
    const dispatch = useDispatch();
    const form = useForm();

    const transaction: Transaction = parse(proposal.transaction);

    const signatures = getSignatures(transaction);

    useEffect(() => {
        return expirationEffect(proposal, dispatch);
    }, [proposal, dispatch]);

    async function loadSignatureFile(file: Buffer) {
        setCurrentlyLoadingFile(true);
        const error = await HandleSignatureFile(dispatch, file, proposal);
        if (error) {
            setShowError(error);
        }
        setCurrentlyLoadingFile(false);
    }

    // Every time a signature file is dropped, try loading as signature.
    useEffect(() => {
        fileListToFileArray(files)
            .map(async (f) => Buffer.from(await f.arrayBuffer()))
            .forEach((p) => p.then(loadSignatureFile));
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
    const transactionHash = getTransactionHash(transaction);

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

    return (
        <MultiSignatureLayout
            pageTitle={handler.title}
            stepTitle={`Transaction Proposal - ${handler.type}`}
            disableBack={instanceOfAccountTransaction(transaction)}
            closeRoute={CLOSE_ROUTE}
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
                className={clsx(styles.body, styles.bodySubtractPadding)}
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
                        </div>
                    </Columns.Column>
                    <Columns.Column
                        header="Security & Submission Details"
                        className={styles.stretchColumn}
                    >
                        <div className={styles.columnContent}>
                            <div>
                                <ProposalViewStatusText {...proposal} />
                                <TransactionHashView
                                    transactionHash={transactionHash}
                                />
                                <TransactionExpirationDetails
                                    title="Transaction must be submitted before:"
                                    expirationDate={dateFromTimeStamp(
                                        getTimeout(transaction)
                                    )}
                                />
                                <br />
                                <Button
                                    size="small"
                                    className={styles.closeProposalButton}
                                    onClick={() => setShowCloseModal(true)}
                                    disabled={!isOpen}
                                >
                                    Close proposal
                                </Button>
                            </div>
                            <div className={styles.actions}>
                                <Button
                                    className={styles.exportButton}
                                    disabled={!isOpen}
                                    onClick={
                                        () =>
                                            saveFile(
                                                proposal.transaction,
                                                'Export transaction'
                                            )
                                        // TODO Handle failure
                                    }
                                >
                                    Export transaction proposal
                                </Button>
                                <Form.Checkbox
                                    className={styles.finalCheckbox}
                                    name="finalCheck"
                                    rules={{ required: true }}
                                    disabled={!isOpen}
                                >
                                    I understand this is the final submission
                                    and cannot be reverted
                                </Form.Checkbox>
                                <Form.Submit disabled={!isOpen}>
                                    Submit transaction to chain
                                </Form.Submit>
                            </div>
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