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
import { AnyAction } from 'redux';

export enum OfflineActionType {
    SHOW_OFFLINE_NOTICE = 'SHOW_OFFLINE_NOTICE',
    SET_BIG_OFFLINE_NOTICE = 'SET_BIG_OFFLINE_NOTICE'
}

export interface ShowOfflineNoticeAction extends AnyAction {
    type: OfflineActionType.SHOW_OFFLINE_NOTICE;
    isOffline: boolean;
}

export interface SetBigOfflineNoticeAction extends AnyAction {
    type: OfflineActionType.SET_BIG_OFFLINE_NOTICE;
    isBig: boolean;
}

export type OfflineAction = ShowOfflineNoticeAction | SetBigOfflineNoticeAction;

export type OfflineStore = {
    isOffline: boolean;
    isBig: boolean;
};

declare module 'Util/Store/Store.type' {
    export interface RootState {
        OfflineReducer: OfflineStore;
    }
}
