import React, { PropsWithChildren } from 'react';
import PageLayout from '~/components/PageLayout';
import { PageContainerProps } from '~/components/PageLayout/PageContainer/PageContainer';
import routes from '~/constants/routes.json';

import styles from './MultiSignatureLayout.module.scss';

interface MultiSignatureLayoutProps
    extends Pick<PageContainerProps, 'closeRoute' | 'disableBack'> {
    pageTitle: string;
    stepTitle: string;
}

export default function MultiSignatureLayout({
    pageTitle,
    stepTitle,
    closeRoute = routes.MULTISIGTRANSACTIONS,
    children,
    disableBack,
}: PropsWithChildren<MultiSignatureLayoutProps>): JSX.Element {
    return (
        <PageLayout>
            <PageLayout.Header>
                <h1>{pageTitle}</h1>
            </PageLayout.Header>
            <PageLayout.Container
                className={styles.container}
                closeRoute={closeRoute}
                padding="vertical"
                disableBack={disableBack}
            >
                <h2 className={styles.header}>{stepTitle}</h2>
                <div className={styles.content}>{children}</div>
            </PageLayout.Container>
        </PageLayout>
    );
}