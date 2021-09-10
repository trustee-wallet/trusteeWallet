/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { View, ScrollView, Keyboard } from 'react-native'
import { connect } from 'react-redux'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'

import HeaderAccountDetails from '@app/modules/Send/elements/HeaderAccountDetails'
import InputAddress from '@app/modules/Send/elements/InputAddress'
import InputMemo from '@app/modules/Send/elements/InputMemo'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import config from '@app/config/config'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'
import Log from '@app/services/Log/Log'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import AddressInput from '@app/components/elements/NewInput'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import TransactionItem from '@app/modules/Account/AccountTransaction/elements/TransactionItem'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

let CACHE_IS_COUNTING = false

class SendScreenWithoutAmount extends PureComponent {

    constructor(props) {
        super(props)

        this.inputAddressComponent = React.createRef()
        this.inputMemoComponent = React.createRef()
    }

    closeAction = async (closeScreen = false) => {
        if (closeScreen) {
            NavStore.reset('HomeScreen')
        } else {
            NavStore.goBack()
        }
    }

    // will show notices on fields
    disabledGotoWhy = async () => {
        const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
        const disableMemo = await this.inputMemoComponent.disabledGotoWhy()
        if (disableAddress.status !== 'success' || disableMemo.status !== 'success') {
            return true
        }
        SendActionsUpdateValues.setStepOne({
            addressTo: disableAddress.value,
            addressName: disableAddress.addressName,
            memo: disableMemo.value
        })
        return false
    }


    openAdvancedSettings = async () => {
        if (CACHE_IS_COUNTING) {
            return true
        }
        setLoaderStatus(true)
        CACHE_IS_COUNTING = true
        try {
            const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
            Log.log('Input.openAdvancedSettings start counting ' + disableAddress.value)
            const res = await SendActionsBlockchainWrapper.getFeeRate()
            Log.log('Input.openAdvancedSettings end counting ' + disableAddress.value + ' with res ' + JSON.stringify(res))
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
            NavStore.goNext('SendAdvancedScreen')
        } catch (e) {
            if (config.debug.sendLogs) {
                console.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            }
            Log.log('ReceiptScreen.openAdvancedSettings error ' + e.message)
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
        }
    }

    handleGotoReceipt = async () => {
        if (CACHE_IS_COUNTING) {
            return true
        }
        setLoaderStatus(true)
        Keyboard.dismiss()
        CACHE_IS_COUNTING = true
        try {
            if (config.debug.sendLogs) {
                console.log('handleGotoReceipt getFeeRate start')
            }
            const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
            const res = await SendActionsBlockchainWrapper.getFeeRate()
            Log.log('Input.handleGotoReceipt end counting ' + disableAddress.value + ' with res ' + JSON.stringify(res))
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
            NavStore.goNext('ReceiptScreen')
        } catch (e) {
            if (config.debug.sendLogs) {
                console.log('ReceiptScreen.handleGotoReceipt error ' + e.message)
            }
            Log.log('ReceiptScreen.handleGotoReceipt error ' + e.message)
            setLoaderStatus(false)
            CACHE_IS_COUNTING = false
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Send.SendScreenWithoutAmount')

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.closeAction}
                leftParams={{ 'close': false }}
                rightType='close'
                rightAction={this.closeAction}
                rightParams={{ 'close': true }}
                title={strings('send.title')}
                ExtraView={HeaderAccountDetails}
                ExtraViewParams={{ isBalanceVisible: this.props.isBalanceVisible, sendScreenStoreDict: this.props.sendScreenStore.dict }}
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
                    <View>

                        {this.props.sendScreenStore.ui.contractCallData.infoForUser.map((item, index) => {
                            return (
                                <TransactionItem
                                    key={index}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    iconType={item.iconType}
                                />
                            )
                        })}

                        <InputAddress
                            sendScreenStoreDict={this.props.sendScreenStore.dict}
                            sendScreenStoreValue={this.props.sendScreenStore.ui.addressTo}
                            ref={component => this.inputAddressComponent = component}
                        />

                        <InputMemo
                            sendScreenStoreDict={this.props.sendScreenStore.dict}
                            sendScreenStoreValue={this.props.sendScreenStore.ui.memo}
                            ref={component => this.inputMemoComponent = component}
                        />
                    </View>

                    <View style={{ marginTop: GRID_SIZE }}>
                        <TwoButtons
                            mainButton={{
                                onPress: async () => {
                                    // could be optimized but for better readable keep like this
                                    if (await this.disabledGotoWhy()) {
                                        return false
                                    } else {
                                        await this.handleGotoReceipt(false)
                                    }
                                },
                                title: strings('walletBackup.step0Screen.next')
                            }}
                            secondaryButton={{
                                type: 'settings',
                                onPress: async () => {
                                    // could be optimized but for better readable keep like this
                                    if (await this.disabledGotoWhy()) {
                                        return false
                                    } else {
                                        await this.openAdvancedSettings()
                                    }
                                }
                            }}
                        />
                    </View>

                </ScrollView>
            </ScreenWrapper>

        )
    }
}

SendScreenWithoutAmount.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps)(SendScreenWithoutAmount)
