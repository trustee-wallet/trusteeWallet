/**
 * @version 0.41
 */
import React from 'react'
import { View, ScrollView, Text, StatusBar, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import Header from '@app/components/elements/new/Header'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import LetterSpacing from '@app/components/elements/LetterSpacing'

import UIDict from '@app/services/UIDict/UIDict'

import SendBasicScreen from '@app/modules/Send/elements/SendBasicScreen'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'

import ReceiptData from '@app/modules/Send/receipt/ReceiptData'

import Log from '@app/services/Log/Log'
import config from '@app/config/config'

import { showSendError } from './receipt/helpers'
import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'
import { SendActionsEnd } from '@app/appstores/Stores/Send/SendActionsEnd'
import lockScreenAction from '@app/appstores/Stores/LockScreen/LockScreenActions'


let CACHE_IS_COUNTING = false
let CACHE_IS_SENDING = false

class ReceiptScreen extends SendBasicScreen {

    constructor(props) {
        super(props)

        this.state = {
            headerHeight: 0,
            needPasswordConfirm : true
        }
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
        setLoaderStatus(true)

        let tx = false
        let e = false

        const { selectedFee } = this.props.sendScreenStore.fromBlockchain
        try {
            tx = await SendActionsBlockchainWrapper.actualSend(false, selectedFee)
        } catch (e1) {
            if (config.debug.appErrors) {
                console.log('ReceiptScreen.handleSend error ' + e1.message)
            }
            Log.log('ReceiptScreen.handleSend error ' + e1.message)
            e = e1
        }

        if (e) {
            try {
                showSendError(e, this)
            } catch (e1) {
                if (config.debug.appErrors) {
                    console.log('ReceiptScreen.handleSendError error ' + e1.message)
                }
                Log.log('ReceiptScreen.handleSendError error ' + e1.message)
            }
        }

        if (tx) {
            await SendActionsEnd.saveTx(tx, this.props.sendScreenStore)
            setLoaderStatus(false)
            CACHE_IS_SENDING = false
            await SendActionsEnd.endRedirect(tx, this.props.sendScreenStore)
        } else {
            setLoaderStatus(false)
            CACHE_IS_SENDING = false
        }
    }


    closeAction = async (closeScreen = false) => {
        await SendActionsEnd.endClose(this.props.sendScreenStore)
        if (closeScreen) {
            NavStore.reset('DashboardStack')
        } else {
            NavStore.goBack()
        }
    }

    render() {
        const { colors, GRID_SIZE, isLight } = this.context

        const { currencyCode, currencySymbol, basicCurrencySymbol, basicCurrencyRate } = this.props.sendScreenStore.dict
        const { cryptoValue, bse } = this.props.sendScreenStore.ui
        const { bseOrderId } = bse

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']
        const amountPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(cryptoValue)

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
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    leftParams={{ 'close': false }}
                    rightType='close'
                    rightAction={this.closeAction}
                    rightParams={{ 'close': true }}
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
                    style={{ marginTop: this.state.headerHeight }}
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

                                    :  <LetterSpacing
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
