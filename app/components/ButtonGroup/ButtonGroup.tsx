import React from 'react';
import Button, { ButtonProps } from '~/cross-app-components/Button';
import styles from './ButtonGroup.module.scss';

interface Element {
    label: string;
}

interface Props<T> {
    buttons: T[];
    isSelected: (button: T) => boolean;
    title: string;
    name: string;
    buttonClassName?: string;
    onClick: (value: T) => void;
}

/**
 * @description
 */
export default function Group<T extends Element>({
    title,
    isSelected,
    buttons,
    name,
    buttonClassName,
    onClick,
    ...props
}: Omit<ButtonProps, 'as' | 'onClick'> & Props<T>): JSX.Element {
    return (
        <div className={styles.buttonGroup}>
            <p className={styles.title}>{title}</p>
            <div className={styles.buttons}>
                {buttons.map((button) => (
                    <Button
                        key={button.label}
                        name={name}
                        inverted={!isSelected(button)}
                        className={buttonClassName}
                        {...props}
                        onClick={() => onClick(button)}
                    >
                        {button.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
