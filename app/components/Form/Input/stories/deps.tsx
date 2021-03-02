/* eslint-disable import/prefer-default-export */
import React from 'react';
import { ArgTypes, Story } from '@storybook/react/types-6-0';

import Input, { InputProps } from '../Input';

export const argTypes: ArgTypes = {
    onChange: {
        description:
            'EventHandler corresponding to that of &lt;input type="Input" /&gt;',
    },
    error: {
        description:
            'If set to anything other than undefined, renders field as invalid.',
    },
    value: {
        description:
            'Use with onChange() to use the component as a controlled field',
    },
};

export const Template: Story<InputProps> = (args) => <Input {...args} />;