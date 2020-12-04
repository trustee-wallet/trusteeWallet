/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'


import TextView from '../../components/elements/Text'
import AddressInput from '../../components/elements/Input'
import AmountInput from './elements/Input'
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
import { getAccountFioName, getPubAddress, isFioAddressRegistered, isFioAddressValid, resolveChainCode } from '../../../crypto/blockchains/fio/FioUtils'

import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'
import PartBalanceButton from './elements/partBalanceButton'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import store from '../../store'
import _ from 'lodash'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'

import UIDict from '../../services/UIDict/UIDict'

import CheckData from './elements/CheckData'
import { handleFee } from '../../appstores/Stores/Send/SendActions'

class ReceiptScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            isSendDisabled: false,
            data: {},
            feeList: null,
            selectedFee: false,
            selectedCustomFee: false,
            needPasswordConfirm: false,
            fioRequestDetails: null
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        const data = this.props.navigation.getParam('ReceiptScreen') ? this.props.navigation.getParam('ReceiptScreen') : this.props.navigation.getParam('ReceiptScreen')

        if (data.currencyCode) {
            const newData = this.getData(data)
            this.setState({
                data: newData
            })

            if (newData.countedFees === 'undefined') {
                this.handleGetFee(newData.amount)
            }

        } else {
            if (typeof data.walletUseUnconfirmed === 'undefined') {
                const { selectedWallet } = store.getState().mainStore
                if (typeof data.wallet.walletHash !== 'undefined' && data.wallet.walletHash) {
                    data.wallet = { ...selectedWallet, walletHash: data.wallet.walletHash }
                } else {
                    data.wallet = { ...selectedWallet }
                }
            }
            this.setState({
                data
            })
        }

        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {

            const settings = this.props.settingsStore.data

            if (+settings.lock_screen_status) {
                this.setState({
                    needPasswordConfirm: true
                })
            }
        })

        if (data.countedFees === 'undefined') {
            this.handleGetFee(data.amount)
        }

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

    handleGetFee = async (value) => {

        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee, walletUseLegacy, walletIsHd } = this.props.wallet

        const { address, derivationPath, currencyCode, balance, unconfirmed, accountJson } = this.props.account

        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            Log.log(`SendScreen.handleGetFee balance ${currencyCode} ${address} data ${balance} + ${unconfirmed}`)

            let addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })

            // const addressValidate = handleInput ? await this.addressInput.handleValidate() : { status: 'fail' }

            // if (addressValidate.status === 'success') {
            //     addressToForTransferAll = addressValidate.value
            // }

            Log.log(`SendScreen.handleTransferAll balance ${currencyCode} ${address} addressToForTransferAll`, addressToForTransferAll)

            const countedFeesData = {
                currencyCode,
                walletHash,
                derivationPath,
                addressFrom: address,
                addressTo: addressToForTransferAll,

                amount: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(value),
                balance: balance,
                unconfirmed: walletUseUnconfirmed === 1 ? unconfirmed : 0,

                isTransferAll: false,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                useLegacy: walletUseLegacy,
                isHd: walletIsHd,

                accountJson
            }

            const transferCount = await BlocksoftTransfer.getFeeRate(countedFeesData)
            transferCount.feesCountedForData = countedFeesData

            const selectedFee = transferCount.fees[transferCount.selectedFeeIndex]
            handleFee(transferCount, selectedFee)

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferCount.feesCountedForData.amount)

            this.setState({
                data: {
                    ...this.state.data,
                    countedFees: transferCount
                }
            })

        } catch (e) {
            console.log(e)
        }
    }


    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    closeAction = () => {
        // const { toTransactionJSON } = this.props.send.data

        // if (typeof toTransactionJSON !== 'undefined' && typeof toTransactionJSON.bseOrderID !== 'undefined') {
        //     api.setExchangeStatus(toTransactionJSON.bseOrderID, 'close')
        // }

        NavStore.goBack()
    }

    openAdvancedSettings = () => {
        NavStore.goNext('SendAdvancedScreen', {
            fee: {
                countedFees: this.state.data.countedFees,
                selectedFee: {}
            }
        })
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false) => {

        const { settingsStore } = this.props

        let selectedFee = this.state.data.countedFees.fees[this.state.data.countedFees.selectedFeeIndex]

        if (typeof selectedFee === 'undefined' || !selectedFee) {
            return false
        }

        // try {
        //     selectedFee = await this.fee.getFee()
        // } catch (e) {
        //     if (config.debug.appErrors) {
        //         console.log('ConfirmSendScreen.handleSend', e)
        //     }
        //     return false
        // }

        const {
            needPasswordConfirm,
            fioRequestDetails,
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
                    memo: fioRequestDetails.memo,
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

        setLoaderStatus(false)
    }

    minerFee = (countedFees) => {
        let fee

        if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            fee = countedFees.fees[countedFees.selectedFeeIndex]
        }

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account

        let prettyFee
        let prettyFeeSymbol = feesCurrencySymbol
        let feeBasicCurrencySymbol = basicCurrencySymbol
        let feeBasicAmount = 0

        if (typeof fee.feeForTxDelegated !== 'undefined') {
            prettyFeeSymbol = currencySymbol
            prettyFee = fee.feeForTxCurrencyAmount
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(fee.feeForTxBasicAmount, 5).justCutted
            feeBasicCurrencySymbol = fee.feeForTxBasicSymbol
        } else {
            prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(fee.feeForTx)
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                value: prettyFee,
                currencyCode: feesCurrencyCode,
                basicCurrencyRate: feeRates.basicCurrencyRate
            }), 5).justCutted
            prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted
        }

        let fiatFee
        if (Number(feeBasicAmount) < 0.01) {
            fiatFee = `> ${feeBasicCurrencySymbol} 0.01`
        } else {
            fiatFee = `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        }

        // `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        return (
            <CheckData
                name={'Miner fee'}
                value={`${prettyFee} ${prettyFeeSymbol}`}
                subvalue={fiatFee}
            />
        )
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()

        const { colors, GRID_SIZE } = this.context

        const {
            headerHeight
        } = this.state

        let { isBottomFunctionEnabled, amount, address, account, cryptoCurrency, wallet, type, transactionSpeedUp, transactionReplaceByFee, multiAddress } = this.state.data

        const { currencySymbol } = cryptoCurrency
        const basicCurrencySymbol = account.basicCurrencySymbol

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        const equivalent = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: amount,
            currencyCode: account.currencyCode,
            basicCurrencyRate: account.basicCurrencyRate
        }), 2).justCutted
        let extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)
        extendCurrencyCode = typeof extendCurrencyCode.addressCurrencyCode === 'undefined' ? extendCurrencyCode.currencySymbol : extendCurrencyCode.addressCurrencyCode

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
                    title={strings('send.setting.title')}
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
                            <Text style={styles.title}>{'Total send:'}</Text>
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
                                name={'@ rate per 1 BTC'}
                                value={`${account.basicCurrencySymbol} ${account.basicCurrencyRate}`}
                            />
                            <CheckData
                                name={'Destination address'}
                                value={BlocksoftPrettyStrings.makeCut(address, 6)}
                            />
                            {this.state.data.countedFees && this.minerFee(this.state.data.countedFees)}
                        </View>
                        {/* {
                            multiShow
                                ?
                                (
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            height: 30,
                                            paddingLeft: 0,
                                            justifyContent: 'center'
                                        }}
                                        onPress={() => this.showMultiAddresses(multiShow)}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text
                                                style={styles.description__text}>{strings('send.confirmModal.multiRecipient', { total: multiShow.length })}</Text>
                                            <View style={{ marginLeft: 5, marginBottom: 0 }}>
                                                <AntDesing name={'caretdown'} size={13}
                                                    color="#f4f4f4" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                                : (
                                    <Text style={styles.description__text}>
                                        {BlocksoftPrettyStrings.makeCut(address, 10)}
                                    </Text>
                                )
                        } */}
                    </View>
                    <TwoButtons
                        mainButton={{
                            onPress: () => this.handleSend(),
                            title: strings('walletBackup.step0Screen.next')
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
    }
}