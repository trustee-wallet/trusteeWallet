/**
 * @version 0.9
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView
} from 'react-native'



import NavStore from '../../components/navigation/NavStore'

import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import { strings } from '../../services/i18n'

import config from '../../config/config'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'


class ScannerSettingsScreen extends React.PureComponent {
    state = {
        headerHeight: 0
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    getCode = () => {
        let { scannerCode } = this.props.settings.data
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

        const { scannerSettings } = config.scanner
        const code = this.getCode()

        const time = UpdateAccountBalanceAndTransactions.getTime()

        const { colors, GRID_SIZE } = this.context
        const { headerHeight } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('scannerSettings.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
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
                            scannerSettings.map((item, index) => (
                                <ListItem
                                    checked={item.code === code}
                                    title={strings(`scannerSettings.codes.${item.code}`)}
                                    onPress={() => this.setCode(item)}
                                    last={scannerSettings.length - 1 === index}
                                />
                            ))
                        }
                    </ScrollView>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

ScannerSettingsScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(ScannerSettingsScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
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
