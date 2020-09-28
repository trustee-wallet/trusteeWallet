/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'


import TextView from '../../components/elements/Text'
import AddressInput from '../../components/elements/Input'
import AmountInput from '../../components/elements/Input'
import MemoInput from '../../components/elements/Input'
import Input from '../../components/elements/Input'
import TextareaInput from '../../components/elements/Input'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'

import { setQRConfig, setQRValue } from '../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../services/i18n'

import BlocksoftTransfer from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'

import DaemonCache from '../../daemons/DaemonCache'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import Theme from '../../themes/Themes'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LetterSpacing from '../../components/elements/LetterSpacing'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import config from '../../config/config'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import api from '../../services/Api/Api'
import { getPubFioAddress, isFioAddressRegistered } from '../../../crypto/blockchains/fio/FioUtils'

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

let IS_CALLED_BACK = false
let BASIC_INPUT_TYPE = 'CRYPTO'

class SendScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            init: false,
            account: {},
            cryptoCurrency: {},
            wallet: {},
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

            inputType: 'CRYPTO',

            toTransactionJSON: {},

            copyAddress: false
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
                BASIC_INPUT_TYPE = res
                this.setState({
                    inputType: res
                })
            }
        })

        styles = Theme.getStyles().sendScreenStyles

        // @misha is it needed two inits?
        this.init()

        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.init()
        })
    }

    init = async () => {
        if (Object.keys(this.props.send.data).length !== 0) {
            // Log.log('INIT SEND DATA', this.props.send.data)
            let {
                sendType,
                account,
                address,
                comment = '',
                value,
                disabled,
                cryptoCurrency,
                description,
                destinationTag,
                useAllFunds,
                toTransactionJSON,
                copyAddress,
                inputType,
                type
            } = this.props.send.data
            if (type === 'TRADE_SEND') {
                inputType = 'CRYPTO'
            }
            // Log.log(inputType, type)

            this.transferPrecache(account)

            const toState = {
                account,
                cryptoCurrency,
                description,
                destinationTag,
                useAllFunds,
                inputType: inputType || BASIC_INPUT_TYPE,
                init: true
            }

            if (typeof toTransactionJSON !== 'undefined') {
                toState.toTransactionJSON = toTransactionJSON
            }

            if (typeof disabled !== 'undefined') {
                toState.disabled = disabled
            }

            if (typeof copyAddress !== 'undefined') {
                toState.copyAddress = copyAddress
            }

            this.setState({
                ...toState
            }, () => {

                typeof this.memoInput.handleInput !== 'undefined' ? this.memoInput.handleInput(destinationTag) : null

                this.addressInput.handleInput(address)
                this.commentInput.handleInput(comment)
                this.valueInput.handleInput(value)
                this.amountInputCallback(value === '' ? this.valueInput.getValue() : value)

                if (sendType === 'REPLACE_TRANSACTION') {
                    setTimeout(() => {
                        this.handleSendTransaction()
                    }, 500)

                }

                this.setState({
                    useAllFunds
                })

            })
        } else {
            const { account, cryptoCurrency } = this.props

            setLoaderStatus(false)

            this.setState({
                account,
                cryptoCurrency,
                init: true,
                description: strings('send.description')
            }, () => {
                this.amountInputCallback()
            })

            this.transferPrecache(account)
        }
    }

    transferPrecache = (account) => {
        try {
            // (BlocksoftTransfer.setCurrencyCode(account.currencyCode).setWalletHash(account.walletHash).setAddressFrom(account.address).setDerivePath(account.derivationPath)).getTransferPrecache()
        } catch (e) {
            // do nothing but actually could be shown!
        }
    }

    handleChangeEquivalentType = () => {
        const { currencySymbol } = this.state.cryptoCurrency
        const { basicCurrencyCode } = this.state.account

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
            amountInputMark: strings('send.equivalent', {
                amount: amountEquivalent,
                symbol: this.state.inputType === 'FIAT' ? basicCurrencyCode : currencySymbol
            }),
            amountEquivalent,
            inputType
        })
    }

    handleTransferAll = async (handleInput = true) => {

        Keyboard.dismiss()

        setLoaderStatus(true)

        const { walletHash, walletUseUnconfirmed } = this.props.wallet

        const { address, derivationPath, currencyCode, balance, unconfirmed, accountJson } = this.state.account

        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            // const tmp = await BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address).getBalance()
            // const balanceRaw = tmp ? BlocksoftUtils.add(tmp.balance, tmp.unconfirmed) : 0 // to think show this as option or no
            const balanceRaw = walletUseUnconfirmed ? BlocksoftUtils.add(balance, unconfirmed).toString() : balance
            Log.log(`SendScreen.handleTransferAll balance ${currencyCode} ${address} data ${balance} + ${unconfirmed} => ${balanceRaw}`)

            let addressToForTransferAll = (BlocksoftTransfer.setCurrencyCode(currencyCode)).getAddressToForTransferAll(address)

            const addressValidate = handleInput ? await this.addressInput.handleValidate() : { status: 'fail' }

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
                    .setFee(false)
                    .setTransferAll(true)
                    .setAdditional(accountJson)
            ).getFeeRate(true)

            let current = false

            // try fast
            // Log.log('fees1', JSON.parse(JSON.stringify(fees)))
            let currentFee = fees ? fees[fees.length - 1] : 0
            try {
                try {
                    current = await (
                        BlocksoftTransfer
                            .setCurrencyCode(currencyCode)
                            .setAddressFrom(address)
                            .setAddressTo(addressToForTransferAll)
                            .setFee(currentFee)
                            .setAdditional(accountJson)
                    ).getTransferAllBalance(balanceRaw)
                } catch (e) {
                    if (fees) {
                        currentFee = fees[0]
                        current = await (
                            BlocksoftTransfer
                                .setCurrencyCode(currencyCode)
                                .setAddressFrom(address)
                                .setAddressTo(addressToForTransferAll)
                                .setFee(currentFee)
                                .setAdditional(accountJson)
                        ).getTransferAllBalance(balanceRaw)
                    } else {
                        throw e
                    }
                }
            } catch (e) {
                if (fees) {
                    current = false
                } else {
                    throw e
                }
            }

            // try slow if not enough for fast
            // Log.log('fees', JSON.parse(JSON.stringify(fees)))
            if (fees && typeof fees[0] !== 'undefined' && (current === false || current === 0)) {
                currentFee = fees[0]
                current = await (
                    BlocksoftTransfer
                        .setCurrencyCode(currencyCode)
                        .setAddressFrom(address)
                        .setAddressTo(addressToForTransferAll)
                        .setFee(currentFee)
                        .setAdditional(accountJson)
                ).getTransferAllBalance(balanceRaw)

                if (current === false || current === 0) {
                    currentFee.feeForTx = currentFee.feeForTx / 2
                    current = await (
                        BlocksoftTransfer
                            .setCurrencyCode(currencyCode)
                            .setAddressFrom(address)
                            .setAddressTo(addressToForTransferAll)
                            .setFee(currentFee)
                            .setAdditional(accountJson)
                    ).getTransferAllBalance(balanceRaw)
                }
            }


            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(current)

            this.setState({
                inputType: 'CRYPTO',
                useAllFunds: true
            })

            try {
                if (handleInput
                    && typeof this.valueInput !== 'undefined' && this.valueInput
                    && typeof this.valueInput.handleInput !== 'undefined' && this.valueInput.handleInput
                    && typeof amount !== 'undefined' && amount !== null
                ) {
                    this.valueInput.handleInput((1 * Math.abs(amount)).toString(), false)
                    this.amountInputCallback((1 * Math.abs(amount)).toString(), false)
                }
            } catch (e) {
                e.message += ' while this.valueInput.handleInput amount ' + amount
                throw e
            }

            setLoaderStatus(false)

            return { currencyBalanceAmount: amount, currencyBalanceAmountRaw: current }

        } catch (e) {
            // console.error(e)
            Log.errorTranslate(e, 'Send.SendScreen.handleTransferAll', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

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

    handleOkForce = async () => {
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('send.confirmModal.title'),
            description: strings('send.confirmModal.force')
        }, () => {
            this.handleSendTransaction(true)
        })
    }

    handleSendTransaction = async (force = false) => {

        Log.log('SendScreen.handleSendTransaction started ' + (force ? 'FORCE' : 'usual'))

        const { account, cryptoCurrency, toTransactionJSON, useAllFunds } = this.state

        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const commentValidation = await this.commentInput.handleValidate()
        const destinationTagValidation = typeof this.memoInput.handleInput !== 'undefined' ? await this.memoInput.handleValidate() : {
            status: 'success',
            value: false
        }

        const wallet = this.props.wallet
        const extend = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)

        if (addressValidation.status !== 'success') {
            Log.log('SendScreen.handleSendTransaction invalid address ' + JSON.stringify(addressValidation))
            return
        }
        if (!force && valueValidation.status !== 'success') {
            Log.log('SendScreen.handleSendTransaction invalid value ' + JSON.stringify(valueValidation))
            return
        }
        if (!force && valueValidation.value === 0) {
            Log.log('SendScreen.handleSendTransaction value is 0 ' + JSON.stringify(valueValidation))
            return
        }
        if (commentValidation.status !== 'success') {
            Log.log('SendScreen.handleSendTransaction invalid comment ' + JSON.stringify(commentValidation))
            return
        }
        if (destinationTagValidation.status !== 'success') {
            Log.log('SendScreen.handleSendTransaction invalid destination ' + JSON.stringify(destinationTagValidation))
            return
        }

        Keyboard.dismiss()

        const enoughFunds = {
            isAvailable: true,
            messages: []
        }

        if (!force && typeof extend.delegatedTransfer === 'undefined' && typeof extend.feesCurrencyCode !== 'undefined' && typeof extend.skipParentBalanceCheck === 'undefined') {
            const parentCurrency = await DaemonCache.getCacheAccount(account.walletHash, extend.feesCurrencyCode)
            if (parentCurrency) {
                const parentBalance = parentCurrency.balance * 1
                if (parentBalance === 0) {
                    enoughFunds.isAvailable = false
                    let msg
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed > 0) {
                        msg = strings('send.notEnoughForFeeConfirmed', { symbol: extend.addressCurrencyCode })
                    } else {
                        msg = strings('send.notEnoughForFee', { symbol: extend.addressCurrencyCode })
                    }
                    enoughFunds.messages.push(msg)
                    Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
                    if (config.debug.appErrors) {
                        Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
                    }
                } else if (cryptoCurrency.currencyCode === 'USDT' && parentBalance < 550) {
                    let msg
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed > 0) {
                        msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT_WAIT_FOR_CONFIRM', { symbol: extend.addressCurrencyCode })
                    } else {
                        msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT', { symbol: extend.addressCurrencyCode })
                    }
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(msg)
                    Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                    if (config.debug.appErrors) {
                        Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                    }
                } else {
                    Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance is ok ' + parentBalance, parentCurrency)
                }
            } else {
                Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentCurrency not found ' + parentCurrency, parentCurrency)
            }


            if (enoughFunds.messages.length) {
                this.setState({ enoughFunds })
                return
            }
        }

        let recipientAddress = addressValidation.value;
        if (await isFioAddressRegistered(recipientAddress)) {
            const publicFioAddress = await getPubFioAddress(addressValidation.value, cryptoCurrency.currencyCode, cryptoCurrency.currencyCode);
            if (!publicFioAddress) {
                const msg = strings('send.publicFioAddressNotFound', { symbol: cryptoCurrency.currencyCode })
                Log.log('SendScreen.handleSendTransaction ' + msg)
                enoughFunds.isAvailable = false
                enoughFunds.messages.push(msg)
                this.setState({ enoughFunds })
                return
            }
            recipientAddress = publicFioAddress;
        }

        setLoaderStatus(true)

        const amount = this.state.inputType === 'FIAT' ? this.state.amountEquivalent : valueValidation.value
        const comment = commentValidation.value
        const memo = destinationTagValidation.value.toString()


        try {
            toTransactionJSON.comment = comment

            const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(cryptoCurrency.currencyCode).makeUnPretty(amount)
            if (typeof amountRaw === 'undefined') {
                Log.err('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' not ok amountRaw ', {'eq' : this.state.amountEquivalent, 'vaL' :valueValidation.value, amount, amountRaw})
            }
            const balanceRaw = account.balanceRaw

            if (!force) {
                const diff = BlocksoftUtils.diff(amountRaw, balanceRaw)
                if (diff > 0) {
                    Log.log('SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' not ok diff ' + diff, {
                        amountRaw,
                        balanceRaw
                    })
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(strings('send.notEnough'))
                }

                if (enoughFunds.messages.length) {
                    this.setState({ enoughFunds })
                    setLoaderStatus(false)
                    return
                }
            }

            this.setState({
                enoughFunds: {
                    isAvailable: true,
                    messages: []
                },
                balance: cryptoCurrency.currencyBalanceAmount
            })

            setTimeout(() => {
                Log.log('SendScreen.handleSendTransaction amount ' + amount)
                const data = {
                    memo,
                    amount: typeof amount === 'undefined' ? '0' : amount.toString(),
                    amountRaw,
                    address: recipientAddress,
                    wallet,
                    cryptoCurrency,
                    account,
                    useAllFunds,
                    toTransactionJSON,
                    type: this.props.send.data.type
                }

                NavStore.goNext('ConfirmSendScreen', {
                    confirmSendScreenParam: data
                })

                MarketingEvent.checkSellConfirm({
                    memo: memo.toString(),
                    currencyCode: cryptoCurrency.currencyCode,
                    addressFrom: account.address,
                    addressTo: data.address,
                    addressAmount: data.amount,
                    walletHash: account.walletHash
                })
            }, 500)
        } catch (e) {

            setLoaderStatus(false)
            Log.err('SendScreen.handleSendTransaction error', e)
        }

        Log.log('SendScreen.handleSendTransaction finished')

    }

    amountInputCallback = (value, changeUseAllFunds) => {
        const { currencySymbol, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencySymbol, basicCurrencyRate } = this.state.account
        const { useAllFunds } = this.state

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }

        let amount = 0
        let symbol = currencySymbol
        try {
            if (!value || value === 0) {
                amount = 0
                symbol = ''
            } else if (this.state.inputType === 'CRYPTO') {
                amount = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                symbol = basicCurrencySymbol
            } else {
                amount = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
            }
        } catch (e) {
            Log.log('SendScreen equivalent error ' + e.message)
        }

        if (amount > 0) {
            this.setState({
                amountEquivalent: amount,
                amountInputMark: strings('send.equivalent', { amount, symbol })
            })
        }
        IS_CALLED_BACK = false
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

        Log.log('SendScreen renderEnoughFundsError', enoughFunds)
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
                                        <TouchableOpacity style={styles.texts__item} delayLongPress={500} onLongPress={() => this.handleOkForce()}>
                                            <Text>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        })
                    }
                </View>
            )
        }
    }

    renderAccountDetail = () => {

        const { currencySymbol, currencyName, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencyRate, balancePretty, unconfirmedPretty } = this.state.account
        const { walletUseUnconfirmed } = this.state.wallet

        const amount = walletUseUnconfirmed === 1 ? BlocksoftUtils.add(balancePretty, unconfirmedPretty).toString() : balancePretty
        const amountPrep = BlocksoftPrettyNumbers.makeCut(amount).cutted

        let sumPrep = amountPrep + ' ' + currencySymbol

        if (amount && currencyCode && basicCurrencyRate) {
            try {
                const basicCurrencyCode = this.state.account.basicCurrencyCode || 'USD'
                const basicAmount = RateEquivalent.mul({ value: amount, currencyCode, basicCurrencyRate })
                const basicAmountPrep = BlocksoftPrettyNumbers.makeCut(basicAmount, 2).cutted
                if (this.state.inputType === 'CRYPTO') {
                    sumPrep += ' / ' + basicAmountPrep + ' ' + basicCurrencyCode
                } else {
                    sumPrep = basicAmountPrep + ' ' + basicCurrencyCode + ' / ' + sumPrep
                }
            } catch (e) {
                Log.log('SendScreen renderAccountDetail error ' + e.message)
            }
        }

        return (
            <View style={styles.accountDetail}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View>
                        <CurrencyIcon currencyCode={currencyCode}
                                      containerStyle={{}}/>
                    </View>
                    <View style={styles.accountDetail__content}>
                        <View style={{ paddingRight: 180 }}>
                            <Text style={styles.accountDetail__title} numberOfLines={1}>
                                {currencyName}
                            </Text>
                            <View style={{ alignItems: 'flex-start' }}>
                                <LetterSpacing text={sumPrep} textStyle={styles.accountDetail__text} letterSpacing={1}/>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    closeAction = () => {
        const { toTransactionJSON } = this.props.send.data

        if (typeof toTransactionJSON !== 'undefined' && typeof toTransactionJSON.bseOrderID !== 'undefined') {
            api.setExchangeStatus(toTransactionJSON.bseOrderID, 'close')
        }

        NavStore.goBack()
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        firebase.analytics().setCurrentScreen('Send.SendScreen')

        const route = NavStore.getCurrentRoute()
        if (route.routeName === 'SendScreen') {
            if (!IS_CALLED_BACK) {
                if (typeof this.state.amountEquivalent === 'undefined' || this.state.amountEquivalent.toString() === '0') {
                    if (typeof this.valueInput !== 'undefined' && typeof this.valueInput.getValue !== 'undefined') {
                        const value = this.valueInput.getValue()
                        if (value) {
                            IS_CALLED_BACK = true
                            this.amountInputCallback(value)
                        }
                    }
                }
            }
        } else {
            IS_CALLED_BACK = false
        }

        const {
            disabled,
            description,
            amountInputMark,
            focused,
            copyAddress
        } = this.state

        const {
            currencySymbol,
            currencyCode,
            extendsProcessor,
            addressUiChecker,
            decimals,
            network
        } = this.state.cryptoCurrency

        const basicCurrencyCode = this.state.account.basicCurrencyCode || 'USD'

        // actually should be dict[extendsProcessor].addressUIChecker check but not to take all store will keep simplier
        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }

        const { type } = this.props.send.data

        const prev = NavStore.getPrevRoute().routeName
        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('send.title', { currency: currencySymbol })}
                    CustomComponent={this.renderAccountDetail}
                    backAction={this.closeAction}
                    closeAction={this.closeAction}
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
                                style={{marginTop: 20}}
                                ref={component => this.addressInput = component}
                                id={addressInput.id}
                                // onFocus={() => this.onFocus()}
                                name={strings('send.address')}
                                type={extendedAddressUiChecker.toUpperCase() + '_ADDRESS'}
                                subtype={network}
                                cuttype={currencySymbol}
                                paste={!disabled}
                                fio={disabled}
                                copy={copyAddress}
                                qr={!disabled}
                                qrCallback={() => {
                                    setQRConfig({
                                        account: this.state.account,
                                        cryptoCurrency: this.state.cryptoCurrency,
                                        currencyCode,
                                        inputType: this.state.inputType,
                                        title: strings('modal.qrScanner.success.title'),
                                        description: strings('modal.qrScanner.success.description'),
                                        type: 'SEND_SCANNER'
                                    })
                                    setQRValue('')
                                    NavStore.goNext('QRCodeScannerScreen')
                                }}
                                disabled={disabled}
                                validPlaceholder={true}
                                noEdit={prev === 'TradeScreenStack' || prev === 'ExchangeScreenStack' ? true : 0}
                            />
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
                                        additional={'NUMBER'}
                                    /> : null
                            }

                            {
                                currencyCode === 'XMR' ?
                                    <MemoInput
                                        ref={component => this.memoInput = component}
                                        id={memoInput.id}
                                        disabled={disabled}
                                        name={strings('send.xmr_memo')}
                                        type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                        keyboardType={'default'}
                                    /> : null
                            }

                            <AmountInput
                                ref={component => this.valueInput = component}
                                id={amountInput.id}
                                // onFocus={() => this.onFocus()}
                                // autoFocus={true}
                                name={strings('send.value')}
                                type={amountInput.type}
                                decimals={decimals || 10}
                                additional={amountInput.additional}
                                tapText={this.state.inputType === 'FIAT' ? basicCurrencyCode : currencySymbol}
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
                                noEdit={prev === 'TradeScreenStack' || prev === 'ExchangeScreenStack' ? true : 0}
                                callback={(value) => this.amountInputCallback(value, true)}/>

                            <View style={{ flexDirection: 'row' }}>
                                <Input
                                    ref={component => this.commentInput = component}
                                    id={'comment'}
                                    // onFocus={() => this.onFocus()}
                                    name={strings('send.comment')}
                                    type={'OPTIONAL'}
                                    isTextarea={true}
                                    style={{ marginRight: 2 }}/>
                            </View>
                            {this.renderEnoughFundsError()}
                        </View>

                        <Button press={() => this.handleSendTransaction(false)}>
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
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        settingsStore: state.settingsStore
    }
}

export default connect(mapStateToProps, {})(SendScreen)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
