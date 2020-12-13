/**
 * @version 0.30
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

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import Theme from '../../themes/Themes'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LetterSpacing from '../../components/elements/LetterSpacing'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import config from '../../config/config'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'

import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'
import PartBalanceButton from './elements/partBalanceButton'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import CheckData from './elements/CheckData'

import SendBasicScreenScreen from './SendBasicScreen'

import UtilsService from '../../services/UI/PrettyNumber/UtilsService'
import { SendTmpData } from '../../appstores/Stores/Send/SendTmpData'
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import Validator from '../../services/UI/Validator/Validator'

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
            account: {
                address: '',
                balance: '',
                basicCurrencySymbol: '',
                basicCurrencyRate: 0,
                balancePretty: 0,
                unconfirmedPretty: 0
            },
            cryptoCurrency: {
                currencyCode: 'DOGE'
            },
            wallet: {
                walletUseUnconfirmed: false
            },
            sendScreenData: {},

            // all other are more about ui
            contactName: false, // name of fio contact address
            contactAddress: false, // found address for contact

            useAllFunds: false,
            amountInputMark: '',
            amountEquivalent : '',
            focused: false,
            enoughFunds: {
                isAvailable: true,
                messages: []
            },
            inputType: 'CRYPTO',
            balancePart: 0,
            headerHeight: 0,
            loadFee: false
        }
        this.addressInput = React.createRef()
        this.memoInput = React.createRef()
        this.valueInput = React.createRef()
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
    }

    init = async () => {
        console.log('')
        console.log('')
        const sendScreenData = SendTmpData.getData()

        const { account, cryptoCurrency, wallet } = SendActions.findWalletPlus(sendScreenData.currencyCode)

        let selectedFee = false // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            if (typeof tmp.selectedFee !== 'undefined' && tmp.selectedFee) {
                selectedFee = tmp.selectedFee
            }
            sendScreenData.selectedFee = selectedFee
        }


        console.log('Send.SendScreen.init', JSON.parse(JSON.stringify(sendScreenData)))

        this.setState(
            {
                sendScreenData,
                account,
                cryptoCurrency,
                wallet,
                useAllFunds: sendScreenData.isTransferAll,
                init: true
            }, () => {

                if (typeof sendScreenData.addressTo !== 'undefined' && sendScreenData.addressTo) {
                    this.addressInput.handleInput(sendScreenData.addressTo, false)
                }

                if (typeof this.memoInput.handleInput !== 'undefined') {
                    if (typeof sendScreenData.memo !== 'undefined' && sendScreenData.memo && sendScreenData.memo !== '') {
                        this.memoInput.handleInput(sendScreenData.memo.toString(), false)
                    }
                }
                if (typeof sendScreenData.amountPretty !== 'undefined' && sendScreenData.amountPretty && sendScreenData.amountPretty !== '') {
                    try {
                        let value = ''
                        let amount = ''
                        if (this.state.inputType === 'FIAT') {
                            value = sendScreenData.amountPretty.toString()
                            const {currencyCode, basicCurrencyRate} = account
                            amount = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                            amount = UtilsService.cutNumber(amount, 2)
                            console.log('_SendScreen.setStateFromInit amount1 ', amount)
                            this.valueInput.handleInput(amount, false)
                        } else {
                            value = sendScreenData.amountPretty.toString()
                            amount = sendScreenData.amountPretty.toString()
                            console.log('_SendScreen.setStateFromInit amount2 ', amount)
                            this.valueInput.handleInput(amount, false)
                        }
                        const { amountEquivalent, amountInputMark} = this.amountEquivalent(value)
                        this.setState({
                            amountEquivalent: amountEquivalent,
                            amountInputMark: amountInputMark,
                            balancePart: 0,
                        })
                        this.recountFees(sendScreenData)

                    } catch (e) {

                    }
                }
            }
        )
    }

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
            console.log('_SendScreen.handleChangeEquivalentType amount1 ', toInput)
            this.valueInput.handleInput(toInput, false)
        } else {
            amountEquivalent = toEquivalent
            console.log('_SendScreen.handleChangeEquivalentType amount2 ', toInput)
            this.valueInput.handleInput(toInput, false)
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

        const { address, currencyCode, balance, unconfirmed } = this.state.account


        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            // console.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} data ${balance} + ${unconfirmed}`)

            const newSendScreenData = JSON.parse(JSON.stringify(this.state.sendScreenData))

            let addressToForTransferAll
            if (this.state.contactAddress) {
                addressToForTransferAll = this.state.contactAddress
            } else {
                const addressValidate = await this.addressInput.handleValidate()
                if (addressValidate.status === 'success') {
                    addressToForTransferAll = addressValidate.value
                } else {
                    addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({
                        currencyCode,
                        address
                    })
                }
            }
            if (typeof this.memoInput.handleValidate !== 'undefined') {
                const memoValidate = await this.memoInput.handleValidate()
                if (memoValidate.status === 'success') {
                    newSendScreenData.memo = memoValidate.value
                }
            }
            newSendScreenData.addressTo = addressToForTransferAll
            newSendScreenData.isTransferAll = true
            newSendScreenData.amountRaw = balance
            newSendScreenData.unconfirmedRaw = unconfirmed

            // console.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} addressToForTransferAll ${addressToForTransferAll}`)

            const { countedFees, selectedFee } = await this.recountFees(newSendScreenData)
            let amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(countedFees.selectedTransferAllBalance)
            newSendScreenData.amountPretty = amount
            newSendScreenData.inputValue = amount
            newSendScreenData.selectedFee = selectedFee

            // console.log(`Send.SendScreen.handleTransferAll`, JSON.parse(JSON.stringify(this.state.sendScreenData)), JSON.parse(JSON.stringify(newSendScreenData)))

            if (typeof amount !== 'undefined' && amount !== null) {
                amount = UtilsService.cutNumber(amount, 7).toString()
            } else {
                amount = 0
            }
            const { amountEquivalent, amountInputMark} = this.amountEquivalent(amount, 'CRYPTO')
            this.setState({
                inputType: 'CRYPTO',
                useAllFunds: true,
                amountEquivalent: amountEquivalent,
                amountInputMark: amountInputMark,
                sendScreenData : newSendScreenData
            })

            try {
                if (
                    typeof this.valueInput !== 'undefined' && this.valueInput
                    && typeof this.valueInput.handleInput !== 'undefined' && this.valueInput.handleInput
                    && typeof amount !== 'undefined' && amount !== null
                ) {
                    console.log('_SendScreen.handleTransferAll amount ', amount)
                    this.valueInput.handleInput(amount, false)
                }
            } catch (e) {
                e.message += ' while this.valueInput.handleInput amount ' + amount
                throw e
            }

            setLoaderStatus(false)
            // console.log('Send.SendScreen.handleTransferAll currencyBalanceAmount: ' + amount + ' currencyBalanceAmountRaw: ' + countedFees.selectedTransferAllBalance)

        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Send.SendScreen.handleTransferAll', e)
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

        console.log('Send.SendScreen.handleSendTransaction started ' + JSON.stringify({forceSendAmount,forceSendAll,fromModal}))

        const {
            wallet,
            account,
            cryptoCurrency,
            useAllFunds,
            amountEquivalent,
            inputType,
            sendScreenData
        } = this.state

        // console.log('Send.SendScreen.handleSendTransaction state', JSON.parse(JSON.stringify({countedFees,selectedFee})))

        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const destinationTagValidation = typeof this.memoInput.handleInput !== 'undefined' ? await this.memoInput.handleValidate() : {
            status: 'success',
            value: false
        }

        const extend = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)

        if (addressValidation.status !== 'success') {
            console.log('Send.SendScreen.handleSendTransaction invalid address ' + JSON.stringify(addressValidation))
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

        let contactName = this.state.contactName
        let contactAddress = this.state.contactAddress

        try {
            const tmp = addressValidation.value
            if (tmp && (tmp !== contactName || !contactAddress)) {
                let toContactAddress = false
                try {
                    toContactAddress = await SendActions.getContactAddress({ addressName: tmp, currencyCode : cryptoCurrency.currencyCode })
                    contactName = tmp
                    contactAddress = toContactAddress
                } catch (e) {
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(e.message)
                    setLoaderStatus(false)
                    this.setState({ enoughFunds })
                    return
                }
            }
            const amount = this.state.inputType === 'FIAT' ? this.state.amountEquivalent : valueValidation.value
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

                const newSendScreenData = sendScreenData
                newSendScreenData.gotoReceipt = true
                newSendScreenData.gotoWithCleanData = false
                newSendScreenData.amount = amount
                newSendScreenData.amountRaw = amountRaw
                newSendScreenData.contactName = contactName
                newSendScreenData.contactAddress = contactAddress
                // memo and destination will be autocomplited
                SendActions.startSend(newSendScreenData)

            }, 500)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.SendScreen.handleSendTransaction error', e)
            }
            setLoaderStatus(false)
            Log.err('Send.SendScreen.handleSendTransaction error', e)
        }

        // console.log('Send.SendScreen.handleSendTransaction finished')

    }

    amountEquivalent = (value, inputType = false) => {
        const { currencySymbol, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencySymbol, basicCurrencyRate } = this.state.account
        if (inputType === false) {
            inputType = this.state.inputType
        }
        let amountEquivalent = 0
        let symbolEquivalent = currencySymbol
        let valueCrypto = 0
        try {
            if (!value || value === 0) {
                amountEquivalent = 0
                symbolEquivalent = ''
            } else if (inputType === 'CRYPTO') {
                valueCrypto = value
                amountEquivalent = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                amountEquivalent = UtilsService.cutNumber(amountEquivalent, 2)
                symbolEquivalent = basicCurrencySymbol
            } else {
                amountEquivalent = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
                amountEquivalent = UtilsService.cutNumber(amountEquivalent, 7)
                if (amountEquivalent === '0') {
                    amountEquivalent = UtilsService.cutNumber(amountEquivalent, 10)
                }
                valueCrypto = amountEquivalent
            }
        } catch (e) {
            // console.log('Send.SendScreen equivalent error ' + e.message + ' ' + JSON.stringify({ value, currencyCode, basicCurrencyRate }))
        }
        return {
            amountEquivalent,
            amountInputMark: `${amountEquivalent} ${symbolEquivalent}`,
            valueCrypto
        }
    }

    amountInputCallback = async (value, changeUseAllFunds, addressTo = false, memo = false, addressValidateType = '') => {
        try {
            const { useAllFunds } = this.state
            // console.log('Send.SendScreen.amountInputCallback state', { value, changeUseAllFunds, addressTo, memo })

            const { currencySymbol, currencyCode } = this.state.cryptoCurrency
            const { basicCurrencySymbol, basicCurrencyRate, address } = this.state.account

            if (value === false) {
                const valueValidate = await this.valueInput.handleValidate()
                if (typeof valueValidate.value !== 'undefined') {
                    value = valueValidate.value
                }
            }

            if (addressTo === false) {
                if (this.state.contactAddress) {
                    addressTo = this.state.contactAddress
                    this.addressInput.handleInput(this.state.contactName.toString(), false)
                } else {
                    const addressValidate = await this.addressInput.handleValidate()
                    if (addressValidate.status === 'success') {
                        addressTo = addressValidate.value
                    } else {
                        addressTo = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })
                    }
                }
            } else {
                let toContactAddress = false
                try {
                    toContactAddress = await SendActions.getContactAddress({ addressName: addressTo, currencyCode })
                } catch (e) {
                    // do nothing - will be in send to receipt action rechecked the same
                }
                if (toContactAddress) {
                    this.setState({
                        contactName : addressTo,
                        contactAddress : toContactAddress
                    })
                    addressTo = toContactAddress
                } else {
                    this.setState({
                        contactName : false,
                        contactAddress : false
                    })
                    const errors = await Validator.userDataValidation({ type: addressValidateType, value: addressTo })
                    if (!errors || typeof errors.success === 'undefined') {
                        return false
                    }
                }

            }

            if (memo === false && typeof this.memoInput.handleValidate !== 'undefined') {
                const memoValidate = await this.memoInput.handleValidate()
                if (memoValidate.status === 'success') {
                    memo = memoValidate.value
                }
            }

            let isTransferAll = useAllFunds
            if (useAllFunds && changeUseAllFunds) {
                isTransferAll = false
                this.setState({
                    useAllFunds: false,
                    loadFee: true
                })
            } else {
                this.setState({
                    loadFee: true
                })
            }

            const { amountEquivalent, amountInputMark, valueCrypto } = this.amountEquivalent(value)

            const valueCryptoRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(valueCrypto)
            if (value.toString() === '0' || valueCryptoRaw === "" || valueCryptoRaw === "000000000" || valueCryptoRaw === "00000000") {
                this.setState({
                    loadFee: false,
                    amountEquivalent: amountEquivalent,
                    amountInputMark: amountInputMark,
                    balancePart: 0,
                })
                IS_CALLED_BACK = false
                return true
            }


            const newSendScreenData = JSON.parse(JSON.stringify(this.state.sendScreenData))
            if (
                (valueCrypto && newSendScreenData.inputValue !== valueCrypto) ||
                (newSendScreenData.isTransferAll !== isTransferAll) ||
                (addressTo && newSendScreenData.addressTo !== addressTo) ||
                (memo && newSendScreenData.memo !== memo)
            ) {
                newSendScreenData.isTransferAll = isTransferAll
                if (memo) {
                    newSendScreenData.memo = memo
                }
                if (addressTo) {
                    newSendScreenData.addressTo = addressTo
                }

                newSendScreenData.inputValue = valueCrypto
                if (!newSendScreenData.isTransferAll) {
                    newSendScreenData.amountPretty = valueCrypto
                    newSendScreenData.amountRaw = valueCryptoRaw
                    newSendScreenData.unconfirmedRaw = 0
                }
                const {selectedFee} = await this.recountFees(newSendScreenData)
                newSendScreenData.selectedFee = selectedFee
                // console.log(`Send.SendScreen.amountInputCallback`, JSON.parse(JSON.stringify(this.state.sendScreenData)), JSON.parse(JSON.stringify(newSendScreenData)))

            } else {
                // console.log('Send.SendScreen.amountInputCallback not updated as not changed')
            }


            this.setState({
                amountEquivalent: amountEquivalent,
                amountInputMark: amountInputMark,
                balancePart: 0,
                loadFee: false,
                sendScreenData: newSendScreenData
            })

            IS_CALLED_BACK = false
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.SendScreen.amountInputCallback error ' + e.message, e)
            }
            throw e
        }
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
                                            name='information-outline'
                                            size={22}
                                            color='#864DD9'
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
                walletUseUnconfirmed: walletUseUnconfirmed === 1,
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
                console.log('Send.SendScreen renderAccountDetail error ' + e.message)
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
            focused,
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

        // actually should be dict[extendsProcessor].addressUIChecker check but not to take all store will keep simplier
        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }

        const notEquivalentValue = this.state.amountInputMark ? this.state.amountInputMark : '0.00'

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType='close'
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
                            minHeight: focused ? 500 : WINDOW_HEIGHT / 2
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
                                    paste={true}
                                    fio={false} // @todo later
                                    copy={false}
                                    qr={true}
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
                                    validPlaceholder={true}
                                    callback={(value) => {
                                        this.amountInputCallback(false, false, value, false, extendedAddressUiChecker.toUpperCase() + '_ADDRESS')
                                    }}
                                />
                            </View>

                            {
                                currencyCode === 'XRP' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.xrp_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'numeric'}
                                            decimals={0}
                                            additional={'NUMBER'}
                                            info={true}
                                            tabInfo={() => this.modalInfo()}
                                            callback={(value) => {
                                                this.amountInputCallback(false, false, false, value)
                                            }}
                                        />
                                    </View> : null
                            }

                            {
                                currencyCode === 'XMR' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.xmr_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            keyboardType={'default'}
                                            info={true}
                                            tabInfo={() => this.modalInfo(currencyCode)}
                                            callback={(value) => {
                                                this.amountInputCallback(false, false, false, value)
                                            }}
                                        />
                                    </View> : null
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
        }
    }
}
