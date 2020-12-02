/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '../../services/i18n'

import NavStore from '../../components/navigation/NavStore'
import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import Theme from '../../themes/Themes'

import ListItem from '../../components/elements/new/list/ListItem/Setting'
import SubSetting from '../../components/elements/new/list/ListItem/SubSetting'
import LetterSpacing from '../../components/elements/LetterSpacing'

let styles

class SendAdvancedSettingsScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            focused: false,
            dropMenu: false,
            selectedFee: null
        }
    }

    UNSAFE_componentWillMount() {

        styles = Theme.getStyles().sendScreenStyles
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }

    showFee = (countedFees) => {

        if (!countedFees.fees) {
            return false
        } 


        return (
            <View style={{ paddingHorizontal: 30, marginTop: 30,  }}>
                {
                    countedFees ? countedFees.fees.map((item) => {
                        return (
                            <>
                                <SubSetting
                                    title={item.langMsg}
                                    checked={item === this.state.selectedFee}
                                    radioButtonFirst={true}
                                    withoutLine={true}
                                    onPress={() => this.setState({
                                        selectedFee: item
                                    })}
                                />
                            </>
                        )
                    }) : <View></View>
                }
            </View>
        )
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        const {
            focused
        } = this.state

        const countedFees = this.props.navigation.getParam('countedFees')

        onFocus = () => {
            this.setState({
                focused: true
            })

            setTimeout(() => {
                try {
                    this.scrollView.scrollTo({ y: 120 })
                } catch (e) {
                }
            }, 500)
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    title={strings('send.setting.title')}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps={'handled'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{padding: GRID_SIZE, paddingLeft: GRID_SIZE * 3 }}
                        // contentContainerStyle={focused ? styles.wrapper__content_active : {...styles.wrapper__content}}
                        style={styles.wrapper__scrollView}
                    >
                        <View>
                            <View style={styles.settings__row}>
                                <LetterSpacing text={strings('account.assetSettings').toUpperCase()} textStyle={styles.settings__title} letterSpacing={1.5} />
                            </View>
                            <ListItem
                                title={'Fee select'}
                                iconType="pinCode"
                                onPress={this.toggleDropMenu}
                                rightContent={this.state.dropMenu ? 'arrow_up' : "arrow_down"}
                                switchParams={{ value: !!this.state.dropMenu, onPress: this.toggleDropMenu }}
                                type={'dropdown'}
                                ExtraView={() => this.showFee(countedFees)}
                                subtitle={'FEE'}
                            />
                        </View>

                        <TwoButtons
                            mainButton={{
                                // disabled: ,
                                // onPress: () => this.handleSendTransaction(false),
                                title: strings('walletBackup.step0Screen.next')
                            }}
                            secondaryButton={{
                                type: 'back',
                                onPress: () => NavStore.goBack(),
                            }}
                        />
                    </ScrollView>
                </KeyboardAwareView>
            </View>
        )
    }
}

SendAdvancedSettingsScreen.contextType = ThemeContext

export default SendAdvancedSettingsScreen