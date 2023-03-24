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
import InputAndButtons from '@app/modules/Send/elements/InputAndButtons'
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
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

let CACHE_IS_COUNTING = false
let CACHE_IS_BALANCE_UPDATING = false
let CACHE_BALANCE_TIMEOUT = false

class SendScreen extends PureComponent {

    constructor(props) {
        super(props)

        this.inputAndButtonsComponent = React.createRef()
        this.inputAddressComponent = React.createRef()
        this.inputMemoComponent = React.createRef()

        this.refreshBalance()
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
        const disableInput = await this.inputAndButtonsComponent.disabledGotoWhy()
        const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
        const disableMemo = await this.inputMemoComponent.disabledGotoWhy()
        if (disableInput.status !== 'success' || disableAddress.status !== 'success' || disableMemo.status !== 'success') {
            return true
        }
        SendActionsUpdateValues.setStepOne({
            cryptoValue: disableInput.value.toString().replace(' ', ''),
            isTransferAll: disableInput.isTransferAll,
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
            const disableInput = await this.inputAndButtonsComponent.disabledGotoWhy()
            const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
            Log.log('Input.openAdvancedSettings start counting ' + disableInput.value + ' ' + disableAddress.value)
            const res = await SendActionsBlockchainWrapper.getFeeRate()
            Log.log('Input.openAdvancedSettings end counting ' + disableInput.value + ' ' + disableAddress.value + ' with res ' + JSON.stringify(res))
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
            const disableInput = await this.inputAndButtonsComponent.disabledGotoWhy()
            const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
            Log.log('Input.handleGotoReceipt start counting ' + disableInput.value + ' ' + disableAddress.value)
            const res = await SendActionsBlockchainWrapper.getFeeRate()
            Log.log('Input.handleGotoReceipt end counting ' + disableInput.value + ' ' + disableAddress.value + ' with res ' + JSON.stringify(res))
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

    async refreshBalance() {
        if (CACHE_IS_BALANCE_UPDATING) {
            return false
        }
        CACHE_IS_BALANCE_UPDATING = true
        if (CACHE_BALANCE_TIMEOUT) {
            clearTimeout(CACHE_BALANCE_TIMEOUT)
        }
        const { balanceRaw, basicCurrencyRate, currencyCode, addressFrom, walletHash, derivationPath } = this.props.sendScreenStore.dict
        if (currencyCode === 'BTC' || currencyCode === 'LTC') {
            return false
        }
        if (config.daemon.scanOnAccount) {
            try {
                const tmp = await (BlocksoftBalances.setCurrencyCode(currencyCode).setWalletHash(walletHash).setAdditional({derivationPath}).setAddress(addressFrom)).getBalance('SendScreen')
                if (tmp) {
                    const newBalanceRaw = typeof tmp?.balanceAvailable !== 'undefined' ? tmp?.balanceAvailable : tmp?.balance
                    if (newBalanceRaw !== balanceRaw) {
                        if (!tmp?.address || tmp?.address !== addressFrom || tmp?.currencyCode !== currencyCode) {
                            Log.log('SendScreen.reload ' + currencyCode + ' ' + addressFrom + ' balance will not update as got ' + tmp?.address)
                        } else {
                            Log.log('SendScreen.reload ' + currencyCode + ' ' + addressFrom + ' balance will update from ' + balanceRaw + ' to ' + tmp?.balance)
                            const newPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(newBalanceRaw)
                            const newCurrencyBalanceTotal = BlocksoftPrettyNumbers.makeCut(newPretty * basicCurrencyRate, 2).cutted
                            SendActionsUpdateValues.setDict({
                                addressFrom: addressFrom,
                                currencyCode: currencyCode,
                                balanceRaw: newBalanceRaw,
                                balanceTotalPretty: newPretty,
                                basicCurrencyBalanceTotal: newCurrencyBalanceTotal
                            })
                        }
                    }
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('SendScreen.reload ' + currencyCode + ' ' + addressFrom + ' error ' + e.message)
                }
                Log.log('SendScreen.reload ' + currencyCode + ' ' + addressFrom + ' error ' + e.message)
            }
            CACHE_BALANCE_TIMEOUT = setTimeout(() => {
                this.refreshBalance()
            },5000)
        }
        CACHE_IS_BALANCE_UPDATING = false
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Send.SendScreen')

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
                    keyboardShouldPersistTaps={'handled'}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2
                    }}
                >
                    <View>
                        <InputAndButtons
                            sendScreenStoreDict={this.props.sendScreenStore.dict}
                            sendScreenStoreTransferAllBalance={this.props.sendScreenStore.fromBlockchain.transferAllBalance}
                            sendScreenStoreUi={this.props.sendScreenStore.ui}
                            ref={component => this.inputAndButtonsComponent = component}
                        />

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

SendScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps, {})(SendScreen)

