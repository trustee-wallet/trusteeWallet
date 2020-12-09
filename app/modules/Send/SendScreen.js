/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity, Dimensions } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'

import AddressInput from '../../components/elements/NewInput'
import AmountInput from './elements/Input'
import MemoInput from '../../components/elements/NewInput'
import NavStore from '../../components/navigation/NavStore'

import { setQRConfig, setQRValue } from '../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../services/i18n'

import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { BlocksoftTransferUtils } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'

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
import api from '../../services/Api/Api'
import {
    getAccountFioName,
    getPubAddress,
    isFioAddressRegistered,
    isFioAddressValid,
    resolveChainCode
} from '../../../crypto/blockchains/fio/FioUtils'

import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'
import PartBalanceButton from './elements/partBalanceButton'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import CheckData from './elements/CheckData'

import SendBasicScreenScreen from './SendBasicScreen'
import SendTmpConstants from './elements/SendTmpConstants'

import UtilsService from '../../services/UI/PrettyNumber/UtilsService'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

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
    type: 'AMOUNT',
    additional: 'NUMBER',
    mark: 'ETH'
}

let IS_CALLED_BACK = false
let BASIC_INPUT_TYPE = 'CRYPTO'

class SendScreen extends SendBasicScreenScreen {

    _screenName = 'SEND'

    constructor(props) {
        super(props)
        this.state = {
            init: false,
            account: {},
            cryptoCurrency: {
                currencyCode : 'DOGE'
            },
            wallet: {},

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
            fioRequestDetails: {},
            isFioPayment: false,

            copyAddress: false,
            countedFees: false,
            selectedFee: false,

            balancePart: 0,
            headerHeight: 0,
            destinationAddress: null,

            loadFee: false
        }
        this.addressInput = React.createRef()
        this.memoInput = React.createRef()
        this.valueInput = React.createRef()
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {

        // @yura does it needed (change of type to usd)?
        AsyncStorage.getItem('sendInputType').then(res => {
            if (res !== null) {
                BASIC_INPUT_TYPE = res
                this.setState({
                    inputType: res
                })
            }
        })

        // @yura could it be in DidMount?
        styles = Theme.getStyles().sendScreenStyles
    }

    componentDidMount() {

        // when usual open (moved from unsafe)
        this.init()

        // when back by history
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.init()
        })


        const fioRequest = this.props.navigation.getParam('fioRequestDetails')
        if (fioRequest) {
            if (fioRequest.content?.token_code === 'FIO') {
                this.addressInput.handleInput(fioRequest.payee_fio_address)
            } else {
                this.addressInput.handleInput(fioRequest.content?.payee_public_address)
            }
            // this.memoInput.handleInput(fioRequest.content?.memo)
            this.valueInput.handleInput(fioRequest.content?.amount)

            this.setState({
                isFioPayment: true,
                fioRequestDetails: fioRequest
            })
        }
    }

    init = async () => {
        console.log('')
        console.log('')
        console.log('Send.SendScreen.init', JSON.stringify(SendTmpConstants))

        let countedFees = false
        let selectedFee = false


        if (SendTmpConstants.PRESET || SendTmpConstants.PRESET_FROM_RECEIPT) {
            countedFees = SendTmpConstants.COUNTED_FEES
            selectedFee = SendTmpConstants.SELECTED_FEE
        } else {
            if (typeof this.props.send.countedFees !== 'undefined' && this.props.send.countedFees && this.props.send.countedFees !== {}) {
                countedFees = this.props.send.countedFees
            }
            if (typeof this.props.send.selectedFee !== 'undefined' && this.props.send.selectedFee && this.props.send.selectedFee !== {}) {
                selectedFee = this.props.send.selectedFee
            }
        }
        SendTmpConstants.PRESET = false
        SendTmpConstants.PRESET_FROM_RECEIPT = false

        console.log('Send.SendScreen.init preresult', JSON.parse(JSON.stringify({countedFees, selectedFee})))
 

        if (Object.keys(this.props.send.data).length !== 0) {
            // console.log('INIT SEND DATA', this.props.send.data)
            console.log('Send.SendScreen.init with data', { send: this.props.send })
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
            // // console.log(inputType, type)

            const toState = {
                account,
                cryptoCurrency,
                description,
                destinationTag,
                useAllFunds,
                countedFees,
                selectedFee,
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

                if (typeof this.memoInput.handleInput !== 'undefined') {
                    if (typeof destinationTag === 'undefined') {
                        destinationTag = ''
                    }
                    this.memoInput.handleInput(destinationTag)
                }

                this.addressInput.handleInput(address)
                // this.commentInput.handleInput(comment)
                this.valueInput.handleInput(value)
                this.amountInputCallback(value === '' ? this.valueInput.getValue() : value)

                if (sendType === 'REPLACE_TRANSACTION') {
                    setTimeout(() => {
                        this.handleSendTransaction()
                    }, 500)

                }

                this.setState({
                    useAllFunds: false
                })

            })
        } else {
            console.log('Send.SendScreen.init without data', { send: this.props.send })
            const { account, cryptoCurrency, wallet } = this.props

            setLoaderStatus(false)

            this.setState({
                account,
                wallet,
                cryptoCurrency,
                countedFees,
                selectedFee,
                init: true,
                description: strings('send.description')
            }, () => {
                if (countedFees || selectedFee) {
                    Log.log('Send.SendScreen.init amount input callback as countedFees or selectedFee in not null')
                    if (typeof selectedFee !== 'undefined' && typeof selectedFee.amountForTx !== 'undefined') {
                        const amount = BlocksoftPrettyNumbers.setCurrencyCode(cryptoCurrency.currencyCode).makePretty(selectedFee.amountForTx)
                        this.valueInput.handleInput(amount.toString(), false)
                        this.amountInputCallback(amount, false)
                    } else {
                        this.amountInputCallback()
                    }
                } else {
                    Log.log('Send.SendScreen.init amount input callback not needed')
                }
            })
        }
    }

    // @yura if there is no button - remove
    handleChangeEquivalentType = () => {
        // console.log('Send.SendScreen.handleChangeEquivalentType')
        const { currencySymbol } = this.state.cryptoCurrency
        const { basicCurrencySymbol } = this.state.account

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
            amountInputMark: this.state.inputType === 'FIAT' ? `~ ${basicCurrencySymbol} ${amountEquivalent}` : `~ ${amountEquivalent} ${currencySymbol}`,
            amountEquivalent,
            inputType
        })
    }

    handleTransferAll = async () => {
        // console.log('Send.SendScreen.handleTransferAll')
        Keyboard.dismiss()

        setLoaderStatus(true)

        const {
            walletHash,
            walletUseUnconfirmed,
            walletAllowReplaceByFee,
            walletUseLegacy,
            walletIsHd
        } = this.props.wallet

        const { address, derivationPath, currencyCode, balance, unconfirmed, accountJson } = this.state.account


        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            // console.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} data ${balance} + ${unconfirmed}`)

            let addressToForTransferAll
            const addressValidate = await this.addressInput.handleValidate()
            if (addressValidate.status === 'success') {
                addressToForTransferAll = addressValidate.value
            } else {
                addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })
            }

            // console.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} addressToForTransferAll ${addressToForTransferAll}`)

            const countedFeesData = {
                currencyCode,
                walletHash,
                derivationPath,
                addressFrom: address,
                addressTo: addressToForTransferAll,

                amount: balance,
                unconfirmed: walletUseUnconfirmed === 1 ? unconfirmed : 0,

                isTransferAll: true,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                useLegacy: walletUseLegacy,
                isHd: walletIsHd,

                accountJson
            }
            const transferAllCount = await BlocksoftTransfer.getTransferAllBalance(countedFeesData)
            transferAllCount.feesCountedForData = countedFeesData
            const selectedFee = transferAllCount.fees[transferAllCount.selectedFeeIndex]
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferAllCount.selectedTransferAllBalance)

            // console.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} transferAllCount result ${amount}`, JSON.parse(JSON.stringify(transferAllCount)) )

            this.setState({
                inputType: 'CRYPTO',
                useAllFunds: true,
                countedFees: transferAllCount,
                selectedFee
            })

            SendTmpConstants.SELECTED_FEE = selectedFee
            SendTmpConstants.COUNTED_FEES = countedFees

            try {
                if (
                    typeof this.valueInput !== 'undefined' && this.valueInput
                    && typeof this.valueInput.handleInput !== 'undefined' && this.valueInput.handleInput
                    && typeof amount !== 'undefined' && amount !== null
                ) {
                    this.valueInput.handleInput(UtilsService.cutNumber(amount, 7).toString(), false)
                    this.amountInputCallback(UtilsService.cutNumber(amount, 7).toString(), false)
                }
            } catch (e) {
                e.message += ' while this.valueInput.handleInput amount ' + amount
                throw e
            }

            setLoaderStatus(false)
            // console.log('Send.SendScreen.handleTransferAll currencyBalanceAmount: ', amount, 'currencyBalanceAmountRaw: ', transferAllCount.selectedTransferAllBalance)
            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferAllCount.selectedTransferAllBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                // console.log('Send.SendScreen.handleTransferAll', e)
            }
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
            this.handleSendTransaction(false, true, true)
        })
    }

    handleSendTransaction = async (forceSendAll = false, fromModal = false, forceSendAmount = false) => {

        if (forceSendAll) {
            await this.handleTransferAll()
        }

        //console.log('Send.SendScreen.handleSendTransaction started ' + JSON.stringify({forceSendAmount,forceSendAll,fromModal}))

        const {
            account,
            cryptoCurrency,
            toTransactionJSON,
            useAllFunds,
            fioRequestDetails,
            isFioPayment,
            amountEquivalent,
            inputType,
            countedFees,
            selectedFee
        } = this.state

        // console.log('Send.SendScreen.handleSendTransaction state', JSON.parse(JSON.stringify({countedFees,selectedFee})))

        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const destinationTagValidation = typeof this.memoInput.handleInput !== 'undefined' ? await this.memoInput.handleValidate() : {
            status: 'success',
            value: false
        }

        const wallet = this.props.wallet

        const extend = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)

        if (addressValidation.status !== 'success') {
            // console.log('Send.SendScreen.handleSendTransaction invalid address ' + JSON.stringify(addressValidation))
            return
        }
        if (!forceSendAmount && valueValidation.status !== 'success') {
            // console.log('Send.SendScreen.handleSendTransaction invalid value ' + JSON.stringify(valueValidation))
            return
        }
        if (!forceSendAmount && valueValidation.value === 0) {
            // console.log('Send.SendScreen.handleSendTransaction value is 0 ' + JSON.stringify(valueValidation))
            return
        }
        if (destinationTagValidation.status !== 'success') {
            // console.log('Send.SendScreen.handleSendTransaction invalid destination ' + JSON.stringify(destinationTagValidation))
            return
        }

        Keyboard.dismiss()

        const enoughFunds = {
            isAvailable: true,
            messages: []
        }

        if (!forceSendAmount && typeof extend.delegatedTransfer === 'undefined' && typeof extend.feesCurrencyCode !== 'undefined' && typeof extend.skipParentBalanceCheck === 'undefined') {
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
                    // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
                    if (config.debug.appErrors) {
                        // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
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
                    // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                    if (config.debug.appErrors) {
                        // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                    }
                } else {
                    // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance is ok ' + parentBalance, parentCurrency)
                }
            } else {
                // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentCurrency not found ' + parentCurrency, parentCurrency)
            }


            if (enoughFunds.messages.length) {
                this.setState({ enoughFunds })
                return
            }
        }

        setLoaderStatus(true)

        const amount = this.state.inputType === 'FIAT' ? this.state.amountEquivalent : valueValidation.value
        const memo = destinationTagValidation.value.toString()

        let fioPaymentData
        let recipientAddress = addressValidation.value

        try {
            if (this.isFioAddress(recipientAddress)) {
                // console.log('Send.SendScreen.handleSendTransaction isFioAddress checked ' + recipientAddress)
                if (await isFioAddressRegistered(recipientAddress)) {
                    // console.log('Send.SendScreen.handleSendTransaction isFioAddressRegistered checked ' + recipientAddress)
                    const chainCode = resolveChainCode(cryptoCurrency.currencyCode, cryptoCurrency.currencySymbol)
                    const publicFioAddress = await getPubAddress(addressValidation.value, chainCode, cryptoCurrency.currencySymbol)
                    // console.log('Send.SendScreen.handleSendTransaction public for ' + recipientAddress + ' ' + chainCode + ' =>' + publicFioAddress)
                    if (!publicFioAddress || publicFioAddress === '0') {
                        const msg = strings('send.publicFioAddressNotFound', { symbol: cryptoCurrency.currencyCode })
                        // console.log('Send.SendScreen.handleSendTransaction ' + msg)
                        enoughFunds.isAvailable = false
                        enoughFunds.messages.push(msg)
                        setLoaderStatus(false)
                        this.setState({ enoughFunds })
                        return
                    }
                    recipientAddress = publicFioAddress
                    if (fioRequestDetails && fioRequestDetails.fio_request_id) {
                        fioPaymentData = fioRequestDetails
                    } else {
                        fioPaymentData = {
                            payer_fio_address: await getAccountFioName(),
                            payee_fio_address: addressValidation.value,
                            memo
                        }
                    }
                } else {
                    // console.log('Send.SendScreen.handleSendTransaction isFioAddressRegistered no result ' + recipientAddress)
                    const msg = strings('send.publicFioAddressNotFound', { symbol: cryptoCurrency.currencyCode })
                    // console.log('Send.SendScreen.handleSendTransaction ' + msg)
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(msg)
                    setLoaderStatus(false)
                    this.setState({ enoughFunds })
                    return
                }
            }
        } catch (e) {
            // console.log('Send.SendScreen.handleSendTransaction isFioAddress error ' + recipientAddress + ' => ' + e.message)
        }

        try {

            const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(cryptoCurrency.currencyCode).makeUnPretty(amount)
            if (typeof amountRaw === 'undefined') {
                Log.err('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' not ok amountRaw ', {
                    'eq': this.state.amountEquivalent,
                    'vaL': valueValidation.value,
                    amount,
                    amountRaw
                })
            }
            const balanceRaw = account.balanceRaw

            if (!forceSendAmount) {
                let diff = BlocksoftUtils.diff(amountRaw, balanceRaw)
                if (cryptoCurrency.currencyCode === 'XRP') {
                    diff = BlocksoftUtils.add(diff, 20)
                }
                if (diff > 0) {
                    // console.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' not ok diff ' + diff, {amountRaw,balanceRaw})
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(strings('send.notEnough'))
                }

                if (enoughFunds.messages.length) {
                    this.setState({ enoughFunds })
                    setLoaderStatus(false)
                    return
                }
            }

            try {
                if (fromModal === false && BlocksoftTransfer.checkSendAllModal({ currencyCode: cryptoCurrency.currencyCode })) {

                    const limitPercent = 0.95

                    let percentCheck
                    let diffCheck

                    if (inputType === 'FIAT') {
                        percentCheck = BlocksoftUtils.diff(BlocksoftUtils.div(amountEquivalent, account.balancePretty), limitPercent)
                    } else {
                        percentCheck = BlocksoftUtils.diff(BlocksoftUtils.div(valueValidation.value, account.balancePretty), limitPercent)
                        diffCheck = BlocksoftUtils.diff(account.balancePretty, valueValidation.value)
                    }

                    // console.log('input', {amountCrypto: valueValidation.value, percentCheck, diffCheck, useAll: useAllFunds})

                    // console.log('Send.SendScreen.handleSendTransaction input', {amountCrypto: valueValidation.value,percentCheck, diffCheck, useAll: useAllFunds})

                    if (useAllFunds === false && percentCheck * 1 > 0) {
                        showModal({
                            type: 'YES_NO_MODAL',
                            icon: 'WARNING',
                            title: strings('modal.titles.attention'),


                            description: strings('modal.infoSendAllModal.description', { coin: cryptoCurrency.currencyName }),
                            reverse: true,
                            noCallback: () => {
                                this.handleSendTransaction(true, true)
                            }
                        }, () => {
                            this.handleSendTransaction(false, true)
                        })
                        return
                    }
                }
            } catch (e) {
                // console.log('Send.SendScreen.handleSendTransaction infoSendAllModal error ' + e.message)
            }


            this.setState({
                enoughFunds: {
                    isAvailable: true,
                    messages: []
                },
                balance: cryptoCurrency.currencyBalanceAmount
            })

            setTimeout(() => {

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
                    type: this.props.send.data.type || 'DEFAULT_SEND',
                    currencyCode: cryptoCurrency.currencyCode,
                    countedFees,
                    selectedFee
                }
                // console.log('Send.SendScreen.handleSendTransaction amount ' + amount + ' recipientAddress ' + recipientAddress, JSON.parse(JSON.stringify(data)))

                NavStore.goNext('ReceiptScreen', {
                    ReceiptScreen: data,
                    ...(isFioPayment && { fioRequestDetails: fioPaymentData })
                })

            }, 500)
        } catch (e) {

            setLoaderStatus(false)
            Log.err('Send.SendScreen.handleSendTransaction error', e)
        }

        // console.log('Send.SendScreen.handleSendTransaction finished')

    }

    amountInputCallback = async (value, changeUseAllFunds) => {
        const { countedFees, selectedFee, useAllFunds } = this.state
        // console.log('Send.SendScreen.amountInputCallback state', { countedFees, selectedFee, useAllFunds })

        let addressToForTransferAll = false
        if (value === 'current') {
            const addressValidate = await this.addressInput.handleValidate()
            if (addressValidate.status === 'success') {
                addressToForTransferAll = addressValidate.value
            } else {
                return false
            }
            const valueValidate = await this.valueInput.handleValidate()
            if (typeof valueValidate.value !== 'undefined') {
                value = valueValidate.value
            }
        }

        const { currencySymbol, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencySymbol, basicCurrencyRate, address } = this.state.account

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }

        let amount = 0
        let symbol = currencySymbol

        this.setState({
            loadFee: true
        })

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
            // console.log('Send.SendScreen equivalent error ' + e.message + ' ' + JSON.stringify({ value, currencyCode, basicCurrencyRate }))
        }

        if (amount > 0) {

            if (!this.state.useAllFunds) {

                if (!addressToForTransferAll) {
                    const addressValidate = await this.addressInput.handleValidate()
                    if (addressValidate.status === 'success') {
                        addressToForTransferAll = addressValidate.value
                    } else {
                        addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })
                    }
                }

                const {countedFees, selectedFee} = await this.recountFees({
                    amountRaw: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(value),
                    addressTo: addressToForTransferAll
                })

                this.setState({
                    countedFees,
                    selectedFee
                })

                SendTmpConstants.COUNTED_FEES = countedFees
                SendTmpConstants.SELECTED_FEE = selectedFee
            }

            amount = UtilsService.cutNumber(amount, this.state.inputType === 'CRYPTO' ? 7 : 2)

            this.setState({
                amountEquivalent: amount,
                amountInputMark: `${amount} ${symbol}`,
                balancePart: 0,
                loadFee: false
            })
        } else {
            this.setState({
                loadFee: false
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
        }, 100)
    }

    renderEnoughFundsError = () => {
        const { enoughFunds } = this.state

        // console.log('Send.SendScreen renderEnoughFundsError', enoughFunds)
        if (!enoughFunds.isAvailable) {
            return (
                <View style={{ marginTop: 14 }}>
                    {
                        enoughFunds.messages.map((item, index) => {
                            return (
                                <View key={index} style={styles.texts}>
                                    <View style={styles.texts__icon}>
                                        <Icon
                                            name="information-outline"
                                            size={22}
                                            color="#864DD9"
                                        />
                                    </View>
                                    <View>
                                        <TouchableOpacity style={styles.texts__item} delayLongPress={500}
                                            onLongPress={() => this.handleOkForce()}>
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

        const amountPretty = BlocksoftTransferUtils.getBalanceForTransfer({
            walletUseUnconfirmed : walletUseUnconfirmed === 1,
            balancePretty,
            unconfirmedPretty,
            currencyCode
        }
        )

        const amountPrep = BlocksoftPrettyNumbers.makeCut(amountPretty).cutted

        let sumPrep = amountPrep + ' ' + currencySymbol
        if (amountPretty && currencyCode && basicCurrencyRate) {
            try {
                const basicCurrencySymbol = this.state.account.basicCurrencySymbol || '$'
                const basicAmount = RateEquivalent.mul({ value: amountPretty, currencyCode, basicCurrencyRate })
                const basicAmountPrep = BlocksoftPrettyNumbers.makeCut(basicAmount, 2).cutted
                if (this.state.inputType === 'CRYPTO') {
                    sumPrep += ' / ~' + basicCurrencySymbol + ' ' + basicAmountPrep
                } else {
                    sumPrep = '~' + basicCurrencySymbol + ' ' + basicAmountPrep + ' / ' + sumPrep
                }
            } catch (e) {
                // console.log('Send.SendScreen renderAccountDetail error ' + e.message)
            }
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                    <CurrencyIcon currencyCode={currencyCode}
                        containerStyle={{}} />
                </View>
                <View style={styles.accountDetail__content}>
                    <View style={{}}>
                        <Text style={styles.accountDetail__title} numberOfLines={1}>
                            {currencyName}
                        </Text>
                        <View style={{ alignItems: 'flex-start' }}>
                            <LetterSpacing text={sumPrep} textStyle={styles.accountDetail__text} letterSpacing={1} />
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    handlerPartBalance = (inputType, part) => {
        if (inputType === 'FIAT') {
            let value = this.state.account.basicCurrencyBalance * part
            value = UtilsService.cutNumber(value, 2)
            this.valueInput.state.value = value.toString()
            this.amountInputCallback(value, true)
        } else {
            let value = this.state.account.balancePretty * part
            value = UtilsService.cutNumber(value, 7)
            this.valueInput.state.value = value.toString()
            this.amountInputCallback(value, true)
        }
    }

    disabled = () => {
        if (typeof this.valueInput.state === 'undefined' || this.valueInput.state.value === '') {
            return true
        }
        // console.log(this.addressInput.state)
        // if (typeof this.addressInput.state === 'undefined' || this.addressInput.state.value === '') {
        //     return true
        // }

        const value = this.valueInput.state.value
        // const address = this.addressInput.state.value
        if (value) {
            return false
        } else {
            return true
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        firebase.analytics().setCurrentScreen('Send.SendScreen')

        const route = NavStore.getCurrentRoute()
        if (route.routeName === 'Send.SendScreen') {
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
            copyAddress,
            isFioPayment,
            headerHeight,
            loadFee
        } = this.state

        const {
            currencySymbol,
            currencyCode,
            extendsProcessor,
            addressUiChecker,
            decimals,
            network
        } = this.state.cryptoCurrency

        const { colors, GRID_SIZE, isLight } = this.context

        const basicCurrencyCode = this.state.account.basicCurrencyCode || 'USD'

        // actually should be dict[extendsProcessor].addressUIChecker check but not to take all store will keep simplier
        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }

        const { type } = this.props.send.data

        const prev = NavStore.getPrevRoute().routeName

        // console.log('')
        // console.log('prev ', prev)
        // console.log('')

        const notEquivalentValue = this.state.amountInputMark ? this.state.amountInputMark : '0.00'

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType="close"
                    rightAction={this.closeAction}
                    title={strings('send.title')}
                    ExtraView={this.renderAccountDetail}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps={'handled'}
                        showsVerticalScrollIndicator={false}
                        // contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'space-between',
                            padding: GRID_SIZE,
                            paddingBottom: GRID_SIZE * 2,
                            minHeight: focused ? 500 : WINDOW_HEIGHT/2
                        }}
                        style={{ marginTop: headerHeight }}
                    >
                        <View>
                            <AmountInput
                                ref={component => this.valueInput = component}
                                id={amountInput.id}
                                additional={amountInput.additional}
                                // onFocus={() => this.onFocus()}
                                name={strings('send.value')}
                                type={amountInput.type}
                                decimals={decimals < 10 ? decimals : 10}
                                keyboardType={'numeric'}
                                enoughFunds={!this.state.enoughFunds.isAvailable}
                                noEdit={prev === 'TradeScreenStack' || prev === 'ExchangeScreenStack' || prev === 'TradeV3ScreenStack' ? true : 0}
                                callback={(value) => this.amountInputCallback(value, true)}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                <View style={style.line} />
                                <TouchableOpacity style={{ position: 'absolute', right: 22, marginTop: -2 }}
                                    onPress={this.handleChangeEquivalentType}>
                                    <Text>{'swap'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
                                <LetterSpacing text={loadFee ? 'Loading...' : notEquivalentValue} textStyle={style.notEquivalentValue}
                                    letterSpacing={1.5} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <PartBalanceButton
                                    action={() => {
                                        this.handlerPartBalance(this.state.inputType, 0.25)

                                        this.setState({
                                            balancePart: 0.25,
                                            useAllFunds: false
                                        })
                                    }}
                                    text={'25%'}
                                    inverse={this.state.balancePart === 0.25 ? true : false}
                                />
                                <PartBalanceButton
                                    action={() => {
                                        this.handlerPartBalance(this.state.inputType, 0.5)
                                        this.setState({
                                            balancePart: 0.5,
                                            useAllFunds: false
                                        })
                                    }}
                                    text={'50%'}
                                    inverse={this.state.balancePart === 0.5 ? true : false}
                                />
                                <PartBalanceButton
                                    action={() => {
                                        this.handlerPartBalance(this.state.inputType, 0.75)
                                        this.setState({
                                            balancePart: 0.75,
                                            useAllFunds: false
                                        })
                                    }}
                                    text={'75%'}
                                    inverse={this.state.balancePart === 0.75 ? true : false}
                                />
                                <PartBalanceButton
                                    action={() => {
                                        this.setState({
                                            useAllFunds: !this.state.useAllFunds,
                                            balancePart: 0
                                        })
                                        this.handleTransferAll()
                                    }}
                                    text={'100%'}
                                    inverse={this.state.useAllFunds ? true : false}
                                />
                            </View>

                            {this.renderEnoughFundsError()}

                            <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2 }}>
                                <AddressInput
                                    ref={component => this.addressInput = component}
                                    id={addressInput.id}
                                    onFocus={() => this.onFocus()}
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
                                    callback={(value) => {
                                        this.amountInputCallback('current', false)
                                    }}
                                    noEdit={prev === 'TradeScreenStack' || prev === 'ExchangeScreenStack' || prev === 'TradeV3ScreenStack' ? true : 0}
                                />
                            </View>
                            {
                                currencyCode === 'XRP' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            disabled={disabled}
                                            name={strings('send.xrp_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'numeric'}
                                            decimals={0}
                                            additional={'NUMBER'}
                                            info={true}
                                            tabInfo={() => this.modalInfo()}
                                        />
                                    </View> : null
                            }

                            {
                                currencyCode === 'XMR' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            disabled={disabled}
                                            name={strings('send.xmr_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'default'}
                                            info={true}
                                            tabInfo={() => this.modalInfo(currencyCode)}
                                        />
                                    </View> : null
                            }


                            {
                                isFioPayment ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            disabled={disabled}
                                            name={strings('send.fio_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'default'}
                                            info={true}
                                            tabInfo={() => this.modalInfo()}
                                        /></View> : null
                            }

                            {this.renderMinerFee(true)}

                        </View>
                        <TwoButtons
                            mainButton={{
                                disabled: this.disabled(),
                                onPress: () => this.handleSendTransaction(false),
                                title: strings('walletBackup.step0Screen.next')
                            }}
                            secondaryButton={{
                                disabled: !this.state.amountInputMark,
                                type: 'settings',
                                onPress: this.openAdvancedSettings
                            }}
                        />
                    </ScrollView>
                </KeyboardAwareView>
            </View>

        )
    }

}

SendScreen.contextType = ThemeContext

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

const style = {
    line: {
        backgroundColor: '#DADADA',
        height: 1,
        width: '75%',
        alignSelf: 'center',
        marginVertical: 6
    },
    notEquivalentValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        color: '#999999'
    },
    minerFee: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 17,
        color: '#5C5C5C'
    },
    fiatFee: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 12
    },
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    }
}
