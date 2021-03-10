/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import ListItem from 'react-native-paper/src/components/List/ListItem'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import Header from '@app/components/elements/new/Header'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'


import SendAdvancedFees from '@app/modules/Send/elements/SendAdvancedFees'

import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'



class SendAdvancedSettings extends Component {

    constructor(props) {
        super(props)

        this.state = {
            dropMenu: false,
            devMode: false,
            comment: '',
            headerHeight: 0,
        }

        this.customFee = React.createRef()
    }

    onFocus = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 350 })
            } catch (e) {
            }
        }, 500)
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }


    render() {

        const { colors, GRID_SIZE } = this.context

        const { selectedFee, countedFees } = this.props.sendScreenStore.fromBlockchain
        const langMsg = selectedFee ? selectedFee.langMsg : 'none'
        const dropMenu = langMsg !== 'none' ? !!this.state.dropMenu : true
        const showFees = !(countedFees && typeof countedFees.selectedFeeIndex !== -1 && countedFees.selectedFeeIndex < -2)

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    title={strings('send.setting.title')}
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
                            paddingBottom: GRID_SIZE * 2,
                        }}
                        style={{ marginTop: this.state.headerHeight }}
                    >
                        <View>
                            { showFees ?
                                <View>
                                    <LetterSpacing text={strings('send.setting.feeSettings').toUpperCase()} textStyle={{...styles.settings__title, paddingBottom: GRID_SIZE, color: colors.sendScreen.amount }} letterSpacing={1.5} />
                                    <ListItem
                                        title={strings('send.setting.selectFee')}
                                        iconType="fee"
                                        onPress={this.toggleDropMenu}
                                        rightContent={dropMenu ? 'arrow_up' : "arrow_down"}
                                        switchParams={{ value: dropMenu, onPress: this.toggleDropMenu }}
                                        type={'dropdown'}
                                        ExtraView={SendAdvancedFees}
                                        subtitle={langMsg ? this.state.isCustomFee ? strings(`send.fee.customFee.title`) :
                                            strings(`send.fee.text.${langMsg}`) : null}
                                    />
                                </View>
                                : null }
                            <View style={{ marginVertical: GRID_SIZE }}>
                            </View>
                        </View>
                        <View style={{ marginTop: GRID_SIZE }}>
                        </View>

                    </ScrollView>
                </KeyboardAwareView>
            </View>
        )
    }
}

SendAdvancedSettings.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps, {})(SendAdvancedSettings)

const styles = StyleSheet.create({
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        marginLeft: 20
    },
})
