/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import FIELD_TYPE from 'Component/Field/Field.config';
import {
    MIN_CHARACTER_SETS_IN_PASSWORD
} from 'Component/MyAccountCreateAccount/MyAccountCreateAccount.config';
import { VALIDATION_INPUT_TYPE } from 'Util/Validator/Config';

/**
 * Returns password change forms fields
 * @param props
 * @returns {[{addRequiredTag: boolean, validateOn: string[], validationRule: {isRequired: boolean}, label: *, type: string, attr: {defaultValue, name: string, placeholder: *}}, {addRequiredTag: boolean, validateOn: string[], validationRule: {isRequired: boolean}, label: *, type: string, attr: {defaultValue, name: string, placeholder: *}}, ...[{addRequiredTag: boolean, validateOn: string[], validationRule: {isRequired: boolean}, label: *, type: string, attr: {defaultValue, name: string, placeholder: *}}]|*[]]}
 * @namespace Component/PasswordChangeForm/Form/customerEmailAndPasswordFields */
export const customerEmailAndPasswordFields = () => [
    {
        type: FIELD_TYPE.password,
        label: __('New password'),
        attr: {
            id: 'password',
            name: 'password',
            placeholder: __('Enter your password'),
            autocomplete: 'new-password'
        },
        validateOn: ['onChange'],
        validationRule: {
            isRequired: true,
            inputType: VALIDATION_INPUT_TYPE.password,
            match: (value) => {
                // Number of different character classes in a password
                const counter = Number(/\d+/.test(value))
                  + Number(/[a-z]+/.test(value))
                  + Number(/[A-Z]+/.test(value))
                  + Number(/[^a-zA-Z0-9]+/.test(value));

                return counter >= MIN_CHARACTER_SETS_IN_PASSWORD;
            },
            customErrorMessages: {
                onMatchFail: __('Minimum of different classes of characters in password is %s.',
                    MIN_CHARACTER_SETS_IN_PASSWORD)
                    + __('Classes of characters: Lower Case, Upper Case, Digits, Special Characters.')
            },
            range: {
                min: 8
            }
        },
        addRequiredTag: true
    },
    {
        type: FIELD_TYPE.password,
        label: __('Confirm password'),
        attr: {
            id: 'password_confirmation',
            name: 'password_confirmation',
            placeholder: __('Retype your password'),
            autocomplete: 'new-password'
        },
        validateOn: ['onChange'],
        validationRule: {
            isRequired: true,
            inputType: VALIDATION_INPUT_TYPE.password,
            match: (value) => {
                const password = document.getElementById('password');
                return password.value === value;
            },
            customErrorMessages: {
                onMatchFail: __('Passwords do not match!')
            }
        },
        addRequiredTag: true
    }
];

export default customerEmailAndPasswordFields;
