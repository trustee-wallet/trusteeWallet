/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, StatusBar } from 'react-native'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import Log from '../../services/Log/Log'

import LetterSpacing from '../../components/elements/LetterSpacing'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'

import UIDict from '../../services/UIDict/UIDict'

import CheckData from './elements/CheckData'
import CustomIcon from '../../components/elements/CustomIcon'
import SendBasicScreenScreen from './SendBasicScreen'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import transactionActions from '../../appstores/Actions/TransactionActions'
import { recordFioObtData } from '../../../crypto/blockchains/fio/FioUtils'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'

import config from '../../config/config'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'
import { SendTmpData } from '../../appstores/Stores/Send/SendTmpData'
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import {
    setLoaderStatus,
    setSelectedAccount,
    setSelectedCryptoCurrency
} from '../../appstores/Stores/Main/MainStoreActions'

let CACHE_WARNING_AMOUNT = ''
let CACHE_IS_SENDING = false
let CACHE_IS_FEE_LOADING = false

class ReceiptScreen extends SendBasicScreenScreen {

    _screenName = 'Receipt'

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

            headerHeight: 0,
            needPasswordConfirm: false,

            loadFee : false,

            sendInProcess: null,

        }
    }

    componentDidMount() {
        // when usual open (moved from unsafe)
        this.init()

        // when back by history
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.init()
        })
    }
    
    startLoadFee = async () => {
        if (CACHE_IS_FEE_LOADING) return
        
        CACHE_IS_FEE_LOADING = true
        const { sendScreenData } = this.state
        // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee

        let tmp = SendTmpData.getCountedFees()
        let selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        if (!selectedFee || sendScreenData.uiNeedToCountFees) {
            this.setState({
                loadFee: true
            })
            tmp = await this.recountFees(sendScreenData, 'Send.ReceiptScreen.startLoadFee')
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }
        sendScreenData.selectedFee = selectedFee
        sendScreenData.uiNeedToCountFees = false
        this.setState({
            sendScreenData,
            loadFee: false
        })
        CACHE_IS_FEE_LOADING = false
    }

    init = async () => {
        const sendScreenData = SendTmpData.getData()
        if (config.debug.sendLogs) {
            console.log('')
            console.log('')
            console.log('Send.ReceiptScreen.init', JSON.parse(JSON.stringify(sendScreenData)))
        }

        const { account, cryptoCurrency, wallet } = SendActions.findWalletPlus(sendScreenData.currencyCode)

        this.setState(
            {
                sendScreenData,
                account,
                cryptoCurrency,
                wallet,
                useAllFunds: sendScreenData.isTransferAll,
                init: true
            }, () => {

                this.startLoadFee()

                this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
                    const settings = this.props.settingsStore.data
                    if (+settings.lock_screen_status) {
                        this.setState({
                            needPasswordConfirm: true
                        })
                    }
                })

                setLoaderStatus(false)
            }
        )
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false) => {

        if (config.debug.sendLogs) {
            console.log('Send.ReceiptScreen.handleSend state', JSON.parse(JSON.stringify(this.state)))
        }

        this.setState({
            sendInProcess: true
        })

        const { settingsStore } = this.props

        const { needPasswordConfirm } = this.state

        let passwordChecked = false
        if (needPasswordConfirm && typeof settingsStore.data.askPinCodeWhenSending !== 'undefined' && +settingsStore.data.askPinCodeWhenSending) {
            if (passwordCheck) {
                lockScreenAction.setFlowType({ flowType: 'CONFIRM_SEND_CRYPTO' })
                lockScreenAction.setActionCallback({ actionCallback: this.handleSend })
                NavStore.goNext('LockScreen')
                return
            } else {
                passwordChecked = true
            }
        }

        CACHE_IS_SENDING = true

        const { account, wallet, sendScreenData } = this.state
        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee } = wallet
        const { address, derivationPath,  accountJson, currencyCode, accountId } = account

        let selectedFee = typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee : false
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }
        if (!selectedFee || sendScreenData.uiNeedToCountFees) {
            const tmp = await SendActions.countFees(sendScreenData)
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        if (typeof selectedFee !== 'undefined' && selectedFee && typeof selectedFee.amountForTx !== 'undefined' && !passwordChecked) {
            const newAmount = selectedFee.amountForTx.toString()
            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(sendScreenData.amountRaw)
            const newTmp = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(newAmount)
            if (newTmp.substring(0, tmp.length) !== tmp) {
                sendScreenData.amountRaw = newAmount
                if (CACHE_WARNING_AMOUNT !== newTmp) {
                    // @yura here should be alert when fixed receipt and no tx
                    showModal({
                        type: 'INFO_MODAL',
                        icon: null,
                        title: strings('modal.titles.attention'),
                        description: strings('modal.send.feeChangeAmount')
                    })
                    CACHE_WARNING_AMOUNT = sendScreenData.amountRaw
                    return false
                }
            }
        }

        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        // also will go to actions later
        try {
            const txData = {
                currencyCode,
                walletHash,
                derivationPath: derivationPath,
                addressFrom: address,
                addressTo: sendScreenData.addressTo,
                amount: sendScreenData.amountRaw,
                isTransferAll: sendScreenData.isTransferAll,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                accountJson,
                transactionJson: sendScreenData.transactionJson,
            }
            let memo = false
            let comment = false
            if (typeof sendScreenData.memo !== 'undefined') {
                memo = sendScreenData.memo
                txData.memo = memo
            }
            if (typeof sendScreenData.comment !== 'undefined') {
                comment = sendScreenData.comment
            }
            const contactName = sendScreenData.contactName || false
            if ((!txData.addressTo || txData.addressTo === '') && contactName) {
                txData.addressTo = contactName
            }
            if (typeof selectedFee !== 'undefined' && selectedFee) {
                if (typeof selectedFee.amountForTx !== 'undefined') {
                    txData.amount = selectedFee.amountForTx
                }
                if (typeof selectedFee.addressToTx !== 'undefined') {
                    txData.addressTo = selectedFee.addressToTx
                }
            }
            let txRBF = false
            let txRBFed = ''
            if (sendScreenData.transactionRemoveByFee) {
                txData.transactionRemoveByFee = sendScreenData.transactionRemoveByFee
                txRBF = txData.transactionRemoveByFee
                txRBFed = 'RBFremoved'
            }
            if (sendScreenData.transactionReplaceByFee) {
                txData.transactionReplaceByFee = sendScreenData.transactionReplaceByFee
                txRBF = txData.transactionReplaceByFee
                txRBFed = 'RBFed'
            }
            if (sendScreenData.transactionSpeedUp) {
                txData.transactionSpeedUp = sendScreenData.transactionSpeedUp
            }
            if (config.debug.sendLogs) {
                console.log('ReceiptScreen txData', txData)
            }
            const tx = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed, selectedFee })
            if (config.debug.sendLogs) {
                console.log('ReceiptScreen tx', txData)
            }
            let transactionJson = sendScreenData.transactionJson
            if (!transactionJson || typeof transactionJson === 'undefined' || transactionJson === null) {
                transactionJson = {}
            }
            if (memo) {
                transactionJson.memo = memo
            }
            if (comment) {
                transactionJson.comment = comment
            }
            if (typeof tx.transactionJson !== 'undefined') {
                let key
                for (key in tx.transactionJson) {
                    transactionJson[key] = tx.transactionJson[key]
                }
            }


            const now = new Date().toISOString()
            if (txRBF) {
                const transaction = {
                    currencyCode,
                    accountId,
                    addressAmount: typeof tx.amountForTx !== 'undefined' ? tx.amountForTx : txData.amount,
                    addressTo: txData.addressTo,
                    transactionHash: tx.transactionHash,
                    transactionStatus: 'new',
                    transactionUpdateHash: txRBF,
                    transactionsOtherHashes: txRBF,
                    transactionJson,
                    transactionsScanLog: now + ' ' + txRBFed + ' ' + txRBF + ' => ' + tx.transactionHash + ' '
                }
                if (typeof tx.transactionFeeCurrencyCode !== 'undefined') {
                    transaction.transactionFeeCurrencyCode = tx.transactionFeeCurrencyCode
                }
                if (typeof tx.transactionFee !== 'undefined') {
                    transaction.transactionFee = tx.transactionFee
                }
                if (typeof tx.amountForTx !== 'undefined') {
                    transaction.addressAmount = tx.amountForTx
                }
                if (sendScreenData.transactionRemoveByFee) {
                    transaction.addressTo = ''
                    transaction.transactionDirection = 'self'
                }
                if (config.debug.sendLogs) {
                    console.log('ReceiptScreen.saveTx RBFed', transaction)
                }
                await transactionActions.updateTransaction(transaction)
            } else {
                const transaction = {
                    currencyCode: currencyCode,
                    accountId: accountId,
                    walletHash: walletHash,
                    transactionHash: tx.transactionHash,
                    transactionStatus: 'new',
                    addressTo: txData.addressTo,
                    addressFrom: '',
                    addressFromBasic: txData.addressFrom.toLowerCase(),
                    addressAmount: typeof tx.amountForTx !== 'undefined' ? tx.amountForTx : txData.amount,
                    transactionFee: tx.transactionFee || '',
                    transactionFeeCurrencyCode: tx.transactionFeeCurrencyCode || '',
                    transactionOfTrusteeWallet: 1,
                    transactionJson,
                    blockConfirmations: 0,
                    createdAt: now,
                    updatedAt: now,
                    transactionDirection: 'outcome',
                    transactionsScanLog: now + ' CREATED '
                }
                if (sendScreenData.transactionSpeedUp) {
                    transaction.transactionsScanLog += 'SPEED UP ' + sendScreenData.transactionSpeedUp + ' '
                    transaction.addressTo = ''
                    transaction.transactionDirection = 'self'
                } else if (account.address === transaction.addressTo) {
                    transaction.addressTo = ''
                    transaction.transactionDirection = 'self'
                }
                if (typeof tx.amountForTx !== 'undefined') {
                    transaction.addressAmount = tx.amountForTx
                }
                if (typeof tx.blockHash !== 'undefined') {
                    transaction.blockHash = tx.blockHash
                }
                if (typeof tx.transactionStatus !== 'undefined') {
                    transaction.transactionStatus = tx.transactionStatus
                }
                if (transaction.addressTo === txData.addressFrom) {
                    transaction.addressTo = ''
                    transaction.transactionDirection = 'self'
                }
                if (typeof tx.transactionTimestamp !== 'undefined' && tx.transactionTimestamp) {
                    transaction.createdAt = new Date(tx.transactionTimestamp).toISOString()
                    transaction.updatedAt = new Date(tx.transactionTimestamp).toISOString()
                }

                const logData = {
                    walletHash: walletHash,
                    currencyCode: currencyCode,
                    transactionHash: tx.transactionHash,
                    addressTo: txData.addressTo,
                    addressFrom: txData.addressFrom,
                    addressAmount: txData.amountRaw,
                    fee: JSON.stringify(selectedFee)
                }
                if (sendScreenData.transactionSpeedUp) {
                    logData.transactionSpeedUp = sendScreenData.transactionSpeedUp
                }
                if (typeof sendScreenData.bseOrderId !== 'undefined' && sendScreenData.bseOrderId) {
                    transaction.bseOrderId = sendScreenData.bseOrderId
                    transaction.bseOrderIdOut = sendScreenData.bseOrderId
                    if (typeof sendScreenData.bseOrderData !== 'undefined') {
                        transaction.bseOrderData = sendScreenData.bseOrderData
                    }
                    logData.bseOrderId = sendScreenData.bseOrderId.toString()
                }

                const line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

                if (config.debug.sendLogs) {
                    console.log('ReceiptScreen.saveTx new', transaction)
                }
                await transactionActions.saveTransaction(transaction, line + ' HANDLE SEND ')
            }


            if (typeof sendScreenData.fioRequestDetails !== 'undefined' && sendScreenData.fioRequestDetails) {
                const tmp = sendScreenData.fioRequestDetails
                await recordFioObtData({
                    fioRequestId: tmp.fio_request_id,
                    payerFioAddress: tmp.payer_fio_address,
                    payeeFioAddress: tmp.payee_fio_address,
                    payerTokenPublicAddress: txData.addressFrom,
                    payeeTokenPublicAddress: txData.addressTo,
                    amount: txData.amountRaw,
                    chainCode: currencyCode,
                    tokenCode: currencyCode,
                    obtId: tx.transactionHash,
                    memo: tmp.memo
                })
            }

            hideModal()

            let successMessage = strings('modal.send.txSuccess')
            if (typeof tx.successMessage !== 'undefined') {
                successMessage = tx.successMessage // @yura @todo support of the message
            }

            this.setState({
                sendInProcess: false
            },

            // showModal({
            //     type: 'INFO_MODAL',
            //     icon: true,
            //     title: strings('modal.send.success'),
            //     description: successMessage
            // },
            async () => {

                const { uiType } = this.state.sendScreenData

                if (sendScreenData.transactionSpeedUp || sendScreenData.transactionReplaceByFee || sendScreenData.transactionRemoveByFee) {
                    NavStore.reset('TransactionScreen', {
                        txData: {
                            transactionHash: tx.transactionHash,
                            toOpenAccountBack : true
                        },
                    })
                } else if (uiType === 'MAIN_SCANNER') {
                    NavStore.reset('DashboardStack')
                } else if (uiType === 'SEND_SCANNER' || uiType === 'ACCOUNT_SCREEN') {
                    // NavStore.reset('AccountScreen')
                    NavStore.goNext('TransactionScreen', {
                        txData: {
                            transactionHash: tx.transactionHash,
                        } 
                    })
                } else if (uiType === 'TRADE_SEND') {
                    NavStore.reset('TransactionScreen', {
                        txData: {
                            transactionHash: tx.transactionHash,
                        } 
                    })
                    // NavStore.goNext('FinishScreen', {
                    //     finishScreenParam: {
                    //         selectedCryptoCurrency: this.state.cryptoCurrency
                    //     }
                    // })
                } else if (uiType === 'DEEP_LINKING' || uiType === 'HOME_SCREEN') {
                    // account was not opened before
                    setSelectedCryptoCurrency(this.state.cryptoCurrency)
                    await setSelectedAccount()
                    NavStore.reset('AccountScreen')
                } else {
                    // fio request etc - direct to receipt
                    NavStore.goBack(null)
                }
            })

        } catch (e) {

            Keyboard.dismiss()

            this.setState({
                sendInProcess: false
            })

            if (config.debug.appErrors) {
                console.log('Send.ConfirmSendScreen.handleSend error', e)
            }

            if (e.message.indexOf('UI_') === 0) {
                Log.log('Send.ConfirmSendScreen.handleSend protection ' + e.message)


                const allData = this.state.data

                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('send.confirmModal.title'),
                    description: strings('send.errors.' + e.message)
                }, async () => {
                    CACHE_IS_SENDING = false
                    if (typeof e.newAmount !== 'undefined') {
                        allData.amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(e.newAmount)
                        this.setState({ amountRaw: e.newAmount, data: allData })
                        await this.fee.changeAmountRaw(e.newAmount)
                    } else {
                        this.handleSend(passwordCheck, e.message)
                    }
                })

            } else {
                const msg = e.message
                Log.errorTranslate(e, 'Send.ConfirmSendScreen.handleSend', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                }, async () => {
                    if (
                        msg.indexOf('SERVER_RESPONSE_PLEASE_SELECT_FEE') !== -1
                        || msg.indexOf('SERVER_RESPONSE_TOO_BIG_FEE_PER_BYTE_FOR_TRANSACTION') !== -1
                    ) {
                        this.openAdvancedSettings({toOpenCustom : true})
                    }
                })
            }
            CACHE_IS_SENDING = false
        }


    }

    disabled = () => {

        if (this.state.loadFee) {
            return true
        }

        return false
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        firebase.analytics().setCurrentScreen('Send.ReceiptScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        let { headerHeight, sendScreenData, cryptoCurrency, account, sendInProcess } = this.state

        Log.log('Send.ReceiptScreen.render data', JSON.parse(JSON.stringify(sendScreenData)))

        if (typeof account === 'undefined' || typeof account.basicCurrencySymbol === 'undefined') {
            const tmp = SendActions.findWalletPlus(sendScreenData.currencyCode)
            account = tmp.account
            cryptoCurrency = tmp.cryptoCurrency
        }

        let selectedFee = typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee : false
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        let amount = sendScreenData.amountPretty
        let address = sendScreenData.addressTo || ''
        let memo = sendScreenData.memo || ''
        let contactName = sendScreenData.contactName || false
        if (contactName === address) {
            contactName = false
        }
        if (!address && contactName) {
            address = contactName
            contactName = false
        }
        let isFioRequest = false
        if (typeof sendScreenData.fioRequestDetails !== 'undefined' && typeof sendScreenData.fioRequestDetails.content !== 'undefined') {
            memo = sendScreenData.fioRequestDetails.content.memo // dont do inside is different fields actually!
            isFioRequest = true
        }


        if (typeof selectedFee !== 'undefined' && selectedFee) {
            if (typeof selectedFee !== 'undefined' && selectedFee && typeof selectedFee.amountForTx !== 'undefined') {
                const newAmount = BlocksoftPrettyNumbers.setCurrencyCode(cryptoCurrency.currencyCode).makePretty(selectedFee.amountForTx)
                if (typeof amount === 'undefined') {
                    amount = newAmount
                } else {
                    const tmp = amount.toString()
                    if (newAmount.toString().substring(0, tmp.length) !== tmp) {
                        amount = newAmount
                        if (CACHE_WARNING_AMOUNT !== amount && !sendScreenData.transactionRemoveByFee) {
                            showModal({
                                type: "INFO_MODAL",
                                icon: null,
                                title: strings('modal.titles.attention'),
                                description: strings('modal.send.feeChangeAmount')
                            })
                        }
                        CACHE_WARNING_AMOUNT = amount
                    }
                }
                if (config.debug.sendLogs) {
                    console.log('Send.ReceiptScreen amountFromFee ' + amount, JSON.parse(JSON.stringify(selectedFee)))
                }
            }
            if (typeof selectedFee.addressToTx !== 'undefined') {
                address = selectedFee.addressToTx
            }
        }

        const currencySymbol = typeof cryptoCurrency !== 'undefined' && cryptoCurrency.currencySymbol ? cryptoCurrency.currencySymbol : ''
        const basicCurrencySymbol = account.basicCurrencySymbol

        const dict = new UIDict(account.currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        let equivalent = ''
        try {
            if (typeof amount !== 'undefined') {
                equivalent = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                    value: amount,
                    currencyCode: account.currencyCode,
                    basicCurrencyRate: account.basicCurrencyRate
                }), 2).justCutted
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.ReceiptScreen.render equivalent error', e)
            }
        }

        let multiShow = false
        let multiAddress = false
        if (selectedFee && typeof selectedFee.blockchainData !== 'undefined'
            && typeof selectedFee.blockchainData.preparedInputsOutputs !== 'undefined'
            && typeof selectedFee.blockchainData.preparedInputsOutputs.multiAddress !== 'undefined'
            && selectedFee.blockchainData.preparedInputsOutputs.multiAddress
            && selectedFee.blockchainData.preparedInputsOutputs.multiAddress.length > 1
        ) {
            address = selectedFee.blockchainData.preparedInputsOutputs.multiAddress[0]
            multiShow = true
            multiAddress = selectedFee.blockchainData.preparedInputsOutputs.multiAddress
        }
        let memoTitle = strings('send.xrp_memo')
        if (account.currencyCode === 'XMR') {
            memoTitle = strings('send.xmr_memo')
        } else if (isFioRequest) {
            memoTitle = strings('send.fio_memo')
        }


        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    leftParams={{"close": false}}
                    rightType='close'
                    rightAction={this.closeAction}
                    rightParams={{"close": true}}
                    title={strings('send.receiptScreen.title')}
                    setHeaderHeight={this.setHeaderHeight}
                    setStatusBar={() => StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')}
                />
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
                        paddingBottom: GRID_SIZE * 2
                    }}
                    style={{ marginTop: headerHeight }}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{...styles.title, color: colors.sendScreen.amount }}>{strings('send.receiptScreen.totalSend')}</Text>
                            <Text style={{ ...styles.value, color: color }}>{`${amount} ${currencySymbol}`}</Text>
                            {
                                sendScreenData.uiProviderType !== 'TRADE_SEND' ?
                                    <LetterSpacing
                                        text={`${basicCurrencySymbol} ${equivalent}`}
                                        numberOfLines={1}
                                        textStyle={{...styles.notEquivalent, color: '#999999' }}
                                        letterSpacing={1} />

                                    : null
                            }
                            <View style={{...styles.line, borderBottomColor: colors.sendScreen.colorLine }} />
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <CheckData
                                name={strings('send.receiptScreen.rate', { currencyCode: currencySymbol })}
                                value={`${account.basicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(account.basicCurrencyRate).cutted}`}
                            />
                            {sendScreenData.transactionReplaceByFee ?
                                <CheckData
                                    name={strings('send.receiptScreen.replaceTransactionHash')}
                                    value={BlocksoftPrettyStrings.makeCut(sendScreenData.transactionReplaceByFee, 6)}
                                />
                                : null}
                            {sendScreenData.transactionRemoveByFee ?
                                <CheckData
                                    name={strings('send.receiptScreen.removeTransactionHash')}
                                    value={BlocksoftPrettyStrings.makeCut(sendScreenData.transactionRemoveByFee, 6)}
                                />
                                : null}
                            {sendScreenData.transactionSpeedUp ?
                                <CheckData
                                    name={strings('send.receiptScreen.speedUpTransactionHash')}
                                    value={BlocksoftPrettyStrings.makeCut(sendScreenData.transactionSpeedUp, 6)}
                                />
                                : null}
                            {contactName ?
                                <CheckData
                                    name={strings('send.receiptScreen.recepient')}
                                    value={BlocksoftPrettyStrings.makeCut(contactName, 6)}
                                />
                            : null}
                            {multiShow ?
                                multiAddress.map((item, index) => {
                                    return (
                                        <CheckData
                                            name={`${strings('send.receiptScreen.recepient')} ${index + 1}`}
                                            value={BlocksoftPrettyStrings.makeCut(item, 6)}
                                        />
                                    )
                                })
                                :
                                <CheckData
                                    name={strings('send.receiptScreen.destinationAddress')}
                                    value={BlocksoftPrettyStrings.makeCut(address, 6)}
                                />}

                            {memo ?
                                <CheckData
                                    name={memoTitle}
                                    value={memo}
                                /> : null
                            }

                            {this.renderMinerFee()}
                            {sendScreenData.comment ?
                                <>
                                    <View style={{ justifyContent: 'center', alignItems: 'center'  }} >
                                        <View style={{...styles.line, borderBottomColor: colors.sendScreen.colorLine }} />
                                    </View>
                                    
                                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: 24 }}> 
                                        <Text style={{...styles.name, color: colors.sendScreen.amount}}>{strings('send.setting.note')}</Text>
                                        <Text style={{...styles.valueComment, color: colors.sendScreen.amount}}>{sendScreenData.comment}</Text>
                                    </View>
                                </>
                             : null}

                            <View style={{ paddingHorizontal: GRID_SIZE, flexDirection: 'row', marginTop: 44 }}>
                                <CustomIcon name='shield' size={28} style={{ color: colors.sendScreen.amount }} />
                                <Text style={{...styles.info, color: colors.sendScreen.amount}}>{strings('send.receiptScreen.trusteeInfo')}</Text>
                            </View>
                        </View>
                    </View>
                    <TwoButtons
                        mainButton={{
                            disabled: this.disabled() || this.state.sendInProcess,
                            onPress: this.handleSend,
                            title: strings('send.receiptScreen.send'),
                            sendInProcess: sendInProcess
                        }}
                        secondaryButton={{
                            type: 'settings',
                            onPress: this.openAdvancedSettings
                        }}
                    />
                </ScrollView>
            </View>
        )

    }
}

ReceiptScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null)(ReceiptScreen)

const styles = {
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 18,
        lineHeight: 24
    },
    value: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
        lineHeight: 24,
        paddingBottom: 4,
        paddingTop: 8
    },
    notEquivalent: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    line: {
        borderBottomWidth: 1,
        height: 24,
        width: '70%'
    },
    info: {
        paddingHorizontal: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'left'
    },
    name: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        fontHeight: 18,
        letterSpacing: 0.5
    },
    valueComment: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        fontHeight: 14,
        letterSpacing: 1,
        marginTop: 1
    },
}