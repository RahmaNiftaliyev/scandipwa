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

import { PureComponent } from 'react';

import ContentWrapper from 'Component/ContentWrapper';
import ProductTab from 'Component/ProductTab';
import { ReactElement } from 'Type/Common.type';
import { isCrawler, isSSR } from 'Util/Browser';
import { isMobile } from 'Util/Mobile';

import './ProductTabs.style';

/** @namespace Component/ProductTabs/Component */
export class ProductTabs extends PureComponent {
    static propTypes = {
        tabs: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            render: PropTypes.func.isRequired
        })).isRequired
    };

    onTabClick = this.onTabClick.bind(this);

    __construct(props): void {
        super.__construct(props);

        const { tabs: [{ id }] } = this.props;

        this.state = {
            activeTab: id
        };
    }

    componentDidUpdate(prevProps): void {
        const { tabs: prevTabs } = prevProps;
        const { tabs } = this.props;

        if (prevTabs.length !== tabs.length) {
            const [{ id }] = tabs;
            this.setActiveTab(id);
        }
    }

    onTabClick(tab) {
        const { tabs } = this.props;
        const { activeTab } = this.state;

        const { id: currentTab } = tabs.find(({ name }) => name === tab);

        if (activeTab !== currentTab) {
            this.setActiveTab(currentTab);
        }
    }

    setActiveTab(activeTab) {
        this.setState({ activeTab });
    }

    renderActiveTab(): ReactElement {
        const { tabs } = this.props;
        const { activeTab } = this.state;
        const { render } = tabs.find(({ id }) => id === activeTab) || {};

        if (!render) {
            return null;
        }

        return render();
    }

    renderAllTabs(): ReactElement {
        const { tabs } = this.props;

        return tabs.map(({ render, name }) => render(name));
    }

    renderTab(item): ReactElement {
        const { activeTab } = this.state;
        const { id, name } = item;

        return (
            <ProductTab
              tabName={ name }
              key={ id }
              onClick={ this.onTabClick }
              isActive={ id === activeTab }
            />
        );
    }

    renderTabs(): ReactElement {
        const { tabs } = this.props;

        if (isMobile.any() || isSSR() || isCrawler()) {
            return this.renderAllTabs();
        }

        return (
            <>
                <ul block="ProductTabs">
                    { tabs.map(this.renderTab.bind(this)) }
                </ul>
                { this.renderActiveTab() }
            </>
        );
    }

    render(): ReactElement {
        return (
            <ContentWrapper
              wrapperMix={ { block: 'ProductTabs', elem: 'Wrapper' } }
              label={ __('Product tabs') }
            >
                { this.renderTabs() }
            </ContentWrapper>
        );
    }
}

export default ProductTabs;
