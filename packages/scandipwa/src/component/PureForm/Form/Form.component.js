/* eslint-disable spaced-comment */
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

import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { ChildrenType } from 'Type/Common';

/**
 * Form
 * @class Form
 * @namespace Component/PureForm/Form/Component
 */
export class Form extends PureComponent {
    static propTypes = {
        // Group attributes
        children: ChildrenType.isRequired,
        attr: PropTypes.object.isRequired,
        events: PropTypes.object.isRequired,
        setRef: PropTypes.func.isRequired,

        // Validation
        showErrorAsLabel: PropTypes.bool.isRequired,
        validationResponse: PropTypes.object.isRequired,

        // Labels
        label: PropTypes.string.isRequired,
        subLabel: PropTypes.string.isRequired
    };

    //#region LABEL/TEXT RENDER
    // Renders validation error messages under form
    renderErrorMessage = (message) => (
        <div block="Field" elem="ErrorMessage">{ message }</div>
    );

    renderErrorMessages() {
        const {
            showErrorAsLabel,
            validationResponse
        } = this.props;

        if (!showErrorAsLabel || !validationResponse || validationResponse === true) {
            return null;
        }

        const { errorMessages } = validationResponse;
        if (!errorMessages) {
            return null;
        }

        return (
            <div block="Form" elem="ErrorMessages">
                { errorMessages.map(this.renderErrorMessage) }
            </div>
        );
    }

    // Renders group label above form
    renderLabel() {
        const { label } = this.props;
        if (!label) {
            return null;
        }

        return (
            { label }
        );
    }

    // Renders group label under form
    renderSubLabel() {
        const { subLabel } = this.props;
        if (!subLabel) {
            return null;
        }

        return (
            { subLabel }
        );
    }
    //#endregion

    render() {
        const {
            validationResponse,
            children,
            setRef,
            attr,
            events
        } = this.props;

        return (
            <>
                { this.renderLabel() }
                <form
                  // eslint-disable-next-line @scandipwa/scandipwa-guidelines/jsx-no-props-destruction
                  { ...attr }
                  // eslint-disable-next-line @scandipwa/scandipwa-guidelines/jsx-no-props-destruction
                  { ...events }
                  ref={ (elem) => setRef(elem) }
                  block="Form"
                  mods={ {
                      isValid: validationResponse === true,
                      hasError: validationResponse !== true && Object.keys(validationResponse || {}).length !== 0
                  } }
                >
                    { children }
                </form>
                { this.renderErrorMessages() }
                { this.renderSubLabel() }
            </>
        );
    }
}

export default Form;
