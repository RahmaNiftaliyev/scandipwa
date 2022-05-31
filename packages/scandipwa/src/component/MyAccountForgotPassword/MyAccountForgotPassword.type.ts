/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/scandipwa
 */
import { MouseEvent } from 'react';

import { MyAccountPageState } from 'Component/MyAccountOverlay/MyAccountOverlay.config';
import { UpdateCustomerPasswordForgotStatusAction } from 'Store/MyAccount/MyAccount.type';
import { NotificationType, ShowNotificationAction } from 'Store/Notification/Notification.type';
import { FieldData } from 'Util/Form/Form.type';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MyAccountForgotPasswordContainerMapStateProps {}

export interface MyAccountForgotPasswordContainerMapDispatchProps {
    forgotPassword: (options: {
        email: string;
    }) => Promise<UpdateCustomerPasswordForgotStatusAction | ShowNotificationAction>;
    forgotPasswordEmail: (email: string) => void;
    showNotification: (type: NotificationType, message: string) => void;
}

export type MyAccountForgotPasswordContainerProps = MyAccountForgotPasswordContainerMapStateProps
& MyAccountForgotPasswordContainerMapDispatchProps
& {
    state: MyAccountPageState | '';
    onFormError: () => void;
    handleSignIn: (e: MouseEvent) => void;
    handleCreateAccount: (e: MouseEvent) => void;
    isCheckout: boolean;
    setLoadingState: (isLoading: boolean) => void;
    setSignInState: (state: MyAccountPageState) => void;
    isOverlayVisible: boolean;
};

export type MyAccountForgotPasswordComponentProps = {
    state: MyAccountPageState | '';
    onForgotPasswordSuccess: (form: HTMLFormElement, fields: FieldData[]) => Promise<void>;
    onFormError: () => void;
    handleSignIn: (e: MouseEvent) => void;
    handleCreateAccount: (e: MouseEvent) => void;
    isCheckout: boolean;
};
