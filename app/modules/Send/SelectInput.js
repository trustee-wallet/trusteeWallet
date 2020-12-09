/**
 * @version 0.30
 */

import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Dimensions, Keyboard, Text, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '../../services/i18n'

import NavStore from '../../components/navigation/NavStore'
import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import ListItem from '../../components/elements/new/list/ListItem/Setting'
import SubSetting from '../../components/elements/new/list/ListItem/SubSetting'
import LetterSpacing from '../../components/elements/LetterSpacing'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import AsyncStorage from '@react-native-community/async-storage'

import CustomFee from './elements/FeeCustom/CustomFee'
import SendTmpConstants from './elements/SendTmpConstants'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

class SelectInput extends Component {
    constructor(props) {
    super(props)
    
    }

    render() {

        const { colors, GRID_SIZE } = this.context

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
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}
                        style={{ marginTop: 70 }}
                    >
                        <View style={{ paddingHorizontal: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                        </View>
                        <View style={{ paddingTop: GRID_SIZE }}>
                            <TwoButtons
                                mainButton={{
                                    // disabled: this.disabled(),
                                    onPress: () => this.handleApply(),
                                    title: strings('send.setting.apply')
                                }}
                                secondaryButton={{
                                    type: 'back',
                                    onPress: () => NavStore.goBack(),
                                }}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAwareView>
            </View>
        )
    }

}

SelectInput.contextType = ThemeContext

export default SelectInput