/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import Header from '@app/components/elements/new/Header'
import NavStore from '@app/components/navigation/NavStore'


import SendBasicScreen from './elements/SendBasicScreen'
import HeaderAccountDetails from '@app/modules/Send/elements/HeaderAccountDetails'
import InputAndButtons from '@app/modules/Send/elements/InputAndButtons'
import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'


class SendScreen extends SendBasicScreen {

    constructor(props) {
        super(props)

        this.state = {
            headerHeight: 0
        }
    }

    closeAction = async (closeScreen = false) => {
        if (closeScreen) {
            NavStore.reset('DashboardStack')
        } else {
            NavStore.goBack()
        }
    }

    render() {
        console.log('SendScreen render ', JSON.stringify(this.props))

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
                            <InputAndButtons/>
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
        sendScreenStore : getSendScreenData(state)
    }
}

export default connect(mapStateToProps, {})(SendScreen)

