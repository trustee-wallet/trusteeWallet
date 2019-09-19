import React, { Component } from 'react'

import { connect } from 'react-redux'

import {
    View,
    ScrollView,
    Dimensions,
    Text
} from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import firebase from "react-native-firebase"

import TextView from '../../components/elements/Text'
import AddressInput from '../../components/elements/Input'
import AmountInput from '../../components/elements/Input'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'

import { setQRConfig, setQRValue } from '../../appstores/Actions/QRCodeScannerActions'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import { showModal } from '../../appstores/Actions/ModalActions'

import { strings } from '../../services/i18n'

import BlocksoftTransaction from '../../../crypto/actions/BlocksoftTransaction/BlocksoftTransaction'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

const addressInput = {
    id: 'address',
    type: 'ETH_ADDRESS'
}

const amountInput = {
    id: 'value',
    type: 'EMPTY',
    additional: 'NUMBER',
    mark: 'ETH'
}

class SendScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            init: false,
            account: {},
            cryptocurrency: {},
            feeList: [],

            disabled: false,
            useAllFunds: false,
            description: '',

            amountInputMark: '',
            focused: false,

            enoughFunds: {
                isAvailable: true,
                messages: []
            },
            balance: 0,

            inputType: 'CRYPTO'
        }
        this.addressInput = React.createRef()
        this.valueInput = React.createRef()
        this.fee = React.createRef()
    }

    componentWillMount() {
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {

            if (Object.keys(this.props.send.data).length != 0) {
                const {
                    sendType,
                    disabled,
                    account,
                    address,
                    value,
                    cryptocurrency,
                    description,
                    useAllFunds
                } = this.props.send.data;

                (BlocksoftTransaction.setCurrencyCode(account.currency_code)).getNetworkPrices()

                this.setState({
                    disabled,
                    account,
                    cryptocurrency,
                    description,
                    useAllFunds,
                    init: true
                }, () => {
                    this.addressInput.handleInput(address)
                    this.valueInput.handleInput(value)
                    this.amountInputCallback(value === '' ? this.valueInput.getValue() : value)

                    if(sendType == 'REPLACE_TRANSACTION'){
                        setTimeout(() => {
                            this.handleSendTransaction()
                        }, 500)

                    }

                    this.setState({
                        useAllFunds
                    })
                })
            } else {
                const { account, cryptocurrency } = this.props

                this.setState({
                    account,
                    cryptocurrency,
                    init: true,
                    description: strings('send.description')
                }, () => {
                    this.amountInputCallback()
                });

                (BlocksoftTransaction.setCurrencyCode(account.currency_code)).getNetworkPrices()
            }
        })
    }

    handleChangeEquivalentType = () => {

        const { currencySymbol } = this.state.cryptocurrency
        const { local_currency } = this.props.settingsStore.data

        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'

        let amountEquivalent

        const toInput = (!(1 * this.state.amountEquivalent) ? '' : this.state.amountEquivalent).toString()
        const toEquivalent = !this.valueInput.getValue() ? '0' : this.valueInput.getValue()

        if(inputType === 'FIAT'){
            amountEquivalent = toEquivalent
            this.valueInput.handleInput(toInput)
        } else {
            amountEquivalent = toEquivalent
            this.valueInput.handleInput(toInput)
        }

        this.setState({
            amountInputMark: strings('send.equivalent', { amount: amountEquivalent, symbol: this.state.inputType === 'FIAT' ? local_currency : currencySymbol }),
            amountEquivalent,
            inputType
        })
    }

    handleTransferAll = async () => {

        setLoaderStatus(true)

        const {
            wallet_hash: walletHash
        } = this.props.wallet

        const {
            address,
            currency_code: currencyCode,
            derivation_path: derivationPath
        } = this.props.account


        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')
        try {

            const balanceRaw = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address)).getBalance()

            const addressToForTransferAll = (BlocksoftBalances.setCurrencyCode(currencyCode)).getAddressToForTransferAll(address)

            let fees = await (
                BlocksoftTransaction
                    .setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(address)
                    .setAddressTo(addressToForTransferAll)
                    .setTransferAll(true)
                    .setAmount(balanceRaw)
            ).getFeeRate()

            let current = false

            // try fast
            let currentFee = fees[2].feeForTx
            try {
                current = await (
                    BlocksoftBalances
                        .setCurrencyCode(currencyCode)
                        .setAddress(address)
                        .setFee(fees[2].feeForTx)
                ).getTransferAllBalance(balanceRaw)
            } catch (e) {
                if (typeof e.code != 'undefined' && e.code === 'ERROR_BALANCE') {
                    current = false
                } else {
                    throw e
                }
            }

            // try slow if not enough for fast
            if (current === false) {
                currentFee = fees[0].feeForTx
                try {
                    current = await (
                        BlocksoftBalances
                            .setCurrencyCode(currencyCode)
                            .setAddress(address)
                            .setFee(currentFee)
                    ).getTransferAllBalance(balanceRaw)
                } catch (e) {
                    if (typeof e.code != 'undefined' && e.code === 'ERROR_BALANCE') {
                        current = false
                        currentFee = currentFee - e.diff
                    } else {
                        throw e
                    }
                }
            }

            // try suggested
            if (current === false) {
                try {
                    current = await (
                        BlocksoftBalances
                            .setCurrencyCode(currencyCode)
                            .setAddress(address)
                            .setFee(currentFee)
                    ).getTransferAllBalance(balanceRaw)
                } catch (e) {
                    e.code = 'ERROR_USER'
                    throw e
                }
            }

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePrettie(current)

            this.setState({
                inputType: 'CRYPTO',
                useAllFunds: true
            })

            this.valueInput.handleInput((1 * amount).toString(), false)
            this.amountInputCallback((1 * amount).toString(), false)

        } catch (e) {
            Log.err('Send.SendScreen.handleTransferAll', e)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.qrScanner.sorry'),
                description: e.message,
                error: e
            })
        }

        setLoaderStatus(false)
    }



    handleSendTransaction = async () => {

        Log.log('SendScreen.handleSendTransaction started')

        const { account, cryptocurrency, useAllFunds } = this.state

        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const wallet = this.props.wallet

        Log.log(addressValidation)

        if (addressValidation.status == 'success' && valueValidation.status == 'success' && valueValidation.value != 0) {

            setLoaderStatus(true)

            const amount = this.state.inputType === 'FIAT' ? this.state.amountEquivalent : valueValidation.value

            try {

                const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makeUnPrettie(amount)

                const balanceRaw = await BlocksoftBalances.setCurrencyCode(account.currency_code).setAddress(account.address).getBalance()
                const balance = await BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(balanceRaw)

                const mainAddressBalanceRaw = typeof cryptocurrency.feesCurrencyCode != 'undefined' ? await BlocksoftBalances.setCurrencyCode(cryptocurrency.feesCurrencyCode).setAddress(account.address).getBalance() : null

                const enoughFunds = {
                    isAvailable: true,
                    messages: []
                }

                if(mainAddressBalanceRaw !== null){

                    const mainAddressBalance = await BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.feesCurrencyCode).makePrettie(mainAddressBalanceRaw)

                    if(mainAddressBalance == 0) {
                        enoughFunds.isAvailable = false
                        enoughFunds.messages.push(strings('send.notEnoughForFee'))
                    }
                }

                if(+amountRaw > +balanceRaw) {
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(strings('send.notEnough'))
                }

                if(enoughFunds.messages.length) {
                    this.setState({ enoughFunds })
                    setLoaderStatus(false)
                    return
                }

                this.setState({
                    enoughFunds: {
                        isAvailable: true,
                        messages: []
                    },
                    balance
                })

                setLoaderStatus(false)

                setTimeout(() => {
                    let data = {
                        amount: amount.toString(),
                        amountRaw,
                        address: addressValidation.value,
                        wallet,
                        cryptocurrency,
                        account,
                        useAllFunds
                    }
                    showModal({
                        type: 'CONFIRM_TRANSACTION_MODAL',
                        data
                    })
                    MarketingEvent.checkSellConfirm(data)
                }, 500)
            } catch (e) {

                setLoaderStatus(false)

                // Log.err('SendScreen.handleSendTransaction error', e)
            }

            Log.log('SendScreen.handleSendTransaction finished')
        }
    }


    amountInputCallback = (value, changeUseAllFunds) => {
        const { currencySymbol, currency_rate_usd } = this.state.cryptocurrency
        const { local_currency } = this.props.settingsStore.data
        const { useAllFunds } = this.state

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }

        const amount = this.state.inputType === 'CRYPTO' ? FiatRatesActions.toLocalCurrency(1 * (currency_rate_usd * (!value ? 0 : value)).toFixed(10)) : 1 * ((!value ? 0 : value) / FiatRatesActions.toLocalCurrency(currency_rate_usd)).toFixed(10)
        const symbol = this.state.inputType === 'CRYPTO' ? local_currency : currencySymbol

        this.setState({
            amountEquivalent: amount,
            amountInputMark: strings('send.equivalent', { amount, symbol })
        })
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {}
        }, 500)
    }

    renderEnoughFundsError = () => {

        const { enoughFunds, balance } = this.state
        const { currencySymbol } = this.state.cryptocurrency

        if(!enoughFunds.isAvailable){
            return (
                <View>
                    {
                        enoughFunds.messages.map((item, index) => {
                            return (
                                <View key={index} style={styles.texts}>
                                    <View style={styles.texts__icon}>
                                        <Icon
                                            name="information-outline"
                                            size={16}
                                            color="#e77ca3"
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.texts__item}>
                                            {/*{ strings('send.notEnough', { balance, symbol: currencySymbol }) }*/}
                                            { item }
                                        </Text>
                                    </View>
                                </View>
                            )
                        })
                    }
                </View>
            )
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('Send.SendScreen')

        const {
            disabled,
            description,
            amountInputMark,
            focused
        } = this.state

        const {
            currencySymbol: currency_symbol,
            currencyCode: currency_code,
            extendsProcessor,
            addressUiChecker
        } = this.state.cryptocurrency

        const { local_currency } = this.props.settingsStore.data

        const { goBackCallback } = this.props.send.data
        const currencySymbol = typeof currency_symbol != 'undefined' ? currency_symbol : ''
        const currencyCode = typeof currency_code != 'undefined' ? currency_code : ''

        // actually should be dict[extendsProcessor].addressUIChecker check but not to take all store will keep simplier
        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }


        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('send.title', { currency: currencySymbol })}
                    goBackCallback={goBackCallback}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => { this.scrollView = ref }}
                        keyboardShouldPersistTaps
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                        style={styles.wrapper__scrollView}>
                        <View>
                            <TextView style={{ height: 70 }}>
                                {description}
                            </TextView>
                            <AddressInput
                                ref={component => this.addressInput = component}
                                id={addressInput.id}
                                onFocus={() => this.onFocus()}
                                name={strings('send.address')}
                                type={extendedAddressUiChecker.toUpperCase() + '_ADDRESS'}
                                paste={!disabled}
                                qr={!disabled}
                                qrCallback={() => {
                                    setQRConfig({
                                        account: this.state.account,
                                        currency: this.state.cryptocurrency,
                                        currencyCode,
                                        title: strings('modal.qrScanner.success.title'),
                                        description: strings('modal.qrScanner.success.description'),
                                        type: 'SEND_SCANNER'
                                    })
                                    setQRValue('')
                                    NavStore.goNext('QRCodeScannerScreen')
                                }}
                                disabled={disabled}
                                validPlaceholder={true}
                            />
                            <View style={{ flexDirection: 'row' }}>
                                <AmountInput
                                    ref={component => this.valueInput = component}
                                    id={amountInput.id}
                                    onFocus={() => this.onFocus()}
                                    autoFocus={true}
                                    name={strings('send.value')}
                                    type={amountInput.type}
                                    decimals={10}
                                    additional={amountInput.additional}
                                    //mark={currencySymbol}
                                    tapText={this.state.inputType === 'FIAT' ? local_currency : currencySymbol}
                                    tapCallback={this.handleChangeEquivalentType}
                                    style={{ marginRight: 2 }}
                                    bottomLeftText={amountInputMark}
                                    keyboardType={'numeric'}
                                    action={{
                                        title: strings('send.useAllFunds').toUpperCase(),
                                        callback: () => {
                                            this.setState({
                                                useAllFunds: !this.state.useAllFunds
                                            })
                                            this.handleTransferAll()
                                        }
                                    }}
                                    disabled={disabled}
                                    callback={(value) => this.amountInputCallback(value, true)}/>
                            </View>
                            { this.renderEnoughFundsError() }
                        </View>

                        <Button press={() => this.handleSendTransaction()}>
                            {strings('send.send')}
                        </Button>
                    </ScrollView>
                </KeyboardAwareView>
            </GradientView>

        )
    }
}

const mapStateToProps = (state) => {
    return {
        send: state.sendStore,
        wallet: state.mainStore.selectedWallet,
        account: state.mainStore.selectedAccount,
        cryptocurrency: state.mainStore.selectedCryptoCurrency,
        fiatRatesStore: state.fiatRatesStore,
        settingsStore: state.settingsStore
    }
}

export default connect(mapStateToProps, {})(SendScreen)

const styles_ = {
    array: ['#fff', '#fff'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    wrapper: {
        flex: 1
        //paddingBottom: 120,
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper__content: {
        flex: 1,
        minHeight: WINDOW_HEIGHT - 100,
        justifyContent: 'space-between',
        paddingTop: 15,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    wrapper__content_active: {
        flex: 1,
        minHeight: 400,
        justifyContent: 'space-between',
        paddingTop: 15,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    text: {
        fontSize: 16,
        color: '#999999',
        textAlign: 'justify'
    },
    slideBtn: {
        array: ['#43156d', '#7127ac'],
        start: { x: 0, y: 1 },
        end: { x: 1, y: 0 }
    },
    slideBtn__content: {
        width: '100%'
    },
    fee: {
        position: 'relative',
        height: 250,
        marginTop: 15,
        overflow: 'visible',
        zIndex: 10
    },
    fee__content_active: {
        position: 'absolute',
        right: 0,
        top: 20,
        width: 150,
        paddingBottom: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopLeftRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
        backgroundColor: '#fff',
        zIndex: 20
    },
    fee__content: {
        width: 0,
        height: 0
    },
    fee__subtitle: {
        marginRight: 5,
        textAlign: 'right',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    fee__text: {
        marginRight: 5,
        textAlign: 'right',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999'
    },
    fee__title: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999'
    },
    fee__btn: {
        width: 60,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
    },
    fee__btn_active: {
        width: 60,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    fee__btn_title: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#864dd9'
    },
    fee__item: {
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10
    },
    feeText: {
        marginTop: -4,
        fontSize: 19,
        color: '#404040',
        fontFamily: 'SFUIDisplay-Regular'
    },
    inputWrap: {
        flexDirection: 'row'
    },
    fee__line: {
        marginTop: 10,
        width: '100%',
        height: 1,
        backgroundColor: '#e3e6e9'
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30,
    },
    texts__item: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e77ca3'
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg'}]
    },
}
