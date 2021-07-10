/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { ScrollView, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'
import currencyBasicActions from '@app/appstores/Stores/CurrencyBasic/CurrencyBasicActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import { getCurrenciesBasic } from '@app/appstores/Stores/CurrencyBasic/selectors'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'

class LocalCurrencyScreen extends PureComponent {

    setLocalCurrencyCode = (currencyCode) => {
        try {
            settingsActions.setSettings('local_currency', currencyCode)
            currencyBasicActions.setSelectedBasicCurrencyCode(currencyCode)
            setBseLink(null)
            NavStore.goBack()
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('LocalCurrencyScreen.setLocalCurrencyCode error ' + e.message)
            }
            Log.log('LocalCurrencyScreen.setLocalCurrencyCode error ' + e.message)
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LocalCurrencyScreen')

        const { localCurrency } = this.props.settingsData
        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('settings.other.localCurrency')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE, paddingLeft: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {
                        this.props.currenciesBasic.map((item, index) => (
                            <ListItem
                                key={item.currencyCode}
                                checked={item.currencyCode === localCurrency}
                                title={item.currencyName}
                                subtitle={item.currencyCode}
                                onPress={() => this.setLocalCurrencyCode(item.currencyCode)}
                                last={this.props.currenciesBasic.length - 1 === index}
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
        currenciesBasic: getCurrenciesBasic(state)
    }
}

LocalCurrencyScreen.contextType = ThemeContext

export default connect(mapStateToProps)(LocalCurrencyScreen)

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
})
