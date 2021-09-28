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

import Loader from 'Component/Loader';
import { FIELD_TYPE } from 'Component/PureForm/Field/Field.config';
import UploadIcon from 'Component/UploadIcon';

/**
 * Field File
 * @class FieldFile
 * @namespace Component/PureForm/FieldFile/Component
 */
export class FieldFile extends PureComponent {
    static propTypes = {
        attr: PropTypes.object.isRequired,
        events: PropTypes.object.isRequired,
        setRef: PropTypes.func.isRequired,
        fileName: PropTypes.string.isRequired,
        isLoading: PropTypes.bool.isRequired
    };

    renderSubLabel(allowedTypes) {
        return (
            <div block="FieldFile" elem="AllowedTypes">
                { __('Compatible file extensions to upload:') }
                <strong>{ ` ${allowedTypes}` }</strong>
            </div>
        );
    }

    renderFileLabel() {
        const {
            attr: { id = '', multiple = false } = {},
            fileName = '',
            isLoading = false
        } = this.props;

        if (isLoading) {
            return <Loader isLoading />;
        }

        if (fileName) {
            return (
                <label htmlFor={ id }>
                    <p>{ fileName }</p>
                </label>
            );
        }

        const dropLabel = multiple ? __('Drop files here or') : __('Drop file here or');
        const selectLabel = multiple ? __('Select files') : __('Select file');

        return (
            <label htmlFor={ id }>
                <UploadIcon />
                <p>{ dropLabel }</p>
                <span>{ selectLabel }</span>
            </label>
        );
    }

    render() {
        const {
            attr = {},
            attr: { accept = '' } = {},
            events = {},
            setRef
        } = this.props;

        const allowedFieldTypes = accept
            .split(',')
            .map((type = '') => type.split('/').slice(-1)[0])
            .join(', ');

        return (
            <>
                <input
                  ref={ (elem) => setRef(elem) }
                  type={ FIELD_TYPE.file }
                  // eslint-disable-next-line @scandipwa/scandipwa-guidelines/jsx-no-props-destruction
                  { ...attr }
                  // eslint-disable-next-line @scandipwa/scandipwa-guidelines/jsx-no-props-destruction
                  { ...events }
                />
                { this.renderFileLabel() }
                { allowedFieldTypes.length && this.renderSubLabel(allowedFieldTypes) }
            </>
        );
    }
}

export default FieldFile;