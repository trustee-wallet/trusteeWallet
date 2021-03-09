/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import Header from '@app/components/elements/new/Header'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'


import SendBasicScreen from './elements/SendBasicScreen'
import HeaderAccountDetails from '@app/modules/Send/elements/HeaderAccountDetails'
import InputAndButtons from '@app/modules/Send/elements/InputAndButtons'
import InputAddress from '@app/modules/Send/elements/InputAddress'
import InputMemo from '@app/modules/Send/elements/InputMemo'

import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'

class SendScreen extends SendBasicScreen {

    constructor(props) {
        super(props)

        this.state = {
            headerHeight: 0
        }

        this.inputAndButtonsComponent = React.createRef()
        this.inputAddressComponent = React.createRef()
        this.inputMemoComponent = React.createRef()
    }

    closeAction = async (closeScreen = false) => {
        if (closeScreen) {
            NavStore.reset('DashboardStack')
        } else {
            NavStore.goBack()
        }
    }

    // will show notices on fields
    disabledGotoWhy = async () => {
        const disableInput = await this.inputAndButtonsComponent.disabledGotoWhy()
        console.log('disableInput ', disableInput )
        const disableAddress = await this.inputAddressComponent.disabledGotoWhy()
        const disableMemo = await this.inputMemoComponent.disabledGotoWhy()
        if (disableInput.status !== 'success' || disableAddress.status !== 'success' || disableMemo.status !== 'success') {
            return true
        }

        SendActionsUpdateValues.setStepOne(disableInput.value, disableAddress.value, disableMemo.value)
        return false
    }

    handleGotoReceipt = async () => {
        NavStore.goNext('ReceiptScreen')
    }

    render() {
        console.log('')
        console.log('SendScreen render')

        const { colors, GRID_SIZE } = this.context

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    leftParams={{ 'close': false }}
                    rightType='close'
                    rightAction={this.closeAction}
                    rightParams={{ 'close': true }}
                    title={strings('send.title')}
                    ExtraView={HeaderAccountDetails}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <KeyboardAwareView>
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
                        <View>
                            <InputAndButtons
                                ref={component => this.inputAndButtonsComponent = component}
                            />

                            <InputAddress
                                ref={component => this.inputAddressComponent = component}
                            />

                            <InputMemo
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
                                            this.handleGotoReceipt(false)
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
                                            this.openAdvancedSettings(false)
                                        }
                                    }
                                }}
                            />
                        </View>

                    </ScrollView>
                </KeyboardAwareView>
            </View>

        )
    }
}

SendScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps, {})(SendScreen)

