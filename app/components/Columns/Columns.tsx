import clsx from 'clsx';
import React, {
    Children,
    cloneElement,
    FC,
    ReactElement,
    useCallback,
    useMemo,
} from 'react';
import Column, { ColumnProps } from './Column';

import styles from './Columns.module.scss';

export interface ColumnsProps {
    /**
     * @description
     * Controls whether or not a divider is visible between columns.
     */
    divider?: boolean;
    /**
     * @description
     * Must be 2 <Columns.Column />
     */
    children: [ReactElement<ColumnProps>, ReactElement<ColumnProps>];
    className?: string;
    /**
     * @description
     * Used to override column styling
     */
    columnClassName?: string;
    columnScroll?: boolean;
    variableSize?: boolean;
}

/**
 * @description
 * Used to render content in a 2-column layout.
 *
 * @example
 * <Columns columnClassName={styles.columnOverride} divider>
 *   <Columns.Column>First column</Columns.Column>
 *   <Columns.Column>Second column</Columns.Column>
 * </Columns>
 */
function Columns({
    children,
    divider = false,
    columnScroll = false,
    className,
    columnClassName,
    variableSize = false,
}: ColumnsProps): JSX.Element {
    const getColProps = useCallback(
        (col: ReactElement<ColumnProps>) => ({
            ...col.props,
            className: clsx(columnClassName, col.props.className),
        }),
        [columnClassName]
    );

    const enrichedChildren = useMemo(
        () => Children.map(children, (c) => cloneElement(c, getColProps(c))),
        [children, getColProps]
    );

    return (
        <div
            className={clsx(
                styles.root,
                divider && styles.rootDivider,
                columnScroll && styles.rootColumnScroll,
                variableSize && styles.rootVariableSize,
                className
            )}
        >
            {enrichedChildren}
        </div>
    );
}

Columns.Column = Column;
(Columns.Column as FC).displayName = 'Columns.Column';

export default Columns;
