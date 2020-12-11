/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text } from 'react-native'

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
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

let CACHE_WARNING_AMOUNT = ''
let CACHE_IS_SENDING = false
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
            needPasswordConfirm: false
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


    init = async () => {
        console.log('')
        console.log('')
        const sendScreenData = SendTmpData.getData()
        console.log('Send.ReceiptScreen.init', JSON.parse(JSON.stringify(sendScreenData)))

        const { account, cryptoCurrency, wallet } = SendActions.findWalletPlus(sendScreenData.currencyCode)

        let selectedFee = false // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee
        if (!selectedFee) {
            let tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
            if (!selectedFee) {
                tmp = SendActions.countFees(sendScreenData)
                selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
            }
            sendScreenData.selectedFee = selectedFee
        }

        this.setState(
            {
                sendScreenData,
                account,
                cryptoCurrency,
                wallet,
                useAllFunds: sendScreenData.isTransferAll,
                init: true
            }, () => {

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

        // console.log('Send.ReceiptScreen.handleSend state', JSON.parse(JSON.stringify(this.state)))

        const { settingsStore } = this.props

        const { needPasswordConfirm } = this.state

        if (needPasswordConfirm && passwordCheck && typeof settingsStore.data.askPinCodeWhenSending !== 'undefined' && +settingsStore.data.askPinCodeWhenSending) {
            lockScreenAction.setFlowType({ flowType: 'CONFIRM_SEND_CRYPTO' })
            lockScreenAction.setActionCallback({ actionCallback: this.handleSend })
            NavStore.goNext('LockScreen')
            return
        }

        if (CACHE_IS_SENDING) {
            console.log('CACHE_IS_SENDING', CACHE_IS_SENDING)
        }
        CACHE_IS_SENDING = true

        const { account, wallet, sendScreenData } = this.state

        let selectedFee = typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee : false
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        if (typeof selectedFee !== 'undefined' && selectedFee && typeof selectedFee.amountForTx !== 'undefined') {
            const newAmount = selectedFee.amountForTx.toString()
            const tmp = sendScreenData.amountRaw.toString()
            if (newAmount.substring(0, tmp.length) !== tmp) {
                sendScreenData.amountRaw = newAmount
                if (CACHE_WARNING_AMOUNT !== sendScreenData.amountRaw) {
                    // @yura here should be alert when fixed receipt and no tx
                    showModal({
                        type: 'INFO_MODAL',
                        icon: true,
                        title: strings('modal.titles.attention'),
                        description: strings('modal.send.feeChangeAmount')
                    })
                    CACHE_WARNING_AMOUNT = sendScreenData.amountRaw
                    return false
                }
            }
        }

        // also will go to actions lates
        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee } = wallet
        const { address, derivationPath,  accountJson, currencyCode, accountId } = account
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)


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
                toTransactionJSON: sendScreenData.toTransactionJSON,
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
            if (typeof selectedFee !== 'undefined' && selectedFee) {
                if (typeof selectedFee.amountForTx !== 'undefined') {
                    txData.amount = selectedFee.amountForTx
                }
                if (typeof selectedFee.addressToTx !== 'undefined') {
                    txData.addressTo = selectedFee.addressToTx
                }
            }
            console.log('txData', txData)
            const tx = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed, selectedFee })

            const transactionJson = { memo, comment, ...sendScreenData.toTransactionJSON }
            if (typeof tx.transactionJson !== 'undefined') {
                let key
                for (key in tx.transactionJson) {
                    transactionJson[key] = tx.transactionJson[key]
                }
            }

            const now = new Date().toISOString()
            const transactionReplaceByFee = false
            if (transactionReplaceByFee) {
                const transaction = {
                    currencyCode,
                    accountId,
                    addressAmount: tx.amountForTx,
                    addressTo: tx.addressTo,
                    transactionHash: tx.transactionHash,
                    transactionStatus: 'new',
                    transactionUpdateHash: transactionReplaceByFee,
                    transactionsOtherHashes: transactionReplaceByFee,
                    transactionJson,
                    transactionsScanLog: now + ' RBFed '
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
                    transactionsScanLog: now + ' CREATED'
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
                if (transactionReplaceByFee) {
                    logData.transactionReplaceByFee = transactionReplaceByFee
                }
                //if (transactionSpeedUp) {
                //    logData.transactionSpeedUp = transactionSpeedUp
                //}
                if (typeof transactionJson !== 'undefined' && transactionJson && typeof transactionJson.bseOrderID !== 'undefined' && transactionJson.bseOrderID) {
                    transaction.bse_order_id = transactionJson.bseOrderID
                    transaction.bse_order_id_out = transactionJson.bseOrderID
                    logData.bseOrderID = transactionJson.bseOrderID.toString()
                }

                const line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                await transactionActions.saveTransaction(transaction, line + ' HANDLE SEND ')
            }

            /*
            if (fioRequestDetails) {
                await recordFioObtData({
                    fioRequestId: fioRequestDetails.fio_request_id,
                    payerFioAddress: fioRequestDetails.payer_fio_address,
                    payeeFioAddress: fioRequestDetails.payee_fio_address,
                    payerTokenPublicAddress: addressFrom,
                    payeeTokenPublicAddress: addressTo,
                    amount: amountRaw,
                    chainCode: currencyCode,
                    tokenCode: currencyCode,
                    obtId: tx.hash,
                    memo: fioRequestDetails.memo
                })
            }
            */
            hideModal()

            let successMessage = strings('modal.send.txSuccess')
            if (typeof tx.successMessage !== 'undefined') {
                successMessage = tx.successMessage
            }
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: successMessage
            }, () => {

                const { uiType } = this.state.sendScreenData

                // @yura to finish all that needed
                //     NavStore.goNext('TransactionScreen', {
                //         transaction: {}
                //     })
                if (uiType === 'MAIN_SCANNER') {
                    NavStore.reset('DashboardStack')
                } else if (uiType === 'SEND_SCANNER') {
                    NavStore.goNext('AccountScreen')
                } else if (uiType === 'TRADE_SEND') {
                    NavStore.goNext('FinishScreen', {
                        finishScreenParam: {
                            selectedCryptoCurrency: this.state.cryptoCurrency
                        }
                    })
                } else {
                    if (transactionReplaceByFee) {
                        NavStore.goBack(null)
                    } else {
                        NavStore.goBack(null)
                        NavStore.goBack(null)
                    }
                }
            })

        } catch (e) {

            Keyboard.dismiss()

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
                Log.errorTranslate(e, 'Send.ConfirmSendScreen.handleSend', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            }
            CACHE_IS_SENDING = false
        }


    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        firebase.analytics().setCurrentScreen('Send.ReceiptScreen')

        const { colors, GRID_SIZE } = this.context

        const { headerHeight, sendScreenData, cryptoCurrency, account } = this.state

        console.log('Send.ReceiptScreen.render data', JSON.parse(JSON.stringify(sendScreenData)))

        if (typeof account === 'undefined' || typeof account.basicCurrencySymbol === 'undefined') {
            return <View><Text></Text></View>
        }
        let selectedFee = typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee : false
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        let amount = sendScreenData.amountPretty
        let address = sendScreenData.addressTo || ''
        let memo = sendScreenData.memo || ''
        if (typeof selectedFee !== 'undefined' && selectedFee) {
            if (typeof selectedFee !== 'undefined' && selectedFee && typeof selectedFee.amountForTx !== 'undefined') {
                const newAmount = BlocksoftPrettyNumbers.setCurrencyCode(cryptoCurrency.currencyCode).makePretty(selectedFee.amountForTx)
                if (typeof amount === 'undefined') {
                    amount = newAmount
                } else {
                    const tmp = amount.toString()
                    if (newAmount.toString().substring(0, tmp.length) !== tmp) {
                        amount = newAmount
                        if (CACHE_WARNING_AMOUNT !== amount) {
                            // @yura here should be alert when fixed receipt
                            showModal({
                                type: 'INFO_MODAL',
                                icon: true,
                                title: strings('modal.titles.attention'),
                                description: strings('modal.send.feeChangeAmount')
                            })
                        }
                        CACHE_WARNING_AMOUNT = amount
                    }
                }
                // console.log('Send.ReceiptScreen amountFromFee ' + amount)
            }
            if (typeof selectedFee.addressToTx !== 'undefined') {
                address = selectedFee.addressToTx
                // console.log('Send.ReceiptScreen addressToTx ' + address)
            }
        }
        console.log(amount)

        const currencySymbol = typeof cryptoCurrency !== 'undefined' && cryptoCurrency.currencySymbol ? cryptoCurrency.currencySymbol : ''
        const basicCurrencySymbol = account.basicCurrencySymbol

        const dict = new UIDict(account.currencyCode)
        const color = dict.settings.colors.mainColor

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
        if (typeof multiAddress !== 'undefined' && multiAddress) {
            address = multiAddress[0]
            multiShow = multiAddress
        }
        let memoTitle = strings('send.receiptScreen.destinationTag')
        if (account.currencyCode === 'XMR') {
            memoTitle = strings('send.receiptScreen.paymentId')
        }


        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType='close'
                    rightAction={this.closeAction}
                    title={strings('send.receiptScreen.title')}
                    setHeaderHeight={this.setHeaderHeight}
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
                            <Text style={styles.title}>{strings('send.receiptScreen.totalSend')}</Text>
                            <Text style={{ ...styles.value, color: color }}>{`${amount} ${currencySymbol}`}</Text>
                            {
                                sendScreenData.uiProviderType !== 'TRADE_SEND' ?
                                    <LetterSpacing
                                        text={`${basicCurrencySymbol} ${equivalent}`}
                                        numberOfLines={1}
                                        textStyle={styles.notEquivalent}
                                        letterSpacing={1} />

                                    : null
                            }
                            <View style={styles.line} />
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <CheckData
                                name={strings('send.receiptScreen.rate', { currencyCode: currencySymbol })}
                                value={`${account.basicCurrencySymbol} ${account.basicCurrencyRate}`}
                            />
                            {multiShow ?
                                multiShow.map((item, index) => {
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

                            <View style={{ paddingHorizontal: GRID_SIZE, flexDirection: 'row', marginTop: 44 }}>
                                <CustomIcon name='shield' size={28} style={{ color: '#5C5C5C' }} />
                                <Text style={styles.info}>{strings('send.receiptScreen.trusteeInfo')}</Text>
                            </View>
                        </View>
                    </View>
                    <TwoButtons
                        mainButton={{
                            onPress: this.handleSend,
                            title: strings('send.receiptScreen.send')
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
        sendStore: state.sendStore,
        mainStore: state.mainStore,
        wallet: state.mainStore.selectedWallet,
        account: state.mainStore.selectedAccount,
        exchangeStore: state.exchangeStore,
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
        lineHeight: 24,
        color: '#5C5C5C'
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
        lineHeight: 18,

        color: '#999999'
    },
    line: {
        borderBottomWidth: 1,
        borderBottomColor: '#DADADA',
        height: 24,
        width: '70%'
    },
    info: {
        paddingHorizontal: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        color: '#5C5C5C',
        letterSpacing: 1,
        textAlign: 'left'
    }
}