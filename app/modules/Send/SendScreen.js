/**
 * @version 0.30
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity, Dimensions, Platform, TextInput } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

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
import CustomIcon from '../../components/elements/CustomIcon'

import Theme, { HIT_SLOP } from '../../themes/Themes'
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

import SendBasicScreenScreen from './SendBasicScreen'

import UtilsService from '../../services/UI/PrettyNumber/UtilsService'
import { SendTmpData } from '../../appstores/Stores/Send/SendTmpData'
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import Validator from '../../services/UI/Validator/Validator'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import Resolution from '@unstoppabledomains/resolution';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

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

const USDT_LIMIT = 600

class SendScreen extends SendBasicScreenScreen {

    _screenName = 'SEND'
    domainResolution

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
            loadFee: false,

            addressError: false,

            isBalanceVisible: false,
            originalVisibility: false,

            domainResolving: false,
            domainName: '',
            domainAddress: '',
            domainResolveFailed: false,
        }
        this.addressInput = React.createRef()
        this.memoInput = React.createRef()
        this.valueInput = React.createRef()
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        this.getBalanceVisibility()
        AsyncStorage.getItem('sendInputType').then(res => {
            if (res !== null) {
                this.setState({
                    inputType: res,
                    amountInputMark: ''
                })
            }
        })
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
        // Log.log('')
        // Log.log('')
        const sendScreenData = SendTmpData.getData()
        const { account, cryptoCurrency, wallet } = SendActions.findWalletPlus(sendScreenData.currencyCode)
        let selectedFee = false // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee : false
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            if (typeof tmp.selectedFee !== 'undefined' && tmp.selectedFee) {
                selectedFee = tmp.selectedFee
            }
            sendScreenData.selectedFee = selectedFee
            if (config.debug.sendLogs) {
                console.log('SendScreen.init selectedFee', JSON.parse(JSON.stringify({tmp, selectedFee, sendScreenData})))
                console.log('Send.ReceiptScreen.render sendScreenStore', JSON.parse(JSON.stringify(this.props.sendScreenStore)))
            }
        }

        const { uiInputAddress, uiInputType, balancePart } = this.props.sendScreenStore.ui
        const inputType = uiInputType !== 'any' && typeof uiInputType !== 'undefined' && uiInputType ? uiInputType : this.state.inputType

        this.setState(
            {
                sendScreenData,
                account,
                cryptoCurrency,
                wallet,
                useAllFunds: sendScreenData.isTransferAll,
                init: true,
                inputType,
                balancePart,
                amountInputMark:
                    this.state.amountInputMark
                        ? this.state.amountInputMark :
                        (inputType === 'FIAT' ? `0.00 ${cryptoCurrency.currencySymbol}` : `0.00 ${account.basicCurrencyCode}`)
            }, () => {

                if (typeof sendScreenData.contactName !== 'undefined' && sendScreenData.contactName) {
                    this.addressInput.handleInput(sendScreenData.contactName, false)
                } else if (typeof sendScreenData.addressTo !== 'undefined' && sendScreenData.addressTo && typeof uiInputAddress !== 'undefined' && uiInputAddress) {
                    this.addressInput.handleInput(sendScreenData.addressTo, false)
                }

                if (typeof this.memoInput.handleInput !== 'undefined') {
                    if (typeof sendScreenData.memo !== 'undefined' && sendScreenData.memo && sendScreenData.memo !== '') {
                        this.memoInput.handleInput(sendScreenData.memo.toString(), false)
                    }
                }
                let needRecount = true
                // back from advanced no need to recount and put amount if any applied
                if (typeof sendScreenData.selectedFee !== 'undefined' && typeof sendScreenData.selectedFee.amountForTx !== 'undefined') {
                    Log.log('SendScreenData.selectedFee.amountForTx', sendScreenData.selectedFee.amountForTx)
                    sendScreenData.amountPretty = BlocksoftPrettyNumbers.setCurrencyCode(account.currencyCode).makePretty(sendScreenData.selectedFee.amountForTx)
                    needRecount = false
                }
                if (typeof sendScreenData.amountPretty !== 'undefined' && sendScreenData.amountPretty && sendScreenData.amountPretty !== '' && sendScreenData.amountPretty !== '0') {
                    try {
                        let value = ''
                        let amount = ''
                        const { currencyCode, basicCurrencyRate } = account
                        if (inputType === 'FIAT') {
                            if (typeof sendScreenData.amountFiat !== 'undefined' && sendScreenData.amountFiat) {
                                amount = sendScreenData.amountFiat
                            } else {
                                value = sendScreenData.amountPretty.toString()
                                amount = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                                amount = UtilsService.cutNumber(amount, 2)
                            }
                            this.valueInput.handleInput(amount, false)
                        } else {
                            amount = sendScreenData.amountPretty.toString()
                            this.valueInput.handleInput(amount, false)
                        }
                        const { amountEquivalent, amountInputMark } = this.amountEquivalent(amount)

                        if (inputType === 'FIAT' && typeof sendScreenData.selectedFee !== 'undefined' && sendScreenData.selectedFee && typeof sendScreenData.selectedFee.amountForTx !== 'undefined') {
                            const tmpAmount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(sendScreenData.selectedFee.amountForTx).toString().trim()
                            const newAmountSubstr = amountEquivalent.toString().substring(0, tmpAmount.length).trim()
                            if (config.debug.sendLogs) {
                                console.log('Send.SendScreen.init change amount checked ', JSON.parse(JSON.stringify({
                                    amountEquivalent,
                                    newAmountSubstr,
                                    tmpAmount,
                                    isEqual: newAmountSubstr !== tmpAmount,
                                    isEqualTxt : newAmountSubstr + '!=' + tmpAmount
                                })))
                            }
                            if (tmpAmount !== newAmountSubstr) {
                                needRecount = true
                                sendScreenData.inputValue = amountEquivalent
                                sendScreenData.amount = amountEquivalent
                                sendScreenData.amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(amountEquivalent)
                            }
                        }

                        this.setState({
                            inputType,
                            amountEquivalent: amountEquivalent,
                            amountInputMark: amountInputMark,
                            // balancePart: 0
                        })

                        if (needRecount) {
                            this.recountFees(sendScreenData, 'Send.SendScreen.init recounting')
                        }

                    } catch (e) {
                        if (config.debug.appErrors) {
                            console.log('Send.SendScreen.init error ' + e.message, e)
                        }
                    }
                }
            }
        )
    }

    handleChangeEquivalentType = () => {
        // Log.log('Send.SendScreen.handleChangeEquivalentType')
        const { currencySymbol } = this.state.cryptoCurrency
        const { basicCurrencyCode } = this.state.account

        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'

        AsyncStorage.setItem('sendInputType', inputType)

        let amountEquivalent

        const toInput = (!(1 * this.state.amountEquivalent) ? '' : this.state.amountEquivalent).toString()
        const toEquivalent = !this.valueInput.getValue() ? '0' : this.valueInput.getValue()

        if (inputType === 'FIAT') {
            amountEquivalent = toEquivalent
            // Log.log('_SendScreen.handleChangeEquivalentType amount1 ', toInput)
            this.valueInput.handleInput(toInput, false)
        } else {
            amountEquivalent = toEquivalent
            // Log.log('_SendScreen.handleChangeEquivalentType amount2 ', toInput)
            this.valueInput.handleInput(toInput, false)
        }

        this.setState({
            amountInputMark: this.state.inputType === 'FIAT' ? `~ ${amountEquivalent} ${basicCurrencyCode}` : `~ ${amountEquivalent} ${currencySymbol}`,
            amountEquivalent,
            inputType
        })
    }

    handleTransferAll = async () => {
        // Log.log('Send.SendScreen.handleTransferAll')
        Keyboard.dismiss()

        setLoaderStatus(true)
        const { address, currencyCode, balance, unconfirmed, currencySymbol } = this.state.account

        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            // Log.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} data ${balance} + ${unconfirmed}`)

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

            // Log.log(`Send.SendScreen.handleTransferAll ${currencyCode} ${address} addressToForTransferAll ${addressToForTransferAll}`)

            const { countedFees, selectedFee } = await this.recountFees(newSendScreenData, 'Send.SendScreen.handleTransferAll')
            let allBalance = balance
            if (typeof countedFees === 'undefined' || typeof countedFees.selectedTransferAllBalance === 'undefined') {
               if (config.debug.appErrors) {
                   console.log('Send.SendScreen.handleTransferAll ' + newSendScreenData.currencyCode + ' no countedFees ' + JSON.stringify(countedFees))
               }
            } else {
                allBalance = countedFees.selectedTransferAllBalance
                if (config.debug.appErrors) {
                    console.log('Send.SendScreen.handleTransferAll ' + newSendScreenData.currencyCode + ' allBalance ' + allBalance)
                }
            }
            let amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(allBalance)
            newSendScreenData.amountPretty = amount
            newSendScreenData.inputValue = amount
            newSendScreenData.selectedFee = selectedFee
            SendTmpData.setData(newSendScreenData)
            SendActions.setUiType({
                ui: {
                    ...this.props.sendScreenStore.ui,
                    uiNeedToCountFees: false,
                    uiInputType: 'CRYPTO',
                    balancePart: 0
                }
            })

            // Log.log(`Send.SendScreen.handleTransferAll`, JSON.parse(JSON.stringify(this.state.sendScreenData)), JSON.parse(JSON.stringify(newSendScreenData)))

            if (typeof amount !== 'undefined' && amount !== null) {
                amount = UtilsService.cutNumber(amount, 7).toString()
            } else {
                amount = 0
            }
            const { amountEquivalent, amountInputMark} = this.amountEquivalent(amount, 'CRYPTO')
            this.setState({
                useAllFunds: true,
                amountEquivalent: this.state.inputType === 'CRYPTO' ? amountEquivalent : amount,
                amountInputMark: this.state.inputType === 'CRYPTO' ? amountInputMark : `${amount} ${currencySymbol}`,
                sendScreenData : newSendScreenData
            })

            try {
                if (
                    typeof this.valueInput !== 'undefined' && this.valueInput
                    && typeof this.valueInput.handleInput !== 'undefined' && this.valueInput.handleInput
                    && typeof amount !== 'undefined' && amount !== null
                ) {
                    this.valueInput.handleInput(this.state.inputType === 'CRYPTO' ? amount : amountEquivalent.toString(), false)
                }
            } catch (e) {
                e.message += ' while this.valueInput.handleInput amount ' + amount
                throw e
            }

            setLoaderStatus(false)
            // Log.log('Send.SendScreen.handleTransferAll currencyBalanceAmount: ' + amount + ' currencyBalanceAmountRaw: ' + countedFees.selectedTransferAllBalance)

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.SendScreen.handleTransferAll ' + e.message, e)
            }
            Log.errorTranslate(e, 'Send.SendScreen.handleTransferAll ', extend)

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

        const {
            account,
            wallet,
            cryptoCurrency,
            useAllFunds,
            amountEquivalent,
            inputType,
            sendScreenData
        } = this.state

        const { walletUseUnconfirmed } = wallet

        if (typeof this.valueInput.state === 'undefined' || this.valueInput.state.value === '') {
            this.setState({
                enoughFunds: {
                    isAvailable: false,
                    messages: [strings('send.notValidAmount')]
                },
            })
            return false
        }

        if (account.balancePretty <= 0) {
            this.setState({
                enoughFunds: {
                    isAvailable: false,
                    messages: [strings('send.notEnough')]
                },
            })
            return false
        }

        if (typeof this.addressInput.state === 'undefined' || this.addressInput.state.value === '') {
            this.setState({
                addressError: true
            })
            return false
        }

        if (forceSendAll) {
            await this.handleTransferAll()
        }

        // Log.log('Send.SendScreen.handleSendTransaction started ' + JSON.stringify({forceSendAmount,forceSendAll,fromModal}))

        // Log.log('Send.SendScreen.handleSendTransaction state', JSON.parse(JSON.stringify({countedFees,selectedFee})))

        const addressValidation = await this.addressInput.handleValidate()
        const valueValidation = await this.valueInput.handleValidate()
        const destinationTagValidation = typeof this.memoInput.handleInput !== 'undefined' ? await this.memoInput.handleValidate() : {
            status: 'success',
            value: false
        }

        const extend = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)

        if (addressValidation.status !== 'success') {
            // Log.log('Send.SendScreen.handleSendTransaction invalid address ' + JSON.stringify(addressValidation))
            this.setState({
                addressError: true
            })
            return
        }
        if (!forceSendAmount && valueValidation.status !== 'success') {
            // Log.log('Send.SendScreen.handleSendTransaction invalid value ' + JSON.stringify(valueValidation))
            return
        }
        if (!forceSendAmount && valueValidation.value === 0) {
            // Log.log('Send.SendScreen.handleSendTransaction value is 0 ' + JSON.stringify(valueValidation))
            return
        }
        if (destinationTagValidation.status !== 'success') {
            // Log.log('Send.SendScreen.handleSendTransaction invalid destination ' + JSON.stringify(destinationTagValidation))
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
                if (cryptoCurrency.currencyCode === 'USDT' && parentBalance < USDT_LIMIT) {
                    let msg = false
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed * 1 >= USDT_LIMIT) {
                        if (!(walletUseUnconfirmed === 1)) {
                            msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT_WAIT_FOR_CONFIRM', { symbol: extend.addressCurrencyCode })
                        }
                    } else {
                        msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT', { symbol: extend.addressCurrencyCode })
                    }
                    if (msg) {
                        enoughFunds.isAvailable = false
                        enoughFunds.messages.push(msg)
                        Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                        if (config.debug.appErrors) {
                            Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok usdt ' + parentBalance, parentCurrency)
                        }
                    }
                } else if (parentBalance === 0) {
                    let msg = false
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed > 0) {
                        msg = strings('send.notEnoughForFeeConfirmed', { symbol: parentCurrency.currencySymbol })
                    } else {
                        msg = strings('send.notEnoughForFee', { symbol: parentCurrency.currencySymbol })
                    }
                    if (msg) {
                        enoughFunds.isAvailable = false
                        enoughFunds.messages.push(msg)
                        Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
                        if (config.debug.appErrors) {
                            Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance not ok ' + parentBalance, parentCurrency)
                        }
                    }
                } else {
                    // Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentBalance is ok ' + parentBalance, parentCurrency)
                }
            } else {
                // Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' to ' + addressValidation.value + ' parentCurrency not found ' + parentCurrency, parentCurrency)
            }


            if (enoughFunds.messages.length) {
                this.setState({ enoughFunds })
                return
            }
        }

        setLoaderStatus(true)

        let contactName = this.state.contactName
        let contactAddress =  this.state.contactAddress

        let addressTo
        try {
            addressTo = addressValidation.value
            if (addressTo && (addressTo !== contactName || !contactAddress)) {
                let toContactAddress = false
                try {
                    toContactAddress = await SendActions.getContactAddress({ addressName: addressTo, currencyCode : cryptoCurrency.currencyCode })
                    if (!toContactAddress) {
                        contactName = false
                        contactAddress = false
                    } else {
                        contactName = addressTo
                        contactAddress = toContactAddress
                        addressTo = false
                    }
                } catch (e) {
                    enoughFunds.isAvailable = false
                    enoughFunds.messages.push(e.message)
                    setLoaderStatus(false)
                    this.setState({ enoughFunds })
                    return
                }
            }
            const amountFiat = this.state.inputType === 'FIAT' ? valueValidation.value : this.state.amountEquivalent
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
                const hodl = await (BlocksoftBalances.setCurrencyCode(cryptoCurrency.currencyCode)).getBalanceHodl(account)
                if (hodl > 0) {
                    diff = BlocksoftUtils.add(diff, hodl)
                }
                if (diff > 0) {
                    // Log.log('Send.SendScreen.handleSendTransaction ' + cryptoCurrency.currencyCode + ' not ok diff ' + diff, {amountRaw,balanceRaw})
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

                    Log.log('Send.SendScreen.handleSendTransaction checkAlmostAll inited')

                    const limitPercent = BlocksoftExternalSettings.getStatic('SEND_CHECK_ALMOST_ALL_PERCENT')

                    let percentCheck

                    const tmp = {
                        inputType,
                        amount: valueValidation.value,
                        useAll: useAllFunds
                    }

                    let div
                    if (inputType === 'FIAT') {
                        div = BlocksoftUtils.div(amountEquivalent, account.balancePretty)
                        percentCheck = BlocksoftUtils.diff(div, limitPercent)
                        tmp.percentCalc = amountEquivalent + ' / ' +  account.balancePretty + ' = ' + div
                    } else {
                        div = BlocksoftUtils.div(valueValidation.value, account.balancePretty)
                        percentCheck = BlocksoftUtils.diff(div, limitPercent)
                        tmp.percentCalc = valueValidation.value + ' / ' +  account.balancePretty + ' = ' + div
                    }
                    tmp.percentCal2 = div + ' - ' + limitPercent + ' = ' + percentCheck
                    tmp.percentCal3 = percentCheck + ' > 0 => ' + (percentCheck.indexOf('-') === -1) ? ' true ' : ' false'

                    const willShow = (typeof useAllFunds === 'undefined' || useAllFunds === false) && percentCheck.indexOf('-') === -1
                    tmp.willShow = willShow
                    Log.log('Send.SendScreen.handleSendTransaction checkAlmostAll params', tmp)

                    if (willShow) {
                        Log.log('willShow!!!!!')
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
                        return false
                    }
                } else {
                    Log.log('Send.SendScreen.handleSendTransaction checkAlmostAll no inited')
                }
            } catch (e) {
                Log.log('Send.SendScreen.handleSendTransaction checkAlmostAll error ' + e.message)
            }


            this.setState({
                enoughFunds: {
                    isAvailable: true,
                    messages: []
                },
                balance: cryptoCurrency.currencyBalanceAmount
            })

            const newSendScreenData = sendScreenData
            const dataToSendStore = {...this.props.sendScreenStore}

            dataToSendStore.ui.uiInputType = this.state.inputType
            dataToSendStore.addData.gotoReceipt = true
            dataToSendStore.addData.gotoWithCleanData = false
            dataToSendStore.ui.balancePart = this.state.balancePart

            newSendScreenData.amount = amount
            newSendScreenData.amountPretty = amount
            newSendScreenData.amountRaw = amountRaw
            newSendScreenData.contactName = contactName
            newSendScreenData.contactAddress = contactAddress
            newSendScreenData.amountFiat = amountFiat
            let isChanged = false
            if (contactName) {
                if (newSendScreenData.addressTo !== contactName) {
                    newSendScreenData.addressTo = contactName
                    isChanged = true
                }
            } else if (newSendScreenData.addressTo !== addressTo) {
                newSendScreenData.addressTo = addressTo
                isChanged = true
            }

            // when late count
            if (!newSendScreenData.isTransferAll || isChanged || (
                typeof this.props.sendScreenStore.ui.uiNeedToCountFees && this.props.sendScreenStore.ui.uiNeedToCountFees
            )) {
                const { selectedFee } = await this.recountFees(newSendScreenData, 'Send.SendScreen.handleSendTransaction')
                newSendScreenData.selectedFee = selectedFee
                dataToSendStore.ui.uiNeedToCountFees = false
            }

            // memo and destination will be autocomplited
            SendActions.setUiType({
                ui: {
                    ...this.props.sendScreenStore.ui,
                    ...dataToSendStore.ui
                },
                addData: {
                    ...dataToSendStore.addData
                }
            })
            await SendActions.startSend(newSendScreenData)

        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('Send.SendScreen.handleSendTransaction error', e)
            }
            setLoaderStatus(false)
            Log.err('Send.SendScreen.handleSendTransaction error', e)
        }

        // Log.log('Send.SendScreen.handleSendTransaction finished')

    }

    amountEquivalent = (value, inputType = false) => {
        const { currencySymbol, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencyCode, basicCurrencyRate } = this.state.account
        if (inputType === false) {
            inputType = this.state.inputType
        }
        let amountEquivalent = 0
        let symbolEquivalent = currencySymbol
        let valueCrypto = 0
        try {
            if (!value || value === 0 || value === '0.00') {
                amountEquivalent = '0.00'
                symbolEquivalent = inputType === 'CRYPTO' ? `${basicCurrencyCode}` : `${currencySymbol}`
            } else if (inputType === 'CRYPTO') {
                valueCrypto = value
                amountEquivalent = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                amountEquivalent = UtilsService.cutNumber(amountEquivalent, 2)
                symbolEquivalent = basicCurrencyCode
            } else {
                amountEquivalent = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
                amountEquivalent = UtilsService.cutNumber(amountEquivalent, 7)
                if (amountEquivalent === '0') {
                    amountEquivalent = UtilsService.cutNumber(amountEquivalent, 10)
                }
                valueCrypto = amountEquivalent
            }
        } catch (e) {
            // Log.log('Send.SendScreen equivalent error ' + e.message + ' ' + JSON.stringify({ value, currencyCode, basicCurrencyRate }))
        }
        return {
            amountEquivalent,
            amountInputMark: inputType === 'CRYPTO' ? `~ ${amountEquivalent} ${symbolEquivalent}` : `~ ${amountEquivalent} ${symbolEquivalent}`,
            valueCrypto
        }
    }

    amountInputCallback = async (value, changeUseAllFunds, addressTo = false, memo = false, addressValidateType = '') => {

        try {
            let { useAllFunds, contactName, contactAddress } = this.state
            Log.log('SendScreen.amountInputCallback state', { value, changeUseAllFunds, addressTo, memo })

            const { currencySymbol, currencyCode } = this.state.cryptoCurrency
            const { basicCurrencySymbol, basicCurrencyRate, address } = this.state.account

            if (value === false) {
                const valueValidate = await this.valueInput.handleValidate()
                if (typeof valueValidate.value !== 'undefined') {
                    value = valueValidate.value
                }
            }


            if (addressTo === false) {
                if (contactAddress) {
                    addressTo = contactAddress
                    this.addressInput.handleInput(contactName.toString(), false)
                } else {
                    const addressValidate = await this.addressInput.handleValidate()
                    if (addressValidate.status === 'success') {
                        addressTo = addressValidate.value
                        this.setState({
                            addressError: false
                        })
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
                    contactName = addressTo
                    contactAddress = toContactAddress
                    addressTo = toContactAddress
                } else {
                    if (!this.state.domainResolving) {
                        if (/^.+\.crypto$/.test(addressTo)) {
                            if (!this.domainResolution) {
                                this.domainResolution = new Resolution()
                            }
                            this.domainResolution
                              .addr(addressTo, currencyCode)
                              .then(address => {
                                  this.addressInput.setState({value: address})
                                  this.setState({
                                      domainResolving: false,
                                      domainAddress: address,
                                  })
                              })
                              .catch((e) => {
                                  this.addressInput.setState({focus: true})
                                  this.setState({
                                      domainResolving: false,
                                      domainResolveFailed: true,
                                  })
                              })
                            this.setState({
                                domainResolving: true,
                                domainName: addressTo,
                            })
                        } else if (this.state.domainName) {
                            this.setState({
                                domainResolving: false,
                                domainName: '',
                                domainAddress: '',
                                domainResolveFailed: false,
                            })
                        }
                    }
                    contactName = false
                    contactAddress = false
                    const obj = { type: addressValidateType, value: addressTo, ...this.state.cryptoCurrency }
                    if (typeof this.state.cryptoCurrency.network !== 'undefined') {
                        obj.subtype = this.state.cryptoCurrency.network
                    }
                    const errors = await Validator.userDataValidation(obj)
                    if (typeof errors.msg !== 'undefined') {
                        return false
                    }
                }
                this.setState({
                    contactName : contactName,
                    contactAddress : contactAddress,
                })
            }

            if (memo === false && typeof this.memoInput.handleValidate !== 'undefined') {
                const memoValidate = await this.memoInput.handleValidate()
                if (memoValidate.status === 'success') {
                    memo = memoValidate.value
                }
            }

            if (useAllFunds && changeUseAllFunds) {
                useAllFunds = false
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
                })
                IS_CALLED_BACK = false
                return true
            }

            const newSendScreenData = JSON.parse(JSON.stringify(this.state.sendScreenData))
            const dataToSendStore = this.props.sendScreenStore

            if (
                (valueCrypto && newSendScreenData.inputValue !== valueCrypto) ||
                (newSendScreenData.isTransferAll !== useAllFunds) ||
                (addressTo && newSendScreenData.addressTo !== addressTo) ||
                (memo && newSendScreenData.memo !== memo)
            ) {
                newSendScreenData.isTransferAll = useAllFunds
                newSendScreenData.contactName = contactName
                newSendScreenData.contactAddress = contactAddress
                newSendScreenData.addressTo = addressTo
                if (memo) {
                    newSendScreenData.memo = memo
                }

                newSendScreenData.inputValue = valueCrypto
                if (!newSendScreenData.isTransferAll) {
                    newSendScreenData.amountPretty = valueCrypto
                    newSendScreenData.amountRaw = valueCryptoRaw
                    newSendScreenData.unconfirmedRaw = 0

                    dataToSendStore.ui.uiNeedToCountFees = true
                    dataToSendStore.ui.uiInputType = 'any'
                    dataToSendStore.ui.balancePart = this.state.balancePart
                } else {
                    // lets try late count - only transfer all requires
                    this.setState({
                        loadFee : true
                    })
                    const {selectedFee} = await this.recountFees(newSendScreenData, 'Send.SendScreen.amountInputCallback')
                    newSendScreenData.selectedFee = selectedFee

                    dataToSendStore.ui.uiNeedToCountFees = false
                    dataToSendStore.ui.uiInputType = 'CRYPTO'
                    // Log.log(`Send.SendScreen.amountInputCallback`, JSON.parse(JSON.stringify(this.state.sendScreenData)), JSON.parse(JSON.stringify(newSendScreenData)))
                }
            } else {
                // Log.log('Send.SendScreen.amountInputCallback not updated as not changed')
            }
            dataToSendStore.ui.uiInputAddress = addressTo && addressTo !== ''

            SendActions.setUiType({
                ui: {
                    ...this.props.sendScreenStore.ui,
                    ...dataToSendStore.ui
                }
            })
            SendTmpData.setData(newSendScreenData)

            this.setState({
                amountEquivalent: amountEquivalent,
                amountInputMark: amountInputMark,
                loadFee : false,
                sendScreenData: newSendScreenData,
                enoughFunds: {
                    isAvailable: true,
                    messages: []
                }
            })

            IS_CALLED_BACK = false
        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('Send.SendScreen.amountInputCallback error ' + e.message, e)
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
        }, 500)
    }

    renderEnoughFundsError = () => {
        const { enoughFunds } = this.state

        const { colors, GRID_SIZE } = this.context

        // Log.log('Send.SendScreen renderEnoughFundsError', enoughFunds)
        if (!enoughFunds.isAvailable) {
            return (
                <View style={{ marginTop: GRID_SIZE }}>
                    {
                        enoughFunds.messages.map((item, index) => {
                            return (
                                <View key={index} style={style.texts}>
                                    <View style={style.texts__icon}>
                                        <Icon
                                            name='information-outline'
                                            size={22}
                                            color='#864DD9'
                                        />
                                    </View>
                                    <View>
                                        <TouchableOpacity delayLongPress={500} onLongPress={() => this.handleOkForce()}>
                                            <Text style={{...style.texts__item, color: colors.common.text3 }}>
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

    renderAddressError = () => {
        const { addressError } = this.state
        const { colors, GRID_SIZE } = this.context

        if (addressError) {
            return (
                <View style={{ marginVertical: GRID_SIZE }}>
                    <View style={style.texts}>
                        <View style={style.texts__icon}>
                            <Icon
                                name='information-outline'
                                size={22}
                                color='#864DD9'
                            />
                        </View>
                        <Text style={{...style.texts__item, color: colors.common.text3 }}>
                            {strings('send.addressError')}
                        </Text>
                    </View>
                </View>
            )
        }
    }

    renderDomainResolveStatus = () => {
        const { domainResolving, domainAddress, domainName, domainResolveFailed } = this.state
        const { colors, GRID_SIZE } = this.context

        if (domainResolving || domainAddress || domainResolveFailed) {
            let text
            const params = {
                domain: domainName,
                address: domainAddress,
            }
            if (domainResolving) {
                text = strings('send.domainResolution.resolving', params)
            } else if (domainAddress) {
                text = strings('send.domainResolution.success', params)
            } else {
                text = strings('send.domainResolution.fail', params)
            }
            return (
              <View style={{marginVertical: GRID_SIZE}}>
                  <View style={style.texts}>
                      {domainResolveFailed ?
                          <View style={style.texts__icon}>
                              <Icon
                                name='information-outline'
                                size={22}
                                color='#864DD9'
                              />
                          </View> : null
                      }
                      <Text style={{...style.texts__item, color: colors.common.text3}}>
                          {text}
                      </Text>
                  </View>
              </View>
            )
        }
    }

    getBalanceVisibility = () => {
        const originalVisibility = this.props.settingsStore.data.isBalanceVisible
        this.setState(() => ({ originalVisibility, isBalanceVisible: originalVisibility }))
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    renderAccountDetail = () => {

        const { currencySymbol, currencyName, currencyCode } = this.state.cryptoCurrency
        const { basicCurrencyRate, balancePretty, unconfirmedPretty } = this.state.account
        const { walletUseUnconfirmed } = this.state.wallet
        const { originalVisibility, isBalanceVisible } = this.state

        const amountPretty = BlocksoftTransferUtils.getBalanceForTransfer({
                walletUseUnconfirmed: walletUseUnconfirmed === 1,
                balancePretty,
                unconfirmedPretty,
                currencyCode
            }
        )

        const amountPrep = BlocksoftPrettyNumbers.makeCut(amountPretty).separated

        const { colors } = this.context

        let sumPrep = amountPrep + ' ' + currencySymbol
        if (amountPretty && currencyCode && basicCurrencyRate) {
            try {
                const basicCurrencySymbol = this.state.account.basicCurrencySymbol || '$'
                const basicAmount = RateEquivalent.mul({ value: amountPretty, currencyCode, basicCurrencyRate })
                const basicAmountPrep = BlocksoftPrettyNumbers.makeCut(basicAmount, 2).cutted
                sumPrep += ' / ~' + basicCurrencySymbol + ' ' + basicAmountPrep
            } catch (e) {
                if (config.debug.appErrors) {
                    Log.log('Send.SendScreen renderAccountDetail error ' + e.message, e)
                }
            }
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                    <CurrencyIcon currencyCode={currencyCode} />
                </View>
                <View style={styles.accountDetail__content}>
                    <View style={{}}>
                        <Text style={{...styles.accountDetail__title, color: colors.common.text1 }} numberOfLines={1}>
                            {currencyName}
                        </Text>
                        {/* <View style={{ alignItems: 'flex-start' }}> */}
                        <TouchableOpacity
                            onPressIn={() => this.triggerBalanceVisibility(true)}
                            onPressOut={() => this.triggerBalanceVisibility(false)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible? 60 : 30, bottom: 10, left: isBalanceVisible? 60 : 30 }}
                            >
                                {isBalanceVisible ?
                                <LetterSpacing text={sumPrep} textStyle={styles.accountDetail__text} letterSpacing={1} /> :
                                <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, fontSize: 24 }}>
                                    ****</Text>
                                }
                            </TouchableOpacity>
                        {/* </View> */}
                    </View>
                </View>
            </View>
        )
    }

    handlerPartBalance = (inputType, part) => {
        let value = BlocksoftUtils.mul(BlocksoftUtils.div(inputType === 'FIAT' ? this.state.account.basicCurrencyBalance :
            this.state.account.balancePretty, 4), Number(part))
        Log.log('SendScreen.handlerPartBalance.inputType', inputType, value)

        value = UtilsService.cutNumber(value, inputType === 'FIAT' ? 2 : 7).toString()
        this.valueInput.state.value = value
        this.valueInput.state.fontSize = value.length > 8 && value.length < 10 ? 36 : value.length >= 10 &&
        value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
        this.amountInputCallback(value, true)
    }

    disabled = () => {

        if (this.state.loadFee || this.state.domainResolving) {
            return true
        }

    }

    disabledSettings = () => {

        const { balancePretty } = this.state.account

        if (balancePretty <= 0) {
            this.setState({
                enoughFunds: {
                    isAvailable: false,
                    messages: [strings('send.notEnough')]
                },
            })
            return false
        }

        if (typeof this.valueInput.state === 'undefined' || this.valueInput.state.value === '' || this.valueInput.state.value === 0) {
            this.setState({
                enoughFunds: {
                    isAvailable: false,
                    messages: [strings('send.notValidAmount')]
                },
            })
            return false
        }

        if (typeof this.addressInput.state === 'undefined' || this.addressInput.state.value === '') {
            this.setState({
                addressError: true
            })
            return false
        }
    }

    closeAction = async (closeScreen=false) => {
        SendActions.cleanData()
        if (closeScreen) {
            NavStore.reset('DashboardStack')
        } else {
            NavStore.goBack()
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Send.SendScreen')

        // const route = NavStore.getCurrentRoute()
        // if (route.routeName === 'Send.SendScreen') { // @todo do we still need it?
        //     if (!IS_CALLED_BACK) {
        //         if (typeof this.state.amountEquivalent === 'undefined' || this.state.amountEquivalent.toString() === '0') {
        //             if (typeof this.valueInput !== 'undefined' && typeof this.valueInput.getValue !== 'undefined') {
        //                 const value = this.valueInput.getValue()
        //                 if (value) {
        //                     IS_CALLED_BACK = true
        //                     this.amountInputCallback(value)
        //                 }
        //             }
        //         }
        //     }
        // } else {
        //     IS_CALLED_BACK = false
        // }

        const {
            focused,
            headerHeight,
            loadFee,
            inputType
        } = this.state

        const {
            currencySymbol,
            currencyCode,
            extendsProcessor,
            addressUiChecker,
            decimals,
            network
        } = this.state.cryptoCurrency

        const { balancePretty, basicCurrencyCode } = this.state.account

        const { colors, GRID_SIZE, isLight } = this.context

        // actually should be dict[extendsProcessor].addressUIChecker check but not to take all store will keep simplier
        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }

        const notEquivalentValue = this.state.amountInputMark ? this.state.amountInputMark : `0.00 ${inputType !== 'CRYPTO' ? currencySymbol : basicCurrencyCode }`

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    leftParams={{"close": false}}
                    rightType='close'
                    rightAction={this.closeAction}
                    rightParams={{"close": true}}
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
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'space-between',
                            padding: GRID_SIZE,
                            paddingBottom: GRID_SIZE * 2,
                            // height: WINDOW_HEIGHT
                        }}
                        style={{ marginTop: headerHeight }}
                    >
                        <View>
                            <View style={{ width: '75%', alignSelf: 'center', alignItems: 'center', }}>
                                <View style={{ flexDirection: 'row', }}>
                                    <AmountInput
                                        ref={component => this.valueInput = component}
                                        // onFocus={() => this.onFocus()}
                                        decimals={decimals < 10 ? decimals : 10}
                                        enoughFunds={!this.state.enoughFunds.isAvailable}
                                        id={amountInput.id}
                                        additional={amountInput.additional}
                                        type={amountInput.type}
                                        callback={(value) => {
                                            this.setState({
                                                balancePart: 0
                                            })
                                            this.amountInputCallback(value, true)
                                        }}
                                        maxLength={17}
                                        maxWidth={SCREEN_WIDTH * 0.6}
                                    />
                                    <Text style={{...style.ticker, color: colors.sendScreen.amount }}>
                                        {inputType === 'CRYPTO' ? currencySymbol : basicCurrencyCode }
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                <View style={{...style.line, backgroundColor: colors.sendScreen.colorLine }} />
                                <TouchableOpacity style={{ position: 'absolute', right: 10, marginTop: -4 }}
                                                  onPress={this.handleChangeEquivalentType} hitSlop={HIT_SLOP} >
                                    <CustomIcon name={'changeCurrency'} color={colors.common.text3} size={20} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                <LetterSpacing text={loadFee ? 'Loading...' : notEquivalentValue} textStyle={{...style.notEquivalentValue, color: '#999999' }}
                                               letterSpacing={1.5} />
                            </View>
                            { balancePretty > 0  && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: GRID_SIZE }}>
                                    <PartBalanceButton
                                        action={() => {
                                            this.handlerPartBalance(this.state.inputType, 1)

                                            this.setState({
                                                balancePart: 1,
                                                useAllFunds: false
                                            })
                                        }}
                                        text={'25%'}
                                        inverse={this.state.balancePart === 1 ? true : false}
                                    />
                                    <PartBalanceButton
                                        action={() => {
                                            this.handlerPartBalance(this.state.inputType, 2)
                                            this.setState({
                                                balancePart: 2,
                                                useAllFunds: false
                                            })
                                        }}
                                        text={'50%'}
                                        inverse={this.state.balancePart === 2 ? true : false}
                                    />
                                    <PartBalanceButton
                                        action={() => {
                                            this.handlerPartBalance(this.state.inputType, 3)
                                            this.setState({
                                                balancePart: 3,
                                                useAllFunds: false
                                            })
                                        }}
                                        text={'75%'}
                                        inverse={this.state.balancePart === 3 ? true : false}
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
                            )}

                            {this.renderEnoughFundsError()}

                            <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5, }}>
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
                                    adrressError={this.state.addressError}
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
                            { this.renderDomainResolveStatus() }
                            { this.renderAddressError() }
                            {
                                currencyCode === 'XRP' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5}}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.xrp_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            onFocus={() => this.onFocus()}
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
                                currencyCode === 'XLM' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5}}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.xrp_memo')}
                                            type={'XLM_DESTINATION_TAG'}
                                            onFocus={() => this.onFocus()}
                                            keyboardType={'default'}
                                            info={true}
                                            tabInfo={() => this.modalInfo()}
                                            callback={(value) => {
                                                this.amountInputCallback(false, false, false, value)
                                            }}
                                        />
                                    </View> : null
                            }

                            {
                                currencyCode === 'BNB' ?
                                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5}}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.bnb_memo')}
                                            type={'XLM_DESTINATION_TAG'}
                                            onFocus={() => this.onFocus()}
                                            keyboardType={'default'}
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
                                    <View style={{  ...style.inputWrapper, marginVertical: GRID_SIZE }}>
                                        <MemoInput
                                            ref={component => this.memoInput = component}
                                            id={memoInput.id}
                                            name={strings('send.xmr_memo')}
                                            type={extendedAddressUiChecker.toUpperCase() + '_DESTINATION_TAG'}
                                            onFocus={() => this.onFocus()}
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
                        <View style={{ marginTop: GRID_SIZE }}>
                            <TwoButtons
                                mainButton={{
                                    disabled: this.disabled(),
                                    onPress: () => this.handleSendTransaction(false),
                                    title: strings('walletBackup.step0Screen.next')
                                }}
                                secondaryButton={{
                                    // disabled: this.disabled(),
                                    type: 'settings',
                                    onPress: this.disabled() === true ? this.disabledSettings : this.openAdvancedSettings
                                }}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAwareView>
            </View>

        )
    }

}

SendScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        sendScreenStore: state.sendScreenStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendScreen)

const style = {
    ticker: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 15,
        lineHeight: 19,

        alignSelf: 'flex-end',
        marginBottom: 8,
        paddingLeft: 6
    },
    line: {
        height: 1,
        width: '75%',
        alignSelf: 'center',
        marginVertical: 6
    },
    notEquivalentValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19
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
        // height: 50,
        borderRadius: 10,
        elevation: 8,
        // marginTop: 32,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1,
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    },
}

const styles = {
    text: {
        fontSize: 16,
        color: '#999999',
        textAlign: 'justify'
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#5C5C5C',
        letterSpacing: 1,
    },
    accountDetail: {
        marginLeft: 31
    },
    accountDetail__content: {
        flexDirection: 'row',

        marginLeft: 16
    },
    accountDetail__title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18
    },
    accountDetail__text: {
        fontSize: 14,
        height: Platform.OS === 'ios' ? 15 : 18,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#939393'
    }
}
