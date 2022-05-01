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

import { Url } from 'Type/Common.type';

export type Breadcrumb = {
    url: Url;
    name: string;
};

export type CategoryBreadcrumb = {
    category_level: number;
    category_url: string;
    category_name: string;
    category_is_active: boolean;
};

export type Category = {
    id: number;
    url: string;
    name: string;
    breadcrumbs: CategoryBreadcrumb[];
};

export type Product = {
    name: string;
    url: Url;
    categories: Category[];
};

export enum BreadcrumbsActionType {
    UPDATE_BREADCRUMBS = 'UPDATE_BREADCRUMBS',
    TOGGLE_BREADCRUMBS = 'TOGGLE_BREADCRUMBS'
}

export interface ToggleBreadcrumbsAction extends AnyAction {
    type: BreadcrumbsActionType.TOGGLE_BREADCRUMBS;
    areBreadcrumbsVisible?: boolean;
}

export interface UpdateBreadcrumbsAction extends AnyAction {
    type: BreadcrumbsActionType.UPDATE_BREADCRUMBS;
    breadcrumbs?: Breadcrumb[];
}

export type BreadcrumbsAction = ToggleBreadcrumbsAction | UpdateBreadcrumbsAction;

export type BreadcrumbsStore = {
    breadcrumbs: Breadcrumb[];
    areBreadcrumbsVisible: boolean;
};

declare module 'Util/Store/Store.type' {
    export interface RootState {
        BreadcrumbsReducer: BreadcrumbsStore;
    }
}
