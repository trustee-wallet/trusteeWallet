import React, { Component } from 'react'

import { connect } from 'react-redux'

import {
    View,
    ScrollView,
    Keyboard,
    Text
} from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'


import TextView from '../../components/elements/Text'
import AddressInput from '../../components/elements/Input'
import AmountInput from '../../components/elements/Input'
import MemoInput from '../../components/elements/Input'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'

import accountDS from '../../appstores/DataSource/Account/Account'
import { setQRConfig, setQRValue } from '../../appstores/Actions/QRCodeScannerActions'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import { showModal } from '../../appstores/Actions/ModalActions'

import { strings } from '../../services/i18n'

import BlocksoftTransfer from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'

import Theme from '../../themes/Themes'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import BlocksoftInvoice from '../../../crypto/actions/BlocksoftInvoice/BlocksoftInvoice'
import utils from '../../services/utils'

let styles

const addressInput = {
    id: 'address',
    type: 'ETH_ADDRESS'
}

const memoInput = {
    id: 'memo',
    type: 'string'
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
            destinationTag: null,
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
        this.memoInput = React.createRef()
        this.valueInput = React.createRef()
        this.fee = React.createRef()
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {

        AsyncStorage.getItem('sendInputType').then(res => {
            if (res !== null) {
                this.setState({
                    inputType: res
                })
            }
        })

        styles = Theme.getStyles().sendScreenStyles

        this.init()

        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.init()
        })
    }

    init = async () => {
        if (Object.keys(this.props.send.data).length != 0) {
            const {
                sendType,
                disabled,
                account,
                address,
                value,
                cryptocurrency,
                description,
                destinationTag,
                useAllFunds
            } = this.props.send.data

            this.transferPrecache(account)

            this.setState({
                disabled,
                account,
                cryptocurrency,
                description,
                destinationTag,
                useAllFunds,
                inputType: 'CRYPTO',
                init: true
            }, () => {

                this.prepareCurrencyBalance()

                typeof this.memoInput.handleInput !== "undefined" ? this.memoInput.handleInput(destinationTag) : null

                this.addressInput.handleInput(address)
                this.valueInput.handleInput(value)
                this.amountInputCallback(value === '' ? this.valueInput.getValue() : value)

                if (sendType == 'REPLACE_TRANSACTION') {
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

            setLoaderStatus(false)

            this.setState({
                account,
                cryptocurrency,
                init: true,
                description: strings('send.description')
            }, () => {
                this.prepareCurrencyBalance()
                this.amountInputCallback()
            })

            this.transferPrecache(account)
        }
    }

    prepareCurrencyBalance = async () => {

        const { mainStore } = this.props

        let prepareCryptocurrency = JSON.parse(JSON.stringify(this.state.cryptocurrency))

        if(mainStore.selectedWallet.wallet_use_unconfirmed && (prepareCryptocurrency.currencyCode === "BTC" || (prepareCryptocurrency.addressUiChecker !== undefined && prepareCryptocurrency.addressUiChecker === 'BTC_BY_NETWORK'))) {

            const currencyBalance = await this.handleTransferAll(false)

            setLoaderStatus(false)

            prepareCryptocurrency = {
                ...prepareCryptocurrency,
                ...currencyBalance
            }

            this.setState({
                cryptocurrency: {
                    ...this.state.cryptocurrency,
                    ...prepareCryptocurrency
                }
            })
        }

    }

    transferPrecache = (account) => {
        try {
            (BlocksoftTransfer.setCurrencyCode(account.currency_code).setWalletHash(account.wallet_hash).setAddressFrom(account.address).setDerivePath(account.derivation_path)).getTransferPrecache()
        } catch (e) {
            //do nothing but actually could be shown!
        }
    }

    handleChangeEquivalentType = () => {

        const { currencySymbol } = this.state.cryptocurrency
        const { local_currency } = this.props.settingsStore.data

        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'

        AsyncStorage.setItem('sendInputType', inputType)

        let amountEquivalent

        const toInput = (!(1 * this.state.amountEquivalent) ? '' : this.state.amountEquivalent).toString()
        const toEquivalent = !this.valueInput.getValue() ? '0' : this.valueInput.getValue()

        if (inputType === 'FIAT') {
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

    handleTransferAll = async (handleInput = true) => {

        Keyboard.dismiss()

        setLoaderStatus(true)

        const {
            wallet_hash: walletHash
        } = this.props.wallet

        const {
            address,
            derivation_path: derivationPath
        } = this.state.account

        const { currencyCode } = this.state.cryptocurrency

        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')


        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {

            const tmp = await BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address).getBalance()
            const balanceRaw = tmp ? BlocksoftUtils.add(tmp.balance, tmp.unconfirmed) : 0 // to think show this as option or no
            Log.log(`SendScreen.handleTransferAll balance ${currencyCode} ${address} data`, tmp)

            let addressToForTransferAll = (BlocksoftTransfer.setCurrencyCode(currencyCode)).getAddressToForTransferAll(address)

            const addressValidate = handleInput ? await this.addressInput.handleValidate() : { status: "fail" }

            if (addressValidate.status === 'success') {
                addressToForTransferAll = addressValidate.value
            }

            Log.log(`SendScreen.handleTransferAll balance ${currencyCode} ${address} addressToForTransferAll`, addressToForTransferAll)

            const fees = await (
                BlocksoftTransfer
                    .setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(address)
                    .setAddressTo(addressToForTransferAll)
                    .setAmount(balanceRaw)
                    .setTransferAll(true)
            ).getFeeRate()

            let current = false

            // try fast
            let currentFee = fees ? fees[fees.length - 1] : 0
            try {
                try {
                    current = await (
                        BlocksoftTransfer
                            .setCurrencyCode(currencyCode)
                            .setAddressFrom(address)
                            .setAddressTo(addressToForTransferAll)
                            .setFee(currentFee)
                    ).getTransferAllBalance(balanceRaw)
                } catch (e) {
                    if (typeof e.code != 'undefined' && e.code === 'ERROR_BALANCE_MINUS_FEE' && fees) {
                        currentFee = fees[0]
                        current = await (
                            BlocksoftTransfer
                                .setCurrencyCode(currencyCode)
                                .setAddressFrom(address)
                                .setAddressTo(addressToForTransferAll)
                                .setFee(currentFee)
                        ).getTransferAllBalance(balanceRaw)
                    } else {
                        throw e
                    }
                }
            } catch (e) {
                if (typeof e.code != 'undefined' && e.code === 'ERROR_BALANCE' && fees) {
                    current = false
                } else {
                    throw e
                }
            }

            // try slow if not enough for fast
            if (current === false) {
                currentFee = fees[0]
                try {
                    current = await (
                        BlocksoftTransfer
                            .setCurrencyCode(currencyCode)
                            .setAddressFrom(address)
                            .setAddressTo(addressToForTransferAll)
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

            if(handleInput) {
                this.valueInput.handleInput((1 * Math.abs(amount)).toString(), false)
                this.amountInputCallback((1 * Math.abs(amount)).toString(), false)
            }

            setLoaderStatus(false)

            return { currencyBalanceAmount: amount, currencyBalanceAmountRaw: current }

        } catch (e) {

            Log.errorTranslate(e, 'Send.SendScreen.handleTransferAll', typeof extend.addressCurrencyCode === "undefined" ? extend.currencySymbol : extend.addressCurrencyCode,  JSON.stringify(extend))

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: null,
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

        const currencies = JSON.parse(JSON.stringify(this.props.mainStore.currencies))
        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const destinationTagValidation = typeof this.memoInput.handleInput !== "undefined" ? await this.memoInput.handleValidate() : { status: "success", value: false }

        const wallet = this.props.wallet
        const extend = BlocksoftDict.getCurrencyAllSettings(cryptocurrency.currencyCode)

        Log.log('addressValidation', addressValidation)
        Log.log('valueValidation', valueValidation)

        if (addressValidation.status === 'success' && valueValidation.status === 'success' && valueValidation.value != 0 && destinationTagValidation.status === "success") {

            Keyboard.dismiss()

            const enoughFunds = {
                isAvailable: true,
                messages: []
            }

            if (typeof extend.delegatedTransfer === 'undefined') {

                const parentCurrency = currencies.filter(item => item.currencyCode === extend.addressCurrencyCode)

                if (parentCurrency.length) {
                    const parentBalance = +parentCurrency[0].currencyBalanceAmountRaw
                    if (parentBalance === 0) {
                        enoughFunds.isAvailable = false
                        const msg = strings('send.notEnoughForFee', { symbol: extend.addressCurrencyCode })
                        enoughFunds.messages.push(msg)
                    } else if (cryptocurrency.currencyCode === 'USDT' && parentBalance < 550) {
                        enoughFunds.isAvailable = false
                        const msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT', { symbol: extend.addressCurrencyCode })
                        enoughFunds.messages.push(msg)
                    }
                }


                // if (+cryptocurrency.currencyBalanceAmount === 0) {
                //     enoughFunds.isAvailable = false
                //     enoughFunds.messages.push(strings('send.notEnough'))
                // }

                if (enoughFunds.messages.length) {
                    this.setState({ enoughFunds })
                    return
                }
            }

            setLoaderStatus(true)

            const amount = this.state.inputType === 'FIAT' ? this.state.amountEquivalent : valueValidation.value
            const memo = destinationTagValidation.value.toString()

            try {


                const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makeUnPrettie(amount)
                const balanceRaw = cryptocurrency.currencyBalanceAmountRaw
                /*
                // seems could be removed
                let balanceRaw = amountRaw * 2
                try {
                    const tmp = await (BlocksoftBalances.setCurrencyCode(cryptocurrency.currencyCode).setAddress(account.address)).getBalance()
                    balanceRaw = tmp ? BlocksoftUtils.add(tmp.balance, tmp.unconfirmed) : 0 // to think show this as option or no
                    Log.log(`SendScreen.handleSendTransaction balance ${account.currency_code} ${account.address} data`, tmp)
                } catch (e) {
                    if (e.message === 'node.is.out') {
                        // show something in the state
                    } else {
                        Log.err(`SendScreen.handleSendTransaction balance scan error ` + e.message, JSON.stringify(account))
                        throw e // node out of sync shouldnt break the flow
                    }
                }
                const balance = await BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(balanceRaw)

                let mainAddressBalanceRaw = null
                if (typeof cryptocurrency.feesCurrencyCode != 'undefined') {
                    let tmp = await BlocksoftBalances.setCurrencyCode(cryptocurrency.feesCurrencyCode).setAddress(account.address).getBalance()
                    mainAddressBalanceRaw = tmp ? tmp.balance : 0
                    Log.log(`SendScreen.handleSendTransaction fees balance ${account.feesCurrencyCode} ${account.address} data`, tmp)
                }

                if(mainAddressBalanceRaw !== null){

                    const mainAddressBalance = await BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.feesCurrencyCode).makePrettie(mainAddressBalanceRaw)

                    if(mainAddressBalance == 0) {
                        enoughFunds.isAvailable = false
                        const msg = strings('send.notEnoughForFee', { symbol: typeof extend.addressCurrencyCode == 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode })
                        enoughFunds.messages.push(msg)
                    }
                }
                */

                // const diff = BlocksoftUtils.toBigNumber(amountRaw).sub(BlocksoftUtils.toBigNumber(balanceRaw + '')).toString()
                const diff = amountRaw - balanceRaw

                const logData = {
                    amBN: BlocksoftUtils.toBigNumber(amountRaw).toString(),
                    amountRaw,
                    blBN : BlocksoftUtils.toBigNumber(balanceRaw + '').toString(),
                    balanceRaw,
                    diff
                }
                Log.log('SendScreen.handleSendTransaction', logData)

                if (diff > 0) {
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(strings('send.notEnough'))
                }

                if (enoughFunds.messages.length) {
                    this.setState({ enoughFunds })
                    setLoaderStatus(false)
                    return
                }

                this.setState({
                    enoughFunds: {
                        isAvailable: true,
                        messages: []
                    },
                    balance: cryptocurrency.currencyBalanceAmount
                })

                // setLoaderStatus(false)

                setTimeout(() => {
                    const data = {
                        memo,
                        amount: amount.toString(),
                        amountRaw,
                        address: addressValidation.value,
                        wallet,
                        cryptocurrency,
                        account,
                        useAllFunds,
                        type: this.props.send.data.type
                    }

                    NavStore.goNext('ConfirmSendScreen', {
                        confirmSendScreenParam: data
                    })

                    MarketingEvent.checkSellConfirm({
                        memo: memo.toString(),
                        currency_code: cryptocurrency.currencyCode,
                        address_from: account.address,
                        address_to: data.address,
                        address_amount: data.amount,
                        walletHash: account.wallet_hash
                    })
                }, 500)
            } catch (e) {

                setLoaderStatus(false)
                Log.err('SendScreen.handleSendTransaction error', e)
            }

            Log.log('SendScreen.handleSendTransaction finished')
        }
    }

    handleCheckInvoice = async () => {
        // @misha todo
        const invoice = this.addressInput.getValue()
        Log.log('SendScreen.handleCheckInvoice started for ' + invoice)
        BlocksoftInvoice.setCurrencyCode(this.props.account.currency_code).setAddress(this.props.account.address).setAdditional(this.props.account.account_json)
        try {
            let res = await BlocksoftInvoice.checkInvoice(invoice)
            console.log('res', res)
            if (!res.could_pay) {
                // show "expired invoice" - the invoice couldnt be paid
                console.log('not valid invoice')
            } else {
                // everything is ok - lets go
                console.log('memo to show somewhere', res.memo)
                console.log('created time to show?', res.created)
                console.log('time left to pay, to show?', res.timed)

                const amount = BlocksoftPrettyNumbers.setCurrencyCode('BTC').makePrettie(res.amount)

                this.valueInput.handleInput((1 * amount).toString(), false)
                this.amountInputCallback((1 * amount).toString(), false)

            }
        } catch (e) {
            console.log('just error', e.message)
            if (e.message === 'not a valid invoice') {
                // need just to clean address and show "wrong invoice" - the invoice couldnt be paid
            } else {
                Log.err('SendScreen.handleCheckInvoice error', e)
                // some new error - server timeouted or the bug - wait a little bit
            }
        }

    }

    amountInputCallback = (value, changeUseAllFunds) => {
        const { currencySymbol, currencyCode, currency_rate_usd } = this.state.cryptocurrency
        const { local_currency } = this.props.settingsStore.data
        const { useAllFunds } = this.state

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }

        let amount = 0
        if (this.state.inputType === 'CRYPTO') {
            amount = FiatRatesActions.toGeneralLocalCurrency({
                localCurrency : local_currency,
                currencyCode : currencyCode,
                currencyBalanceAmount : !value ? 0 : value,
                currencyRateUsd : currency_rate_usd
            })
        } else if (!value) {
            amount = 0
        } else {
            amount = 1 * ( value / FiatRatesActions.toLocalCurrency(currency_rate_usd)).toFixed(10)
        }

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
            } catch (e) {
            }
        }, 500)
    }

    renderEnoughFundsError = () => {

        const { enoughFunds } = this.state

        if (!enoughFunds.isAvailable) {
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
                                            {item}
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
            addressUiChecker,
            network
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

        const { type } = this.props.send.data

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('send.title', { currency: currencySymbol })}
                    goBackCallback={goBackCallback}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps={'always'}
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
                                subtype={network}
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
                            {
                                currencyCode === 'BTC_LIGHT' ?
                                    <Button press={() => this.handleCheckInvoice()}>
                                        Load invoice (should be auto)
                                    </Button> : null
                            }
                            {
                                currencyCode === 'XRP' ?
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            disabled={disabled}
                                            name={strings('send.xrp_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'numeric'}
                                            decimals={0}
                                            additional={"NUMBER"}
                                        /> : null
                            }
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
                                    tapText={this.state.inputType === 'FIAT' ? local_currency : currencySymbol}
                                    tapCallback={this.handleChangeEquivalentType}
                                    style={{ marginRight: 2 }}
                                    bottomLeftText={type !== 'TRADE_SEND' ? amountInputMark : undefined}
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
                            {this.renderEnoughFundsError()}
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
        mainStore: state.mainStore,
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
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
