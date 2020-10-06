/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableOpacity, Keyboard, ScrollView, SafeAreaView } from 'react-native'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftTransfer from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import transactionActions from '../../appstores/Actions/TransactionActions'
import i18n, { strings } from '../../services/i18n'
import NavStore from '../../components/navigation/NavStore'
import Log from '../../services/Log/Log'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import GradientView from '../../components/elements/GradientView'
import Cross from 'react-native-vector-icons/Entypo'
import Fee from './elements/Fee'
import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import Theme from '../../themes/Themes'

import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import {
    setLoaderStatus,
    setSelectedAccount,
    setSelectedCryptoCurrency
} from '../../appstores/Stores/Main/MainStoreActions'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import AntDesing from 'react-native-vector-icons/AntDesign'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'
import store from '../../store'
import _ from 'lodash'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'
import { recordFioObtData } from '../../../crypto/blockchains/fio/FioUtils'

let styles

class ConfirmSendScreen extends Component {

    constructor() {
        super()
        this.state = {
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
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.confirmModalStyles

        const data = this.props.navigation.getParam('confirmSendScreenParam') ? this.props.navigation.getParam('confirmSendScreenParam') : this.props.navigation.getParam('confirmWebViewParam')

        if (data.currencyCode) {
            const newData = this.getData(data)
            this.setState({
                data: newData
            })

        } else {
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
    }

    componentDidMount() {
        const fioRequestDetails = this.props.navigation.getParam('fioRequestDetails')
        if (fioRequestDetails) {
            this.setState({
                fioRequestDetails: fioRequestDetails
            })
        }
    }

    getData(data) {
        const { account, address, amount, memo, amountRaw, wallet, cryptoCurrency, useAllFunds, toTransactionJSON, type, currencyCode } = data

        const { selectedWallet } = store.getState().mainStore

        const { cryptoCurrencies } = store.getState().currencyStore
        const cryptoCurrencyNew = _.find(cryptoCurrencies, { currencyCode: currencyCode })

        const { accountList } = store.getState().accountStore
        const accountNew = accountList[selectedWallet.walletHash][currencyCode]

        const amountRawNew = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(amount)
        if (typeof amountRawNew === 'undefined') {
            Log.err('SendScreen.handleSendTransaction ' + currencyCode + ' not ok amountRaw ')
        }

        const newData = {
            memo,
            amount,
            amountRaw: amountRawNew,
            address,
            wallet: selectedWallet,
            cryptoCurrency: cryptoCurrencyNew,
            account: accountNew,
            useAllFunds,
            toTransactionJSON,
            type
        }
        return newData
    }

    componentWillUnmount() {
        this._onFocusListener.remove()
    }

    handleHide = () => {
        NavStore.goBack(null)
    }

    setParentState = (field, value) => {
        this.setState({ [field]: value })
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false) => {

        const { settingsStore } = this.props

        let fee

        try {
            fee = await this.fee.getFee()
        } catch (e) {
            return false
        }

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

        const {
            walletHash
        } = wallet
        const {
            address: addressFrom,
            derivationPath,
            accountJson,
            currencyCode,
            accountId
        } = account
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        // TODO: fix this
        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        try {
            let tx
            if (typeof transactionReplaceByFee !== 'undefined' && transactionReplaceByFee) {
                tx = await (
                    BlocksoftTransfer.setCurrencyCode(currencyCode)
                        .setWalletHash(walletHash)
                        .setDerivePath(derivationPathTmp)
                        .setAddressFrom(addressFrom)
                        .setAddressTo(addressTo)
                        .setMemo(memo)
                        .setAmount(amountRaw)
                        .setAdditional(accountJson, toTransactionJSON)
                        .setTransferAll(false)
                        .setTxHash(transactionReplaceByFee)
                        .setFee(fee)
                ).sendTx(uiErrorConfirmed)
            } else if (typeof transactionSpeedUp !== 'undefined') {
                tx = await (
                    BlocksoftTransfer.setCurrencyCode(currencyCode)
                        .setWalletHash(walletHash)
                        .setDerivePath(derivationPathTmp)
                        .setAddressFrom(addressFrom)
                        .setAddressTo(addressTo)
                        .setMemo(memo)
                        .setAmount(amountRaw)
                        .setAdditional(accountJson, toTransactionJSON)
                        .setTransferAll(false)
                        .setTxInput(transactionSpeedUp)
                        .setFee(fee)
                ).sendTx(uiErrorConfirmed)
            } else {
                tx = await (
                    BlocksoftTransfer.setCurrencyCode(currencyCode)
                        .setWalletHash(walletHash)
                        .setDerivePath(derivationPathTmp)
                        .setAddressFrom(addressFrom)
                        .setAddressTo(addressTo)
                        .setMemo(memo)
                        .setAmount(amountRaw)
                        .setAdditional(accountJson, toTransactionJSON)
                        .setTransferAll(useAllFunds)
                        .setFee(fee)
                ).sendTx(uiErrorConfirmed)
            }

            const transactionJson = { memo: '', ...toTransactionJSON }
            if (typeof tx.transactionJson !== 'undefined') {
                let key
                for (key in tx.transactionJson) {
                    transactionJson[key] = tx.transactionJson[key]
                }
            }

            if (transactionReplaceByFee) {

                const transaction = {
                    accountId: accountId,
                    transactionHash: tx.hash,
                    transactionUpdateHash: transactionReplaceByFee,
                    transactionsOtherHashes: transactionReplaceByFee,
                    transactionJson
                }

                await transactionActions.updateTransaction(transaction)

            } else {
                const transaction = {
                    currencyCode: currencyCode,
                    accountId: accountId,
                    walletHash: walletHash,
                    transactionHash: tx.hash,
                    transactionStatus: 'new',
                    addressTo: addressTo,
                    addressFrom: '',
                    addressAmount: amountRaw,
                    transactionFee: tx.transactionFee || fee.feeForTx,
                    transactionFeeCurrencyCode: tx.currencyCode || '',
                    transactionOfTrusteeWallet: 1,
                    transactionJson,
                    blockConfirmations: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    transactionDirection: 'outcome'
                }
                if (typeof tx.correctedAmountFrom !== 'undefined') {
                    transaction.addressAmount = tx.correctedAmountFrom
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
                if (typeof tx.timestamp !== 'undefined' && tx.timestamp) {
                    transaction.createdAt = new Date(tx.timestamp).toISOString()
                    transaction.updatedAt = new Date(tx.timestamp).toISOString()
                }

                const logData = {
                    walletHash: walletHash,
                    currencyCode: currencyCode,
                    transactionHash: tx.hash,
                    addressTo: addressTo,
                    addressFrom: addressFrom,
                    addressAmount: amountRaw,
                    fee: JSON.stringify(fee)
                }
                if (transactionReplaceByFee) {
                    logData.transactionReplaceByFee = transactionReplaceByFee
                }
                MarketingEvent.checkSellSendTx(logData)

                transactionActions.saveTransaction(transaction)
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
                    obtId: tx.hash
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

                if (type === 'MAIN_SCANNER') {
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
                    BlocksoftTransfer.getTransferPrecache('confirmScreenOk')

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
                Log.errorTranslate(e, 'Send.ConfirmSendScreen.handleSend', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })

                if (typeof e.needFees !== 'undefined') {
                    await this.fee.multiplyFee()
                }
            }
            this.setState({ isSendDisabled: false })
        }

        setLoaderStatus(false)
    }

    showMultiAddresses = (multiShow) => {
        let description = ''
        for (let i = 0, ic = multiShow.length; i < ic; i++) {
            description += (i + 1) + ': ' + BlocksoftPrettyStrings.makeCut(multiShow[i]) + '\n'
        }
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('send.confirmModal.multiRecipient', { total: multiShow.length }),
            description
        })
    }

    renderBottom = (feeList, extendCurrencyCode) => {

        const { isSendDisabled } = this.state

        if (feeList === null || feeList.length) {
            return (
                <View style={{
                    width: '100%',
                    position: 'relative',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    zIndex: 1
                }}>
                    <ButtonLine
                        press={() => this.handleHide()}
                        styles={styles.btn}
                        touchableOpacityStyle={styles.btn__touchableOpacity}
                        styleText={i18n.locale === 'ru-RU' ? { fontSize: 16 } : null}>
                        {strings('send.confirmModal.edit')}
                    </ButtonLine>

                    <Button
                        press={() => this.handleSend()}
                        styles={styles.btn}
                        touchableOpacityStyle={styles.btn__touchableOpacity}
                        disabled={isSendDisabled}
                        styleText={i18n.locale === 'ru-RU' ? { fontSize: 16 } : null}>
                        {strings('send.confirmModal.confirm')}
                    </Button>
                </View>
            )
        }

        Log.log('ConfirmSendScreen.renderBottom ' + extendCurrencyCode, feeList)
        return (
            <View style={{ position: 'relative', width: '100%', zIndex: 1 }}>
                <Text style={{
                    paddingHorizontal: 20,
                    textAlign: 'center',
                    paddingVertical: 10,
                    fontFamily: 'SFUIDisplay-Semibold',
                    fontSize: 14,
                    color: '#404040',
                    zIndex: 1
                }}>
                    {strings('send.errors.SERVER_RESPONSE_NOT_ENOUGH_FEE_OR_BAD_INTERNET', { symbol: extendCurrencyCode })}
                </Text>
            </View>
        )
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        const { isSendDisabled, feeList, selectedFee, selectedCustomFee } = this.state
        let { isBottomFunctionEnabled, amount, address, account, cryptoCurrency, wallet, type, transactionSpeedUp, transactionReplaceByFee } = this.state.data
        const { currencySymbol } = cryptoCurrency
        const basicCurrencySymbol = account.basicCurrencySymbol

        const equivalent = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: amount,
            currencyCode: account.currencyCode,
            basicCurrencyRate: account.basicCurrencyRate
        }), 2).justCutted
        let extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)
        extendCurrencyCode = typeof extendCurrencyCode.addressCurrencyCode === 'undefined' ? extendCurrencyCode.currencySymbol : extendCurrencyCode.addressCurrencyCode

        let multiShow = false
        if (feeList || selectedFee) {
            const lastFee = selectedFee || feeList[feeList.length - 1]
            if (lastFee) {
                if (typeof lastFee.preparedInputsOutputs !== 'undefined' && typeof lastFee.preparedInputsOutputs.multiAddress !== 'undefined' && lastFee.preparedInputsOutputs.multiAddress) {
                    address = lastFee.preparedInputsOutputs.multiAddress[0]
                    multiShow = lastFee.preparedInputsOutputs.multiAddress
                }

            }
        }

        // recheck amount to show less digits in erc-20
        amount = BlocksoftPrettyNumbers.makePretty(BlocksoftPrettyNumbers.setCurrencyCode(account.currencyCode).makeUnPretty(amount))


        let titleMsg = ''
        if (typeof transactionReplaceByFee !== 'undefined' && transactionReplaceByFee) {
            titleMsg = strings('send.confirmModal.titleReplaceByFee', {hash : BlocksoftPrettyStrings.makeCut(transactionReplaceByFee)})
        } else if (typeof transactionSpeedUp !== 'undefined') {
            titleMsg = strings('send.confirmModal.titleSpeedUp', {hash : BlocksoftPrettyStrings.makeCut(transactionSpeedUp)})
        } else {
            titleMsg = strings('send.confirmModal.title')
        }

        return (
            <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                <View style={styles.wrapper}>
                    <SafeAreaView style={{ flex: 0, backgroundColor: '#7127ab' }}/>
                    <SafeAreaView style={{ flex: 1, position: 'relative', backgroundColor: '#fff' }}>
                        <View style={{
                            position: 'absolute',
                            width: '100%',
                            top: 0,
                            left: 0,
                            height: 1000,
                            backgroundColor: '#7127ab'
                        }}/>
                        <KeyboardAwareView>
                            <ScrollView showsVerticalScrollIndicator={false}
                                        contentContainerStyle={styles.wrapper__content}>
                                <View style={styles.top}>
                                    <Text style={styles.title}>
                                        {titleMsg}
                                    </Text>
                                </View>
                                <View style={styles.box}>
                                    <View style={styles.content__text}>
                                        <Text style={styles.content__text_first}>
                                            {
                                                // @misha
                                                typeof amount.split('.')[1] !== 'undefined' ? amount.split('.')[0] + '.' : amount.split('.')[0]
                                            }
                                        </Text>
                                        <Text style={styles.content__text_last}>
                                            {
                                                typeof amount.split('.')[1] !== 'undefined' ? amount.split('.')[1].slice(0, 7) + ' ' + currencySymbol : ' ' + currencySymbol
                                            }
                                        </Text>
                                    </View>
                                    {
                                        type !== 'TRADE_SEND' ?
                                            <Text style={styles.content__subtext}>
                                                {basicCurrencySymbol} {equivalent}
                                            </Text> : null
                                    }
                                    <View style={styles.box__line}></View>
                                </View>
                                <View style={styles.description}>
                                    <View style={styles.description__item}>
                                        <Text style={styles.description__text}>
                                            {strings('send.confirmModal.recipient')}
                                        </Text>
                                        {
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
                                                                           color="#f4f4f4"/>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                )
                                                : (
                                                    <Text style={styles.description__text}>
                                                        {BlocksoftPrettyStrings.makeCut(address, 10)}
                                                    </Text>
                                                )
                                        }
                                    </View>
                                </View>

                                <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                                    <Cross name={'cross'} size={30} color={'#fff'}/>
                                </TouchableOpacity>
                                <Fee
                                    ref={ref => this.fee = ref}
                                    cryptoCurrency={cryptoCurrency}
                                    account={account}
                                    transfer={{ amount, address }}
                                    wallet={wallet}
                                    sendData={this.state.data}
                                    setParentState={this.setParentState}
                                />
                            </ScrollView>
                            <View style={styles.bottom}>
                                {this.renderBottom(feeList, extendCurrencyCode)}
                                <View style={{
                                    position: 'absolute',
                                    width: '100%',
                                    top: 0,
                                    left: 0,
                                    height: 1000,
                                    backgroundColor: '#fff',
                                    zIndex: 0
                                }}/>
                            </View>
                        </KeyboardAwareView>
                    </SafeAreaView>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        sendStore: state.sendStore,
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null)(ConfirmSendScreen)

const styles_ = {
    array: ['#7127ab', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}
