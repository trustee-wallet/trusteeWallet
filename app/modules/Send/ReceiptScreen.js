/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { View, ScrollView, Text, StatusBar, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

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
import lockScreenAction from '@app/appstores/Stores/LockScreen/LockScreenActions'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'


let CACHE_IS_COUNTING = false
let CACHE_IS_SENDING = false
let CACHE_WARNING_NOTICE = false

class ReceiptScreen extends PureComponent {

    constructor(props) {
        super(props)

        this.state = {
            needPasswordConfirm: true,
            sendInProcess: false
        }
    }

    componentDidMount = () => {
        setLoaderStatus(false)
    }

    openAdvancedSettings = async () => {
        if (CACHE_IS_COUNTING) {
            return true
        }
        setLoaderStatus(true)
        CACHE_IS_COUNTING = true
        try {
            await SendActionsBlockchainWrapper.getFeeRate()
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
            NavStore.goNext('SendAdvancedScreen')
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            }
            Log.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
        }
    }

    handleSend = async (passwordCheck = true, uiErrorConfirmed = false) => {
        if (CACHE_IS_SENDING) {
            return true
        }

        setLoaderStatus(false)
        this.setState({
            sendInProcess: true
        })

        const { keystore } = this.props.settingsStore

        const { needPasswordConfirm } = this.state

        if (needPasswordConfirm
            && typeof keystore.askPinCodeWhenSending !== 'undefined' && +keystore.askPinCodeWhenSending
            && typeof keystore.lockScreenStatus !== 'undefined' && +keystore.lockScreenStatus
        ) {
            if (passwordCheck) {
                lockScreenAction.setFlowType({ flowType: 'CONFIRM_SEND_CRYPTO' })
                lockScreenAction.setActionCallback({ actionCallback: this.handleSend })
                NavStore.goNext('LockScreen')
                return
            }
        }

        CACHE_IS_SENDING = true
        const checkLoadedFeeResult = checkLoadedFee(this)

        if (checkLoadedFeeResult.msg && CACHE_WARNING_NOTICE !== checkLoadedFeeResult.cacheWarningNoticeValue) {
            Log.log('countedFees notice' + JSON.stringify(checkLoadedFeeResult))
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.attention'),
                description: checkLoadedFeeResult.msg
            }, async () => {
                if (checkLoadedFeeResult.goBack) {
                    await SendActionsEnd.endRedirect(false, this.props.sendScreenStore)
                } else {
                    CACHE_WARNING_NOTICE = checkLoadedFeeResult.cacheWarningNoticeValue
                }
            })
            this.setState({
                sendInProcess: false
            })
            CACHE_IS_SENDING = false
            return false
        }

        const { selectedFee } = this.props.sendScreenStore.fromBlockchain
        let tx = false
        let e = false
        try {
            tx = await SendActionsBlockchainWrapper.actualSend(this.props.sendScreenStore, uiErrorConfirmed, selectedFee)
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
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.attention'),
                description: tx.raw
            })
            copyToClipboard(tx.raw)
            Toast.setMessage(strings('toast.copied')).show()

            this.setState({
                sendInProcess: false
            })
            CACHE_IS_SENDING = false
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
                await SendActionsEnd.saveTx(tx, this.props.sendScreenStore)
                this.setState({
                    sendInProcess: false
                })
                CACHE_IS_SENDING = false
                await SendActionsEnd.endRedirect(tx, this.props.sendScreenStore)

            } catch (e1) {
                if (config.debug.appErrors) {
                    console.log('ReceiptScreen.handleSendSaveTx error ' + e.message)
                }
                Log.log('ReceiptScreen.handleSendSaveTx error ' + e.message)
                this.setState({
                    sendInProcess: false
                })
                CACHE_IS_SENDING = false
            }
        } else {
            this.setState({
                sendInProcess: false
            })
            CACHE_IS_SENDING = false
        }
    }


    closeAction = async () => {
        await SendActionsEnd.endClose(this.props.sendScreenStore)
        const { uiType } = this.props.sendScreenStore.ui
        if (uiType === 'TRADE_SEND') {
            NavStore.reset('MarketScreen') // @todo here some param to reset all search
        } else {
            NavStore.reset('HomeScreen')
        }
    }

    backAction = () => {
        const { uiType } = this.props.sendScreenStore.ui
        if (uiType === 'TRADE_SEND') {
            NavStore.goNext('MarketScreen')
        } else {
            NavStore.goBack()
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Send.ReceiptScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const { selectedFee } = this.props.sendScreenStore.fromBlockchain
        const { currencyCode, currencySymbol, basicCurrencySymbol, basicCurrencyRate } = this.props.sendScreenStore.dict
        const { cryptoValue, bse, rawOnly } = this.props.sendScreenStore.ui
        const { bseOrderId } = bse
        const { sendInProcess } = this.state

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']
        const value = selectedFee.amountForTx !== 'undefined' && selectedFee.amountForTx ? selectedFee.amountForTx : cryptoValue
        const amountPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(value)

        let amountPrettySeparated = 0
        let equivalent = false
        let equivalentSeparated = false
        if (typeof bseOrderId === 'undefined' || !bseOrderId) {
            amountPrettySeparated = BlocksoftPrettyNumbers.makeCut(amountPretty).separated
            equivalent = RateEquivalent.mul({ value: amountPretty, currencyCode, basicCurrencyRate })
            equivalentSeparated = BlocksoftPrettyNumbers.makeCut(equivalent).separated
        } else {
            // from bse its longer hmmm
            amountPrettySeparated = BlocksoftPrettyNumbers.makeCut(amountPretty, 6).separated
        }

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.backAction}
                rightType='close'
                rightAction={this.closeAction}
                title={strings('send.receiptScreen.title')}
                setStatusBar={() => StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')}
            >
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
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ ...styles.title, color: colors.sendScreen.amount }}>{strings('send.receiptScreen.totalSend')}</Text>
                            <Text style={{ ...styles.value, color: color }}>{`${amountPrettySeparated} ${currencySymbol}`}</Text>
                            {
                                typeof bseOrderId === 'undefined' || !bseOrderId ?
                                    <LetterSpacing
                                        text={`${basicCurrencySymbol} ${equivalentSeparated}`}
                                        numberOfLines={1}
                                        textStyle={{ ...styles.notEquivalent, color: '#999999' }}
                                        letterSpacing={1} />

                                    : <LetterSpacing
                                        text={strings(`account.transaction.orderId`) + ' ' + bseOrderId}
                                        numberOfLines={1}
                                        textStyle={{ ...styles.notEquivalent, color: '#999999' }}
                                        letterSpacing={1} />
                            }
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
                            onPress: this.handleSend,
                            title: strings(rawOnly ? 'send.receiptScreen.build' : 'send.receiptScreen.send'),
                            sendInProcess
                        }}
                        secondaryButton={{
                            type: 'settings',
                            onPress: this.openAdvancedSettings
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

export default connect(mapStateToProps, {})(ReceiptScreen)

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
