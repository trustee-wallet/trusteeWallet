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
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { checkLoadedFee } from './receipt/helpers'

let CACHE_IS_COUNTING = false
class SendAdvancedSettings extends Component {

    constructor(props) {
        super(props)

        this.state = {
            dropMenu: false,
            comment: '',
            headerHeight: 0,
            selectedFee : false
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

        const { bse } = this.props.sendScreenStore.ui
        const { bseProviderType } = bse
        
        if (bseProviderType === 'FIXED') {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.titles.attention'),
                description: strings('modal.send.noChangeFee')
            })
            return
        }

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

    setFee = (newData) => {
        this.setState(newData)
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
        setLoaderStatus(true)
        CACHE_IS_COUNTING = true
        try {
            await SendActionsUpdateValues.setCommentAndFeeFromTmp(comment)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendAdvancedSettings.handleApply error ' + e.message)
            }
            Log.log('SendAdvancedSettings.handleApply error ' + e.message)
        }

        CACHE_IS_COUNTING = false
        setLoaderStatus(false)
        NavStore.goBack()
    }


    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Send.SendAdvancedSettings')

        const { colors, GRID_SIZE } = this.context

        const { selectedFee, countedFees } = this.props.sendScreenStore.fromBlockchain

        const currentSelectedFee = this.state.selectedFee ? this.state.selectedFee : selectedFee

        const langMsg = currentSelectedFee ? currentSelectedFee.langMsg : 'none'
        const isCustomFee = typeof currentSelectedFee.isCustomFee !== 'undefined' ? currentSelectedFee.isCustomFee : false

        const dropMenu = langMsg !== 'none' ? !!this.state.dropMenu : true
        const showFees = countedFees && typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex*1 >= -2
        const shouldShowFees = countedFees && typeof countedFees.shouldShowFees !== 'undefined' ? countedFees.shouldShowFees : true
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
                            { shouldShowFees && showFees ?
                                <View>
                                    <LetterSpacing text={strings('send.setting.feeSettings').toUpperCase()} textStyle={{...styles.settings__title, paddingBottom: GRID_SIZE, color: colors.sendScreen.amount }} letterSpacing={1.5} />
                                    <ListItem
                                        title={strings('send.setting.selectFee')}
                                        iconType="fee"
                                        onPress={this.toggleDropMenu}
                                        rightContent={dropMenu ? 'arrow_up' : "arrow_down"}
                                        switchParams={{ value: dropMenu, onPress: this.toggleDropMenu }}
                                        type={'dropdown'}
                                        ExtraView={() => <SendAdvancedFees
                                            sendScreenStore={this.props.sendScreenStore}
                                            currentSelectedFee={currentSelectedFee}
                                            scrollView={this.scrollView}
                                            setParentState={this.setFee}
                                        />}
                                        subtitle={langMsg
                                            ? (
                                                isCustomFee ? strings(`send.fee.customFee.title`) : strings(`send.fee.text.${langMsg}`)
                                            )
                                            : null}
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
