/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import NavStore from '@app/components/navigation/NavStore'

import Header from '@app/components/elements/new/Header'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import TextInput from '@app/components/elements/new/TextInput'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'

import SendAdvancedFees from '@app/modules/Send/advanced/SendAdvancedFees'

import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'



class SendAdvancedSettings extends Component {

    constructor(props) {
        super(props)

        this.state = {
            dropMenu: false,
            comment: '',
            headerHeight: 0,
        }

        this.customFee = React.createRef()
    }

    componentDidMount() {
        SendActionsUpdateValues.setTmpSelectedFee(false)
        this.setState({
            comment : this.props.sendScreenStore.ui.comment
        })
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState({
            headerHeight
        })
    }

    onChangeComment = (value) => {
        this.setState({
            comment: value
        })
    }

    handleBack = () => {
        SendActionsUpdateValues.setTmpSelectedFee(false)
        NavStore.goBack()
    }

    handleApply = async () => {
        const comment = this.state.comment
        SendActionsUpdateValues.setCommentAndFeeFromTmp(comment)
        NavStore.goBack()
    }


    render() {

        const { colors, GRID_SIZE } = this.context

        const { selectedFee, countedFees } = this.props.sendScreenStore.fromBlockchain
        const langMsg = selectedFee ? selectedFee.langMsg : 'none'
        const dropMenu = langMsg !== 'none' ? !!this.state.dropMenu : true
        const showFees = countedFees && typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex*1 >= -2

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
                                        ExtraViewParams={this.props.sendScreenStore}
                                        subtitle={langMsg ? this.state.isCustomFee ? strings(`send.fee.customFee.title`) :
                                            strings(`send.fee.text.${langMsg}`) : null}
                                    />
                                </View>
                                : null }

                            <View style={{ marginVertical: GRID_SIZE }}>
                                <LetterSpacing text={strings('send.setting.optional').toUpperCase()} textStyle={{...styles.settings__title, paddingBottom: GRID_SIZE, color: colors.sendScreen.amount }}  letterSpacing={1.5} />
                                <TextInput
                                    value={this.state.comment}
                                    placeholder={strings('send.setting.note')}
                                    onChangeText={this.onChangeComment}
                                />
                            </View>
                        </View>
                        <View style={{ marginTop: GRID_SIZE }}>
                            <TwoButtons
                                mainButton={{
                                    onPress: this.handleApply,
                                    title: strings('send.setting.apply')
                                }}
                                secondaryButton={{
                                    type: 'back',
                                    onPress: this.handleBack,
                                }}
                            />
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
