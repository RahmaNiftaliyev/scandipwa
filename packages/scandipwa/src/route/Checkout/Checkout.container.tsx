/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/scandipwa
 * @link https://github.com/scandipwa/scandipwa
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { NavigationTabsMap } from 'Component/NavigationTabs/NavigationTabs.config';
import { ProductType } from 'Component/Product/Product.config';
import CheckoutQuery from 'Query/Checkout.query';
import MyAccountQuery from 'Query/MyAccount.query';
import { CART_URL } from 'Route/CartPage/CartPage.config';
import { AccountPageUrl } from 'Route/MyAccount/MyAccount.config';
import { toggleBreadcrumbs } from 'Store/Breadcrumbs/Breadcrumbs.action';
import { updateShippingPrice } from 'Store/Cart/Cart.action';
import { updateEmail, updateShippingFields } from 'Store/Checkout/Checkout.action';
import { updateMeta } from 'Store/Meta/Meta.action';
import { changeNavigationState } from 'Store/Navigation/Navigation.action';
import { NavigationType } from 'Store/Navigation/Navigation.type';
import { showNotification } from 'Store/Notification/Notification.action';
import { NotificationType } from 'Store/Notification/Notification.type';
import { setPickUpStore } from 'Store/StoreInPickUp/StoreInPickUp.action';
import { removeEmptyStreets } from 'Util/Address';
import { getAuthorizationToken, isSignedIn } from 'Util/Auth';
import BrowserDatabase from 'Util/BrowserDatabase';
import { deleteCartId, getCartId, getCartTotalSubPrice } from 'Util/Cart';
import history from 'Util/History';
import {
    debounce,
    fetchMutation,
    fetchQuery,
    getErrorMessage
} from 'Util/Request';
import { ONE_MONTH_IN_SECONDS } from 'Util/Request/QueryDispatcher';
import { RootState } from 'Util/Store/Store.type';
import { appendWithStoreCode } from 'Util/Url';

import Checkout from './Checkout.component';
import {
    CHECKOUT_URL_REGEX,
    CheckoutSteps,
    CheckoutStepUrl,
    CheckoutUrlSteps,
    PAYMENT_TOTALS,
    UPDATE_EMAIL_CHECK_FREQUENCY
} from './Checkout.config';
import {
    CheckoutContainerDispatchProps,
    CheckoutContainerMapStateProps,
    CheckoutContainerProps,
    CheckoutContainerState
} from './Checkout.type';

export const CartDispatcher = import(
    /* webpackMode: "lazy", webpackChunkName: "dispatchers" */
    'Store/Cart/Cart.dispatcher'
);
export const MyAccountDispatcher = import(
    /* webpackMode: "lazy", webpackChunkName: "dispatchers" */
    'Store/MyAccount/MyAccount.dispatcher'
);
export const CheckoutDispatcher = import(
    /* webpackMode: "lazy", webpackChunkName: "dispatchers" */
    'Store/Checkout/Checkout.dispatcher'
);

/** @namespace Route/Checkout/Container/mapStateToProps */
export const mapStateToProps = (state: RootState): CheckoutContainerMapStateProps => ({
    selectedStore: state.StoreInPickUpReducer.store,
    totals: state.CartReducer.cartTotals,
    isCartLoading: state.CartReducer.isLoading,
    cartTotalSubPrice: getCartTotalSubPrice(state),
    customer: state.MyAccountReducer.customer,
    guest_checkout: state.ConfigReducer.guest_checkout,
    countries: state.ConfigReducer.countries,
    isEmailAvailable: state.CheckoutReducer.isEmailAvailable,
    isMobile: state.ConfigReducer.device.isMobile,
    isInStoreActivated: state.ConfigReducer.delivery_instore_active,
    isGuestNotAllowDownloadable: state.ConfigReducer.downloadable_disable_guest_checkout,
    savedEmail: state.CheckoutReducer.email,
    isSignedIn: state.MyAccountReducer.isSignedIn,
    shippingFields: state.CheckoutReducer.shippingFields,
    minimumOrderAmount: state.CartReducer.cartTotals.minimum_order_amount
});

/** @namespace Route/Checkout/Container/mapDispatchToProps */
export const mapDispatchToProps = (dispatch: Dispatch): CheckoutContainerDispatchProps => ({
    setPickUpStore: (store) => dispatch(setPickUpStore(store)),
    updateMeta: (meta) => dispatch(updateMeta(meta)),
    resetCart: () => CartDispatcher.then(
        ({ default: dispatcher }) => dispatcher.updateInitialCartData(dispatch, !!getAuthorizationToken())
    ),
    resetGuestCart: () => CartDispatcher.then(
        ({ default: dispatcher }) => {
            dispatcher.resetGuestCart(dispatch);
            dispatcher.createGuestEmptyCart(dispatch);
        }
    ),
    toggleBreadcrumbs: (state) => dispatch(toggleBreadcrumbs(state)),
    showErrorNotification: (message) => dispatch(showNotification(NotificationType.ERROR, message)),
    showInfoNotification: (message) => dispatch(showNotification(NotificationType.INFO, message)),
    showSuccessNotification: (message) => dispatch(showNotification(NotificationType.SUCCESS, message)),
    setHeaderState: (stateName) => dispatch(changeNavigationState(NavigationType.TOP_NAVIGATION_TYPE, stateName)),
    setNavigationState: (stateName) => dispatch(
        changeNavigationState(NavigationType.BOTTOM_NAVIGATION_TYPE, stateName)
    ),
    createAccount: (options) => MyAccountDispatcher.then(
        ({ default: dispatcher }) => dispatcher.createAccount(options, dispatch)
    ),
    updateShippingFields: (fields) => dispatch(updateShippingFields(fields)),
    updateEmail: (email) => dispatch(updateEmail(email)),
    checkEmailAvailability: (email) => CheckoutDispatcher.then(
        ({ default: dispatcher }) => dispatcher.handleData(dispatch, email)
    ),
    updateShippingPrice: (data) => dispatch(updateShippingPrice(data))
});

/** @namespace Route/Checkout/Container */
export class CheckoutContainer extends PureComponent<CheckoutContainerProps, CheckoutContainerState> {
    static defaultProps = {
        cartTotalSubPrice: null,
        minimumOrderAmount: {},
        shippingFields: {}
    };

    containerFunctions = {
        setLoading: this.setLoading.bind(this),
        setDetailsStep: this.setDetailsStep.bind(this),
        savePaymentInformation: this.savePaymentInformation.bind(this),
        saveAddressInformation: this.saveAddressInformation.bind(this),
        onShippingEstimationFieldsChange: this.onShippingEstimationFieldsChange.bind(this),
        onEmailChange: this.onEmailChange.bind(this),
        onCreateUserChange: this.onCreateUserChange.bind(this),
        onPasswordChange: this.onPasswordChange.bind(this),
        goBack: this.goBack.bind(this),
        handleSelectDeliveryMethod: this.handleSelectDeliveryMethod.bind(this),
        onStoreSelect: this.onStoreSelect.bind(this),
        onShippingMethodSelect: this.onShippingMethodSelect.bind(this),
        onChangeEmailRequired: this.onChangeEmailRequired.bind(this)
    };

    checkEmailAvailability = debounce((email: string) => {
        const { checkEmailAvailability } = this.props;

        checkEmailAvailability(email);
    }, UPDATE_EMAIL_CHECK_FREQUENCY);

    __construct(props: CheckoutContainerProps): void {
        super.__construct?.(props);

        this._handleError = this._handleError.bind(this);

        const {
            toggleBreadcrumbs,
            totals: {
                is_virtual
            },
            savedEmail
        } = props;

        toggleBreadcrumbs(false);

        this.state = {
            isLoading: is_virtual,
            isDeliveryOptionsLoading: false,
            requestsSent: 0,
            paymentMethods: [],
            shippingMethods: [],
            shippingAddress: {},
            billingAddress: {},
            selectedShippingMethod: '',
            checkoutStep: this.determineCheckoutStepFromUrl(),
            orderID: '',
            paymentTotals: BrowserDatabase.getItem(PAYMENT_TOTALS) || {},
            email: savedEmail || '',
            isGuestEmailSaved: false,
            isCreateUser: false,
            estimateAddress: {},
            isPickInStoreMethodSelected: false,
            isVisibleEmailRequired: false
        };
    }

    componentDidMount(): void {
        const {
            guest_checkout,
            updateMeta,
            isGuestNotAllowDownloadable
        } = this.props;

        const { email } = this.state;

        this.handleRedirectIfNoItemsInCart();
        this.handleRedirectIfLessThanMinAmountInCart();

        // if guest checkout is disabled and user is not logged in => throw him to homepage
        if (!guest_checkout && !isSignedIn()) {
            history.push(appendWithStoreCode('/'));
        }

        // if guest is not allowed to checkout with downloadable => redirect to login page
        if (!isSignedIn() && isGuestNotAllowDownloadable) {
            this.handleRedirectIfDownloadableInCart();
        }

        if (email) {
            this.checkEmailAvailability(email);
        }

        updateMeta({ title: __('Checkout') });
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            match: {
                params: {
                    step: urlStep = ''
                }
            },
            isEmailAvailable,
            updateEmail,
            isCartLoading,
            shippingFields,
            shippingFields: {
                shipping_method
            },
            totals: {
                is_virtual
            },
            showInfoNotification
        } = this.props;

        const {
            match: {
                params: {
                    step: prevUrlStep = ''
                }
            },
            isCartLoading: prevIsCartLoading
        } = prevProps;

        const { email, checkoutStep, isVisibleEmailRequired } = this.state;
        const { email: prevEmail, isVisibleEmailRequired: prevIsVisibleEmailRequired } = prevState;
        const { location: { pathname = '' } } = history;

        this.handleRedirectIfNoItemsInCart();
        this.handleRedirectIfLessThanMinAmountInCart();

        if (prevIsCartLoading && !isCartLoading) {
            if (checkoutStep === CheckoutSteps.SHIPPING_STEP) {
                if (is_virtual) {
                    history.replace(appendWithStoreCode(CheckoutStepUrl.BILLING_URL));
                    this._getPaymentMethods();
                    // eslint-disable-next-line react/no-did-update-set-state
                    this.setState({ checkoutStep: CheckoutSteps.BILLING_STEP });
                } else if (pathname.match(CHECKOUT_URL_REGEX)) {
                    history.replace(appendWithStoreCode(CheckoutStepUrl.SHIPPING_URL));
                }
            }

            const shouldGoToShipping = (
                !shipping_method
                 && !is_virtual
                 && checkoutStep === CheckoutSteps.BILLING_STEP
            );

            if (shouldGoToShipping) {
                showInfoNotification(__('Please add a shipping address and a shipping method!'));
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ checkoutStep: CheckoutSteps.SHIPPING_STEP });
            }

            this.saveShippingFieldsAsShippingAddress(shippingFields, is_virtual);
        }

        // Handle going back from billing to shipping
        if (
            urlStep.includes(CheckoutUrlSteps.SHIPPING_URL_STEP)
             && prevUrlStep.includes(CheckoutUrlSteps.BILLING_URL_STEP)
        ) {
            BrowserDatabase.deleteItem(PAYMENT_TOTALS);

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                checkoutStep: CheckoutSteps.SHIPPING_STEP,
                isGuestEmailSaved: false
            });
        }

        if (urlStep.includes(CheckoutUrlSteps.BILLING_URL_STEP) && prevUrlStep.includes(CheckoutUrlSteps.DETAILS_URL_STEP)) {
            BrowserDatabase.deleteItem(PAYMENT_TOTALS);
            history.push(appendWithStoreCode(CART_URL));
        }

        if (email !== prevEmail) {
            this.checkEmailAvailability(email);

            if (email && isVisibleEmailRequired !== prevIsVisibleEmailRequired) {
                this.onChangeEmailRequired();
            }
        }

        if (!isEmailAvailable) {
            updateEmail(email);
        }

        return null;
    }

    componentWillUnmount() {
        const { toggleBreadcrumbs, setPickUpStore } = this.props;

        toggleBreadcrumbs(true);
        setPickUpStore(null);
    }

    saveShippingFieldsAsShippingAddress(address, is_virtual) {
        const {
            street_0,
            street_1,
            street_2,
            shipping_method,
            ...data
        } = address;
        const { savedEmail } = this.props;
        const { checkoutStep } = this.state;

        const checkoutData = (
            is_virtual
                ? { shippingAddress: {}, isGuestEmailSaved: false }
                : {
                    shippingAddress: data,
                    isGuestEmailSaved: savedEmail && checkoutStep !== CheckoutSteps.SHIPPING_STEP
                }
        );

        this.setState({
            ...checkoutData,
            email: savedEmail
        });
    }

    onEmailChange(email) {
        this.setState({ email });
    }

    onCreateUserChange() {
        const { isCreateUser } = this.state;

        this.setState({ isCreateUser: !isCreateUser });
    }

    onPasswordChange(password) {
        this.setState({ password });
    }

    onShippingMethodSelect(selectedShippingMethod) {
        const { method_code } = selectedShippingMethod;

        this.setState({ selectedShippingMethod: method_code });
    }

    onShippingEstimationFieldsChange(address) {
        const { requestsSent } = this.state;
        const cartId = getCartId();

        if (!cartId) {
            return;
        }

        this.setState({
            isDeliveryOptionsLoading: true,
            requestsSent: requestsSent + 1,
            estimateAddress: address
        });

        fetchMutation(CheckoutQuery.getEstimateShippingCosts(
            address,
            cartId
        )).then(
            /** @namespace Route/Checkout/Container/CheckoutContainer/onShippingEstimationFieldsChange/fetchMutation/then */
            ({ estimateShippingCosts: shippingMethods }) => {
                const { requestsSent } = this.state;

                this.setState({
                    shippingMethods,
                    isDeliveryOptionsLoading: requestsSent > 1,
                    requestsSent: requestsSent - 1
                });
            },
            this._handleError
        );
    }

    determineCheckoutStepFromUrl() {
        const {
            match: {
                params: {
                    step: urlStep = ''
                }
            },
            totals: {
                is_virtual
            }
        } = this.props;
        const { location: { pathname = '' } } = history;

        if (urlStep.includes(CheckoutUrlSteps.DETAILS_URL_STEP)) {
            return CheckoutSteps.DETAILS_STEP;
        }

        if (urlStep.includes(CheckoutUrlSteps.BILLING_URL_STEP) || is_virtual) {
            if (pathname.match(CHECKOUT_URL_REGEX)) {
                history.replace(appendWithStoreCode(CheckoutStepUrl.BILLING_URL));
            }

            this._getPaymentMethods();

            return CheckoutSteps.BILLING_STEP;
        }

        return CheckoutSteps.SHIPPING_STEP;
    }

    handleRedirectIfNoItemsInCart() {
        const {
            totals: {
                items = []
            },
            isCartLoading,
            showInfoNotification
        } = this.props;

        const { checkoutStep, orderID } = this.state;

        if (
            (!isCartLoading && !items.length)
             || (checkoutStep === CheckoutSteps.DETAILS_STEP && !orderID)
        ) {
            if (checkoutStep !== CheckoutSteps.DETAILS_STEP) {
                showInfoNotification(__('Please add at least one product to cart!'));
            }

            if (!(orderID && checkoutStep === CheckoutSteps.DETAILS_STEP)) {
                history.push(appendWithStoreCode(CART_URL));
            }
        }
    }

    handleRedirectIfLessThanMinAmountInCart() {
        const {
            minimumOrderAmount: { minimum_order_amount_reached = true }
        } = this.props;

        const { checkoutStep } = this.state;

        if (!minimum_order_amount_reached && checkoutStep !== CheckoutSteps.DETAILS_STEP) {
            history.push(appendWithStoreCode(CART_URL));
        }
    }

    handleRedirectIfDownloadableInCart() {
        const { totals: { items }, showInfoNotification } = this.props;

        const isDownloadable = items.find(({ product }) => product.type_id === ProductType.DOWNLOADABLE);

        if (!isDownloadable) {
            return;
        }

        showInfoNotification(__('Please sign in or remove downloadable products from cart!'));
        history.replace(appendWithStoreCode(AccountPageUrl.LOGIN_URL));
    }

    handleSelectDeliveryMethod() {
        const { isPickInStoreMethodSelected } = this.state;

        this.setState({ isPickInStoreMethodSelected: !isPickInStoreMethodSelected });
    }

    onStoreSelect(address) {
        this.setState({ selectedStoreAddress: address });
    }

    onChangeEmailRequired() {
        const { email } = this.state;

        this.setState({ isVisibleEmailRequired: !email });
    }

    goBack() {
        const { checkoutStep } = this.state;

        if (checkoutStep === CheckoutSteps.BILLING_STEP) {
            this.setState({
                isLoading: false
            });
            BrowserDatabase.deleteItem(PAYMENT_TOTALS);
        }

        history.goBack();
    }

    setDetailsStep(orderID) {
        const { resetCart, resetGuestCart, setNavigationState } = this.props;

        deleteCartId();
        BrowserDatabase.deleteItem(PAYMENT_TOTALS);

        if (isSignedIn()) {
            resetCart();
        } else {
            resetGuestCart();
        }

        this.setState({
            isLoading: false,
            paymentTotals: {},
            checkoutStep: CheckoutSteps.DETAILS_STEP,
            orderID
        });

        setNavigationState({
            name: NavigationTabsMap.CART_TAB
        });
    }

    setLoading(isLoading = true) {
        this.setState({ isLoading });
    }

    async setShippingAddress(isDefaultShipping = false) {
        const { shippingAddress } = this.state;
        const { region, region_id, ...address } = shippingAddress;

        const mutation = MyAccountQuery.getCreateAddressMutation({
            ...address,
            region: { region, region_id },
            default_shipping: isDefaultShipping
        });

        const data = await fetchMutation(mutation);

        if (data?.createCustomerAddress) {
            this.setState({
                shippingAddress: {
                    ...shippingAddress,
                    id: data.createCustomerAddress.id
                }
            });
        }

        return true;
    }

    containerProps() {
        const {
            cartTotalSubPrice,
            isEmailAvailable,
            isMobile,
            setHeaderState,
            totals,
            isInStoreActivated,
            isSignedIn,
            isCartLoading
        } = this.props;
        const {
            billingAddress,
            checkoutStep,
            email,
            estimateAddress,
            isCreateUser,
            isDeliveryOptionsLoading,
            isGuestEmailSaved,
            isLoading,
            orderID,
            paymentMethods,
            paymentTotals,
            selectedShippingMethod,
            shippingAddress,
            shippingMethods,
            selectedStoreAddress,
            isPickInStoreMethodSelected,
            isVisibleEmailRequired
        } = this.state;

        return {
            billingAddress,
            cartTotalSubPrice,
            checkoutStep,
            checkoutTotals: this._getCheckoutTotals(),
            email,
            estimateAddress,
            isCreateUser,
            isDeliveryOptionsLoading,
            isEmailAvailable,
            isGuestEmailSaved,
            isInStoreActivated,
            isSignedIn,
            isLoading,
            isMobile,
            orderID,
            paymentMethods,
            paymentTotals,
            selectedShippingMethod,
            setHeaderState,
            shippingAddress,
            shippingMethods,
            totals,
            selectedStoreAddress,
            isPickInStoreMethodSelected,
            isCartLoading,
            isVisibleEmailRequired
        };
    }

    _handleError(error) {
        const { showErrorNotification } = this.props;

        this.setState({
            isDeliveryOptionsLoading: false,
            isLoading: false
        }, () => {
            showErrorNotification(getErrorMessage(error));
        });

        return false;
    }

    _getPaymentMethods() {
        fetchQuery(CheckoutQuery.getPaymentMethodsQuery(
            getCartId()
        )).then(
            /** @namespace Route/Checkout/Container/CheckoutContainer/_getPaymentMethods/fetchQuery/then */
            ({ getPaymentMethods: paymentMethods }) => {
                this.setState({ isLoading: false, paymentMethods });
            },
            this._handleError
        );
    }

    _getCheckoutTotals() {
        const { totals: cartTotals } = this.props;
        const { paymentTotals: { shipping_amount } } = this.state;

        return shipping_amount
            ? { ...cartTotals, shipping_amount }
            : cartTotals;
    }

    saveGuestEmail() {
        const { email } = this.state;
        const { updateEmail } = this.props;
        const guestCartId = getCartId();

        if (!email) {
            this.setState({ isVisibleEmailRequired: false }, this.onChangeEmailRequired);
        }

        if (!guestCartId || !email) {
            return null;
        }

        const mutation = CheckoutQuery.getSaveGuestEmailMutation(email, guestCartId);

        updateEmail(email);

        return fetchMutation(mutation).then(
            /** @namespace Route/Checkout/Container/CheckoutContainer/saveGuestEmail/fetchMutation/then */
            ({ setGuestEmailOnCart: data }) => {
                if (data) {
                    this.setState({ isGuestEmailSaved: true });
                }

                return data;
            },
            this._handleError
        );
    }

    async createUserOrSaveGuest() {
        const {
            createAccount,
            totals: { is_virtual },
            showSuccessNotification,
            isEmailAvailable
        } = this.props;

        const {
            email,
            password,
            isCreateUser,
            shippingAddress: {
                firstname,
                lastname
            }
        } = this.state;

        if (!isCreateUser || !isEmailAvailable) {
            return this.saveGuestEmail();
        }

        const options = {
            customer: {
                email,
                firstname,
                lastname
            },
            password
        };

        const creation = await createAccount(options);

        if (!creation) {
            return creation;
        }

        showSuccessNotification(__('Your account has been created successfully!'));

        if (!is_virtual) {
            return this.setShippingAddress(true);
        }

        return true;
    }

    prepareAddressInformation(addressInformation) {
        const {
            shipping_address: {
                id,
                save_in_address_book,
                guest_email,
                ...shippingAddress
            } = {},
            billing_address: {
                id: dropId,
                save_in_address_book: dropSaveInAddressBook,
                guest_email: dropGuestEmail,
                ...billingAddress
            } = {},
            ...data
        } = addressInformation;

        return {
            ...data,
            shipping_address: shippingAddress,
            billing_address: billingAddress
        };
    }

    async saveAddressInformation(addressInformation) {
        const { updateShippingPrice } = this.props;
        const { shipping_address, shipping_method_code } = addressInformation;

        this.setState({
            isLoading: true,
            shippingAddress: shipping_address,
            selectedShippingMethod: shipping_method_code
        });

        if (!isSignedIn()) {
            if (!await this.createUserOrSaveGuest()) {
                this.setState({ isLoading: false });

                return;
            }
        }

        fetchMutation(CheckoutQuery.getSaveAddressInformation(
            this.prepareAddressInformation(addressInformation),
            getCartId()
        )).then(
            /** @namespace Route/Checkout/Container/CheckoutContainer/saveAddressInformation/fetchMutation/then */
            ({ saveAddressInformation: data }) => {
                const { payment_methods, totals } = data;

                updateShippingPrice(totals);

                BrowserDatabase.setItem(
                    totals,
                    PAYMENT_TOTALS,
                    ONE_MONTH_IN_SECONDS
                );

                this.setState({
                    isLoading: false,
                    paymentMethods: payment_methods,
                    checkoutStep: CheckoutSteps.BILLING_STEP,
                    paymentTotals: totals
                });
            },
            this._handleError
        );
    }

    async savePaymentInformation(paymentInformation) {
        const { totals: { is_virtual } } = this.props;
        const {
            billing_address: {
                firstname: billingFirstName,
                lastname: billingLastName
            },
            billing_address: billingAddress
        } = paymentInformation;

        /**
          * If cart contains only virtual products then set firstname & lastname
          * from billing step into shippingAddress for user creating.
          */
        if (is_virtual) {
            this.setState({
                shippingAddress: {
                    firstname: billingFirstName,
                    lastname: billingLastName
                }
            });
        }

        this.setState({ isLoading: true, billingAddress });

        if (!isSignedIn()) {
            if (!await this.createUserOrSaveGuest()) {
                this.setState({ isLoading: false });

                return;
            }
        }

        await this.saveBillingAddress(paymentInformation).then(
            /** @namespace Route/Checkout/Container/CheckoutContainer/savePaymentInformation/saveBillingAddress/then */
            () => this.savePaymentMethodAndPlaceOrder(paymentInformation),
            this._handleError
        );
    }

    trimAddressMagentoStyle(address) {
        const { countries } = this.props;

        const {
            id, // drop this
            country_id,
            region_code, // drop this
            purchaseOrderNumber, // drop this
            region_id,
            region,
            street,
            guest_email,
            ...restOfBillingAddress
        } = address;

        const newAddress = {
            ...restOfBillingAddress,
            country_code: country_id,
            region,
            region_id,
            street: removeEmptyStreets(street)
        };

        /**
          * If there is no region specified, but there is region ID
          * get the region code by the country ID
          */
        if (region_id) {
            // find a country by country ID
            const { available_regions } = countries.find(
                ({ id }) => id === country_id
            ) || {};

            if (!available_regions) {
                return newAddress;
            }

            // find region by region ID
            const { code } = available_regions.find(
                ({ id }) => +id === +region_id
            ) || {};

            if (!code) {
                return newAddress;
            }

            newAddress.region = code;
        }

        return newAddress;
    }

    async saveBillingAddress(paymentInformation) {
        const isCustomerSignedIn = isSignedIn();
        const guest_cart_id = getCartId();

        if (!isCustomerSignedIn && !getCartId) {
            return;
        }

        const { billing_address, same_as_shipping } = paymentInformation;
        const {
            shippingAddress: {
                id: shippingAddressId = null
            } = {}
        } = this.state;
        const billingAddress = {
            address: this.trimAddressMagentoStyle(billing_address)
        };

        if (same_as_shipping && shippingAddressId) {
            billingAddress.customer_address_id = shippingAddressId;
        }

        await fetchMutation(CheckoutQuery.getSetBillingAddressOnCart({
            cart_id: guest_cart_id,
            billing_address: billingAddress
        }));
    }

    async savePaymentMethodAndPlaceOrder(paymentInformation) {
        const { paymentMethod: { code, additional_data, purchase_order_number } } = paymentInformation;
        const isCustomerSignedIn = isSignedIn();
        const guest_cart_id = getCartId();

        if (!isCustomerSignedIn && !guest_cart_id) {
            return;
        }

        try {
            await fetchMutation(CheckoutQuery.getSetPaymentMethodOnCartMutation({
                cart_id: guest_cart_id,
                payment_method: {
                    code,
                    [code]: additional_data,
                    purchase_order_number
                }
            }));

            const orderData = await fetchMutation(CheckoutQuery.getPlaceOrderMutation(guest_cart_id));
            const { placeOrder: { order: { order_id } } } = orderData;

            this.setDetailsStep(order_id);
        } catch (e) {
            this._handleError(e);
        }
    }

    render() {
        return (
             <Checkout
               { ...this.containerFunctions }
               { ...this.containerProps() }
             />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CheckoutContainer);
