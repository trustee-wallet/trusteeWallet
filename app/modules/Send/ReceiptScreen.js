/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { View, ScrollView, Text, StatusBar, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import { setLoaderFromBse, setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import LetterSpacing from '@app/components/elements/LetterSpacing'

import UIDict from '@app/services/UIDict/UIDict'


import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'

import ReceiptData from '@app/modules/Send/receipt/ReceiptData'

import Log from '@app/services/Log/Log'
import config from '@app/config/config'

import { showSendError, checkLoadedFee } from './receipt/helpers'
import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'
import { SendActionsEnd } from '@app/appstores/Stores/Send/SendActionsEnd'
import  { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import TransactionItem from '@app/modules/Account/AccountTransaction/elements/TransactionItem'

import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'

let CACHE_IS_COUNTING = false
let CACHE_IS_SENDING_CLICKED = 0
let CACHE_IS_SENDING = false
let CACHE_WARNING_NOTICE = false

class ReceiptScreen extends PureComponent {

    constructor(props) {
        super(props)

        this.state = {
            needPasswordConfirm: true,
            sendInProcess: false,
            checkedCryptoValue : false
        }
    }

    componentDidMount = () => {
        CACHE_IS_SENDING = false
        CACHE_IS_SENDING_CLICKED = 0
        setLoaderStatus(false)
        setLoaderFromBse(false)
    }

    openAdvancedSettings = async () => {
        const { uiType } = this.props.sendScreenStore.ui

        if (CACHE_IS_COUNTING) {
            return true
        }
        setLoaderStatus(true)
        CACHE_IS_COUNTING = true

        try {
            await SendActionsBlockchainWrapper.getFeeRate()
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
            if (uiType === 'TRADE_SEND' || uiType === 'TRADE_LIKE_WALLET_CONNECT') {
                NavStore.goNext('MarketAdvancedScreen')
            } else {
                NavStore.goNext('SendAdvancedScreen')
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            }
            Log.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
        }
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false, newCryptoValue = false) => {
        if (CACHE_IS_SENDING && passwordCheck && CACHE_IS_SENDING_CLICKED < 10) {
            Log.log('ReceiptScreen.handleSend already clicked ' + CACHE_IS_SENDING_CLICKED)
            CACHE_IS_SENDING_CLICKED++
            return true
        }
        Log.log('ReceiptScreen.handleSend started clicked ' + CACHE_IS_SENDING_CLICKED)

        setLoaderStatus(false)

        const { keystore } = this.props.settingsStore

        const { needPasswordConfirm } = this.state

        if (needPasswordConfirm
            && typeof keystore.askPinCodeWhenSending !== 'undefined' && +keystore.askPinCodeWhenSending
            && typeof keystore.lockScreenStatus !== 'undefined' && +keystore.lockScreenStatus
        ) {
            if (passwordCheck) {
                setLockScreenConfig({ flowType: LockScreenFlowTypes.JUST_CALLBACK, callback: async () => {
                    Log.log('ReceiptScreen.handleSend callback called', uiErrorConfirmed)
                    await this.handleSend(false, uiErrorConfirmed)
                }})
                NavStore.goNext('LockScreen')
                return
            }
        }

        this.setState({
            sendInProcess: true
        })
        CACHE_IS_SENDING = true
        CACHE_IS_SENDING_CLICKED = 0

        const checkLoadedFeeResult = checkLoadedFee(this)

        if (checkLoadedFeeResult.msg && CACHE_WARNING_NOTICE !== checkLoadedFeeResult.cacheWarningNoticeValue) {
            Log.log('ReceiptScreen.handleSend countedFees notice ' + JSON.stringify(checkLoadedFeeResult))
            BlocksoftCryptoLog.log('ReceiptScreen.handleSend countedFees notice ' + JSON.stringify(checkLoadedFeeResult))
            if (checkLoadedFeeResult.goBack) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.titles.attention'),
                    description: checkLoadedFeeResult.msg
                }, async () => {
                    CACHE_IS_SENDING = false
                    CACHE_IS_SENDING_CLICKED = 0
                    await SendActionsEnd.endRedirect(false, this.props.sendScreenStore)
                })
            } else {
                showModal({
                    type: checkLoadedFeeResult.modalType,
                    icon: 'WARNING',
                    title: strings('modal.titles.attention'),
                    description: checkLoadedFeeResult.msg
                }, async () => {
                    CACHE_WARNING_NOTICE = checkLoadedFeeResult.cacheWarningNoticeValue
                    await this.handleSend(false, uiErrorConfirmed, checkLoadedFeeResult.newCryptoValue)
                })
            }
            CACHE_IS_SENDING = false
            CACHE_IS_SENDING_CLICKED = 0
            this.setState({
                sendInProcess: false
            })
            return false
        } else if (checkLoadedFeeResult.newCryptoValue * 1 > 0) {
            newCryptoValue = checkLoadedFeeResult.newCryptoValue
            uiErrorConfirmed = true
        }

        const { sendScreenStore } = this.props
        const { selectedFee } = sendScreenStore.fromBlockchain

        let tx = false
        let e = false
        try {
            tx = await SendActionsBlockchainWrapper.actualSend(sendScreenStore, uiErrorConfirmed, selectedFee, newCryptoValue)
            Log.log('ReceiptScreen.handleSend tx ', tx)
        } catch (e1) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.handleSend error ' + e1.message)
            }
            Log.log('ReceiptScreen.handleSend error ' + e1.message)
            e = e1
        }

        if (!e && tx && typeof tx.rawOnly !== 'undefined' && tx.rawOnly) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.handleSend rawOnly ', JSON.stringify(tx))
            }
            Log.log('ReceiptScreen.handleSend rawOnly ', JSON.stringify(tx))
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('send.receiptScreen.rawTransactionResult'),
                description: tx.raw
            })

            CACHE_IS_SENDING = false
            CACHE_IS_SENDING_CLICKED = 0
            this.setState({
                sendInProcess: false
            })
            return false
        }

        if (!e && (!tx || typeof tx.transactionHash === 'undefined' || !tx.transactionHash || tx.transactionHash === '')) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.handleSendError errorTx ', JSON.stringify(tx))
            }
            Log.log('ReceiptScreen.handleSendError errorTx ', tx)
            e = new Error('SERVER_RESPONSE_BAD_SEND_NODE')
        }

        if (e) {
            try {
                showSendError(e, this, passwordCheck)
            } catch (e1) {
                if (config.debug.appErrors) {
                    console.log('ReceiptScreen.handleSendError error ' + e1.message)
                }
                Log.log('ReceiptScreen.handleSendError error ' + e1.message)
            }
            tx = false
        }

        if (tx) {
            try {
                try {
                    await SendActionsEnd.saveTx(tx, this.props.sendScreenStore)
                } catch (e2) {
                    e2.message += ' while SendActionsEnd.saveTx'
                    throw e2
                }
                CACHE_IS_SENDING = false
                CACHE_IS_SENDING_CLICKED = 0
                this.setState({
                    sendInProcess: false
                })
                try {
                    UpdateOneByOneDaemon.unstop()
                    UpdateAccountListDaemon.unstop()
                    await SendActionsEnd.endRedirect(tx, this.props.sendScreenStore)
                } catch (e2) {
                    e2.message += ' while SendActionsEnd.endRedirect'
                    throw e2
                }
                return true
            } catch (e1) {
                if (config.debug.appErrors) {
                    console.log('ReceiptScreen.handleSendSaveTx error ' + e1.message)
                }
                Log.log('ReceiptScreen.handleSendSaveTx error ' + e1.message)
            }
        }

        CACHE_IS_SENDING = false
        CACHE_IS_SENDING_CLICKED = 0
        this.setState({
            sendInProcess: false
        })
        return false
    }


    closeAction = async () => {
        UpdateOneByOneDaemon.unstop()
        UpdateAccountListDaemon.unstop()
        await SendActionsEnd.endClose(this.props.sendScreenStore)
        const { uiType, walletConnectPayload } = this.props.sendScreenStore.ui
        if (uiType === 'TRADE_SEND') {
            NavStore.goBack()
        } else {
            if (uiType === 'WALLET_CONNECT') {
                try {
                    await walletConnectActions.rejectRequest(walletConnectPayload)
                } catch (e) {
                    Log.log('ReceiptScreen.closeAction WALLET_CONNECT error ' + e)
                }

            }
            NavStore.reset('HomeScreen')
        }
    }

    backAction = async () => {
        UpdateOneByOneDaemon.unstop()
        UpdateAccountListDaemon.unstop()

        const { uiType, walletConnectPayload } = this.props.sendScreenStore.ui
        if (uiType === 'WALLET_CONNECT') {
            try {
                await walletConnectActions.rejectRequest(walletConnectPayload)
            } catch (e) {
                Log.log('ReceiptScreen.backAction WALLET_CONNECT error ' + e.message)
            }
        } else if (uiType === 'TRADE_SEND') {
            SendActionsEnd.endClose(this.props.sendScreenStore)
        }

        NavStore.goBack()
    }

    render() {
        UpdateOneByOneDaemon.stop()
        UpdateAccountListDaemon.stop()
        MarketingAnalytics.setCurrentScreen('Send.ReceiptScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const { selectedFee, countedFees } = this.props.sendScreenStore.fromBlockchain
        const { currencyCode, currencySymbol, basicCurrencySymbol, basicCurrencyRate, decimals } = this.props.sendScreenStore.dict
        const { cryptoValue, bse, rawOnly, contractCallData, walletConnectData } = this.props.sendScreenStore.ui
        const { bseOrderId } = bse
        const { sendInProcess } = this.state

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']
        let value = cryptoValue
        if (typeof countedFees.amountForTx !== 'undefined') {
            value = countedFees.amountForTx
        } else if (typeof selectedFee.amountForTx !== 'undefined' ) {
            value = selectedFee.amountForTx
        }
        const amountPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(value, decimals)

        let amountPrettySeparated = 0
        let equivalent = false
        let equivalentSeparated = false
        if (typeof bseOrderId === 'undefined' || !bseOrderId) {
            amountPrettySeparated = BlocksoftPrettyNumbers.makeCut(amountPretty, decimals).separated
            equivalent = RateEquivalent.mul({ value: amountPretty, currencyCode, basicCurrencyRate })
            equivalentSeparated = BlocksoftPrettyNumbers.makeCut(equivalent).separated
        } else {
            // from bse its longer hmmm
            amountPrettySeparated = BlocksoftPrettyNumbers.makeCut(amountPretty, decimals > 6 ? decimals : 6).separated
        }

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.backAction}
                rightType='close'
                rightAction={sendInProcess ? null : this.closeAction}
                title={strings('send.receiptScreen.title')}
                setStatusBar={() => StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')}
            >
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ ...styles.title, color: colors.sendScreen.amount }}>{strings('send.receiptScreen.totalSend')}</Text>

                            {
                                (typeof walletConnectData !== 'undefined' && typeof walletConnectData.data !== 'undefined')
                                ?
                                    <Text style={{ ...styles.value, color: color }}>{`WalletConnect ${currencySymbol}`}</Text>
                                :
                                    amountPrettySeparated.toString() !== '0'
                                        ?
                                        <Text style={{ ...styles.value, color: color }}>{`${amountPrettySeparated} ${currencySymbol}`}</Text>
                                        :
                                        <Text style={{ ...styles.value, color: color }}>{`${currencySymbol}`}</Text>

                            }

                            {
                                typeof bseOrderId !== 'undefined' && bseOrderId &&
                                    <LetterSpacing
                                        text={strings(`account.transaction.orderId`) + ' ' + bseOrderId}
                                        numberOfLines={1}
                                        textStyle={{ ...styles.notEquivalent, color: '#999999' }}
                                        letterSpacing={1} />
                            }

                            {
                                (typeof bseOrderId === 'undefined' || !bseOrderId)
                                && (typeof contractCallData === 'undefined' || !contractCallData)
                                && (typeof walletConnectData === 'undefined' || typeof walletConnectData.data === 'undefined' || cryptoValue.toString() !== '0' )
                                &&
                                    <LetterSpacing
                                        text={`${basicCurrencySymbol} ${equivalentSeparated}`}
                                        numberOfLines={1}
                                        textStyle={{ ...styles.notEquivalent, color: '#999999' }}
                                        letterSpacing={1} />

                            }

                            {typeof contractCallData !== 'undefined' && contractCallData.infoForUser.map((item, index) => {
                                return (
                                    <TransactionItem
                                        key={index}
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        iconType={item.iconType}
                                    />
                                )
                            })}

                            <View style={{ ...styles.line, borderBottomColor: colors.sendScreen.colorLine }} />
                        </View>
                        <View style={{ marginTop: 12 }}>

                            <ReceiptData
                                sendScreenStoreDict={this.props.sendScreenStore.dict}
                                sendScreenStoreUi={this.props.sendScreenStore.ui}
                                sendScreenStoreSelectedFee={this.props.sendScreenStore.fromBlockchain.selectedFee}
                            />

                        </View>
                    </View>
                    <TwoButtons
                        mainButton={{
                            onPress: () => this.handleSend(true, false),
                            title: strings(rawOnly ? 'send.receiptScreen.build' : 'send.receiptScreen.send'),
                            sendInProcess
                        }}
                        secondaryButton={{
                            type: 'settings',
                            onPress: this.openAdvancedSettings,
                            disabled: sendInProcess
                        }}
                    />
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

ReceiptScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps)(ReceiptScreen)

const styles = StyleSheet.create({
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
    name: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.5
    },
    valueComment: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        lineHeight: 14,
        letterSpacing: 1,
        marginTop: 1
    }
})
