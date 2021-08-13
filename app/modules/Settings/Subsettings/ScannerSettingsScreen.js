/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'

const SCANNER_SETTINGS = [
    {
        code: '1min'
    },
    {
        code: '10min'
    },
    {
        code: 'none'
    }
]

class ScannerSettingsScreen extends PureComponent {

    getCode = () => {
        let { scannerCode } = this.props.settingsData
        if (!scannerCode) scannerCode = '1min'
        return scannerCode
    }

    setCode = async (item) => {
        await settingsActions.setSettings('scannerCode', item.code)
        this.handleBack()
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.ScannerSettingsScreen')

        const code = this.getCode()

        const time = UpdateAccountBalanceAndTransactions.getTime()

        const { colors, GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('scannerSettings.title')}
            >
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE, paddingLeft: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.scanningTimeContainer, { paddingRight: GRID_SIZE, paddingTop: GRID_SIZE / 2 }]}>
                        <Text style={[styles.text, { color: colors.common.text3 }]}>{strings('scannerSettings.lastScan')}</Text>
                        <Text style={[styles.timeText, { color: colors.common.text1 }]}>{time}</Text>
                    </View>

                    <View>
                        <Text style={[styles.text, { color: colors.common.text3, marginRight: GRID_SIZE * 3, marginVertical: GRID_SIZE * 1.5 }]}>{strings('scannerSettings.helper')}</Text>
                    </View>

                    {
                        SCANNER_SETTINGS.map((item, index) => (
                            <ListItem
                                checked={item.code === code}
                                title={strings(`scannerSettings.codes.${item.code}`)}
                                onPress={() => this.setCode(item)}
                                last={SCANNER_SETTINGS.length - 1 === index}
                            />
                        ))
                    }
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsData: getSettingsScreenData(state),
    }
}

ScannerSettingsScreen.contextType = ThemeContext

export default connect(mapStateToProps)(ScannerSettingsScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    scanningTimeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    text: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        flex: 2,
    },
    timeText: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        flex: 1,
        textAlign: 'right'
    }
})
