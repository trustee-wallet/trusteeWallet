/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text } from 'react-native'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

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

import store from '../../store'
import _ from 'lodash'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'

import UIDict from '../../services/UIDict/UIDict'

import CheckData from './elements/CheckData'
import CustomIcon from '../../components/elements/CustomIcon'
import SendBasicScreenScreen from './SendBasicScreen'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import transactionActions from '../../appstores/Actions/TransactionActions'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import { recordFioObtData } from '../../../crypto/blockchains/fio/FioUtils'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'

import config from '../../config/config'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'

class ReceiptScreen extends SendBasicScreenScreen {
    constructor(props) {
        super(props)
        this.state = {
            init: false,
            headerHeight: 0,
            isSendDisabled: false,
            data: {},
            countedFees: null,
            selectedFee: false,
            needPasswordConfirm: false,
            fioRequestDetails: null
        }
    }

    componentDidMount() {
        // when usual open (moved from unsafe)
        this.init()
    }


    init = async () => {
        console.log('')
        console.log('')
        console.log('Send.ReceiptScreen.init')
        const data = this.props.navigation.getParam('ReceiptScreen')


        let newData, countedFees, selectedFee
        if (data.currencyCode && (typeof data.account === 'undefined' || !data.account)) {
            console.log('Send.ReceiptScreen.init data1', JSON.parse(JSON.stringify(data)))
            newData = this.getData(data)
            console.log('Send.ReceiptScreen.init newData1', JSON.parse(JSON.stringify(newData)))

        } else {
            console.log('Send.ReceiptScreen.init data2', JSON.parse(JSON.stringify(data)))
            if (typeof data.walletUseUnconfirmed === 'undefined') {
                const { selectedWallet } = store.getState().mainStore
                if (typeof data.wallet.walletHash !== 'undefined' && data.wallet.walletHash) {
                    data.wallet = { ...selectedWallet, walletHash: data.wallet.walletHash }
                } else {
                    data.wallet = { ...selectedWallet }
                }
            }
            console.log('Send.ReceiptScreen.init newData2', JSON.parse(JSON.stringify(data)))
            newData = data
        }
        let toCount = true
        if (typeof data.countedFees !== 'undefined') {
            countedFees = data.countedFees
            toCount = false
        }
        if (typeof data.selectedFee !== 'undefined') {
            selectedFee = data.selectedFee
            toCount = false
        }

        // was loaded without fees (direct sell etc)
        if (toCount) {
            try {
                console.log('Send.ReceiptScreen.init toCount fees')

                const {
                    amountRaw,
                    address: addressTo,
                    useAllFunds,
                    memo,
                    toTransactionJSON,
                    transactionSpeedUp,
                    transactionReplaceByFee
                } = data

                const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee } = data.wallet
                const {
                    address: addressFrom,
                    derivationPath,
                    accountJson,
                    currencyCode
                } = data.account

                const txData = {
                    currencyCode,
                    walletHash,
                    derivationPath: derivationPath,
                    addressFrom: addressFrom,
                    addressTo: addressTo,
                    amount: amountRaw,
                    isTransferAll: useAllFunds,
                    useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                    allowReplaceByFee: walletAllowReplaceByFee === 1,
                    transactionReplaceByFee,
                    transactionSpeedUp,
                    memo,
                    accountJson,
                    transactionJson: toTransactionJSON
                }
                countedFees = await BlocksoftTransfer.getFeeRate(txData)
                countedFees.feesCountedForData = txData
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]

                console.log('Send.ReceiptScreen.init toCount fees result ', JSON.parse(JSON.stringify(countedFees)))
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log('Send.ReceiptScreen.init', e)
                }
                Log.errorTranslate(e, 'Send.ReceiptScreen.init', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

                Keyboard.dismiss()

                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.qrScanner.sorry'),
                    description: e.message,
                    error: e
                })
            }
        }

        this.setState({
            data: newData,
            countedFees,
            selectedFee,
            init: true
        })

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

    getData(data) {
        const { address, amount, memo, useAllFunds, toTransactionJSON, type, currencyCode, countedFees } = data

        const { selectedWallet } = store.getState().mainStore

        const { cryptoCurrencies } = store.getState().currencyStore
        const cryptoCurrencyNew = _.find(cryptoCurrencies, { currencyCode: currencyCode })

        const { accountList } = store.getState().accountStore
        const account = accountList[selectedWallet.walletHash][currencyCode]

        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(amount)
        if (typeof amountRaw === 'undefined') {
            Log.err('SendScreen.handleSendTransaction ' + currencyCode + ' not ok amountRaw ')
        }

        const newData = {
            memo,
            amount,
            amountRaw,
            address,
            wallet: selectedWallet,
            cryptoCurrency: cryptoCurrencyNew,
            account,
            useAllFunds,
            toTransactionJSON,
            type,
            countedFees
        }
        return newData
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false) => {

        console.log('Send.ReceiptScreen.handleSend state', JSON.parse(JSON.stringify(this.state)))

        const { settingsStore } = this.props

        const {
            needPasswordConfirm,
            fioRequestDetails,
            selectedFee
        } = this.state

        if (needPasswordConfirm && passwordCheck && typeof settingsStore.data.askPinCodeWhenSending !== 'undefined' && +settingsStore.data.askPinCodeWhenSending) {
            lockScreenAction.setFlowType({ flowType: 'CONFIRM_SEND_CRYPTO' })
            lockScreenAction.setActionCallback({ actionCallback: this.handleSend })
            NavStore.goNext('LockScreen')
            return
        }

        this.setState({ isSendDisabled: true })

        const {
            amountRaw,
            address: addressTo,
            account,
            wallet,
            useAllFunds,
            memo,
            toTransactionJSON,
            transactionSpeedUp,
            transactionReplaceByFee
        } = this.state.data

        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee } = wallet
        const {
            address: addressFrom,
            derivationPath,
            accountJson,
            currencyCode,
            accountId
        } = account
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)


        try {
            const txData = {
                currencyCode,
                walletHash,
                derivationPath: derivationPath,
                addressFrom: addressFrom,
                addressTo: addressTo,
                amount: amountRaw,
                isTransferAll: useAllFunds,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                transactionReplaceByFee,
                transactionSpeedUp,
                memo,
                accountJson,
                transactionJson: toTransactionJSON
            }
            const tx = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed, selectedFee })

            const transactionJson = { memo: '', ...toTransactionJSON }
            if (typeof tx.transactionJson !== 'undefined') {
                let key
                for (key in tx.transactionJson) {
                    transactionJson[key] = tx.transactionJson[key]
                }
            }

            const now = new Date().toISOString()
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
                    addressTo: addressTo,
                    addressFrom: '',
                    addressFromBasic: addressFrom.toLowerCase(),
                    addressAmount: amountRaw,
                    transactionFee: tx.transactionFee,
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
                if (transaction.addressTo === addressFrom) {
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
                    addressTo: addressTo,
                    addressFrom: addressFrom,
                    addressAmount: amountRaw,
                    fee: JSON.stringify(selectedFee)
                }
                if (transactionReplaceByFee) {
                    logData.transactionReplaceByFee = transactionReplaceByFee
                }
                if (transactionSpeedUp) {
                    logData.transactionSpeedUp = transactionSpeedUp
                }
                MarketingEvent.checkSellSendTx(logData)

                const line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                await transactionActions.saveTransaction(transaction, line + ' HANDLE SEND ')
            }

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

                const { type } = this.props.sendStore.data

                // @yura to finish all that needed
                //     NavStore.goNext('TransactionScreen', {
                //         transaction: {}
                //     })
                if (type === 'MAIN_SCANNER' || fioRequestDetails) {
                    NavStore.goNext('DashboardStack')
                } else if (type === 'SEND_SCANNER') {
                    NavStore.goNext('AccountScreen')
                } else if (type === 'TRADE_SEND') {
                    NavStore.goNext('FinishScreen', {
                        finishScreenParam: {
                            selectedCryptoCurrency: this.props.sendStore.data.cryptoCurrency
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

            if (e.message.indexOf('UI_') === 0) {
                Log.log('Send.ConfirmSendScreen.handleSend protection ' + e.message)

                this.setState({ isSendDisabled: false })

                const allData = this.state.data

                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('send.confirmModal.title'),
                    description: strings('send.errors.' + e.message)
                }, async () => {
                    if (typeof e.newAmount !== 'undefined') {
                        allData.amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(e.newAmount)
                        this.setState({ amountRaw: e.newAmount, data: allData })
                        await this.fee.changeAmountRaw(e.newAmount)
                    } else {
                        this.handleSend(passwordCheck, e.message)
                    }
                })

            } else {
                if (config.debug.appErrors) {
                    console.log('Send.ConfirmSendScreen.handleSend error', e)
                }
                Log.errorTranslate(e, 'Send.ConfirmSendScreen.handleSend', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            }
            this.setState({ isSendDisabled: false })
        }


    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        firebase.analytics().setCurrentScreen('Send.ReceiptScreen')

        const { colors, GRID_SIZE } = this.context

        const {
            headerHeight
        } = this.state

        let { amount, address, account, cryptoCurrency, type, multiAddress } = this.state.data

        console.log('Send.ReceiptScreen.render data', JSON.parse(JSON.stringify(this.state.data)))
        if (typeof account === 'undefined' || typeof account.basicCurrencySymbol === 'undefined') {
            return <View><Text>Loading</Text></View>
        }


        const currencySymbol = cryptoCurrency.currencySymbol
        const basicCurrencySymbol = account.basicCurrencySymbol

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        const equivalent = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: amount,
            currencyCode: account.currencyCode,
            basicCurrencyRate: account.basicCurrencyRate
        }), 2).justCutted

        let multiShow = false
        if (typeof multiAddress !== 'undefined' && multiAddress) {
            address = multiAddress[0]
            multiShow = multiAddress
        }


        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType="close"
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
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}
                    style={{ marginTop: headerHeight }}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} >
                            <Text style={styles.title}>{strings('send.receiptScreen.totalSend')}</Text>
                            <Text style={{ ...styles.value, color: color }} >{`${amount} ${currencySymbol}`}</Text>
                            {
                                type !== 'TRADE_SEND' ?
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
                                name={strings('send.receiptScreen.rate', {currencyCode: currencySymbol})}
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

                            {this.renderMinerFee()}

                            <View style={{ paddingHorizontal: GRID_SIZE, flexDirection: 'row', marginTop: 44 }}>
                                <CustomIcon name="shield" size={28} style={{ color: '#5C5C5C' }} />
                                <Text style={styles.info}>{strings('send.receiptScreen.trusteeInfo')}</Text>
                            </View>
                        </View>
                    </View>
                    <TwoButtons
                        mainButton={{
                            onPress: () => this.handleSend(),
                            title: strings('send.receiptScreen.send')
                        }}
                        secondaryButton={{
                            type: 'settings',
                            onPress: this.openAdvancedSettings,
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
        color: '#5C5C5C',
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
        width: '70%',
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