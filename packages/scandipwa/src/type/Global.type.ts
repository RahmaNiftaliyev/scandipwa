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

import { StoreEnhancer } from 'redux';

// import { ValidationData } from 'Util/Validator';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '__REACT_DEVTOOLS_GLOBAL_HOOK__'?: Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '__REDUX_DEVTOOLS_EXTENSION__'?: (options: unknown) => StoreEnhancer<unknown, unknown>;
        storeRegexText: string;
        actionName?: {
            type?: string;
        };
        secure_base_media_url?: string;
        prefetchedImages: Record<string, HTMLImageElement>;
        storeList: Array<string>;
        dataCache?: Record<number, unknown>;
        contentConfiguration?: ContentConfiguration;
        prompt_event?: BeforeInstallPromptEvent;
    }

    interface BeforeInstallPromptEvent extends Event {

        readonly platforms: Array<string>;

        readonly userChoice: Promise<{
            outcome: 'accepted' | 'dismissed';
            platform: string;
        }>;

        prompt(): Promise<void>;

    }

    function __(message: string, ...args: unknown[]): string;

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace React {
        interface Component {
            __construct?(props: unknown): void;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface ClassAttributes<T> {
            block?: string;
            elem?: string;
            mods?: Record<string, unknown>;
            mix?: Record<string, unknown>;
        }
    }

    interface Navigator {
        userAgentData: NavigatorUAData;
    }

    interface NavigatorUABrandVersion {
        brand: string;
        version: string;
    }

    interface UADataValues {
        brands?: NavigatorUABrandVersion[];
        mobile?: boolean;
        platform?: string;
        architecture?: string;
        bitness?: string;
        model?: string;
        platformVersion?: string;
        uaFullVersion?: string;
    }

    interface UALowEntropyJSON {
        brands: NavigatorUABrandVersion[];
        mobile: boolean;
        platform: string;
    }

    interface NavigatorUAData extends UALowEntropyJSON {
        getHighEntropyValues(hints: string[]): Promise<UADataValues>;
        toJSON(): UALowEntropyJSON;
    }

    interface HTMLInputElement {
        fileData?: string;
    }

    type ContentConfiguration = {
        header_content?: {
            header_menu?: string;
        };
        minicart_content?: {
            minicart_cms?: string;
        };
        footer_content?: {
            footer_cms?: string;
        };
        product_list_content?: {
            attribute_to_display?: string;
        };
        cart_content?: {
            cart_cms?: string;
        };
        checkout_content?: {
            checkout_billing_cms?: string;
            checkout_shipping_cms?: string;
        };
        contact_us_content?: {
            contact_us_cms_block?: string;
        };
    };

    // interface HTMLElementEventMap {
    //     validate: ValidationData
    // }
}
