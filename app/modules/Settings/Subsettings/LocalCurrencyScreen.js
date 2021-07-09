/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { ScrollView, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { saveSelectedBasicCurrencyCode, setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

import { strings, sublocale } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'

class LocalCurrencyScreen extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currencies: [],
            viewCurrencies: [],
        }
    }

    UNSAFE_componentWillMount() {
        let basicCurrencies = currencyActions.getBasicCurrencies()
        let currencies = []
        let currencyCode
        let suffix = sublocale()
        for (currencyCode in basicCurrencies) {
            let tmp = basicCurrencies[currencyCode]
            if (typeof tmp.currencyNameSuffixed !== 'undefined' && typeof tmp.currencyNameSuffixed[suffix] !== 'undefined') {
                tmp.currencyName = tmp.currencyNameSuffixed[suffix]
            } else if (typeof tmp.currencyName === 'undefined') {
                tmp.currencyName = strings(`currencyList.${currencyCode}.currency`)
            }
            currencies.push(tmp)
        }

        this.setState({
            currencies,
            viewCurrencies: currencies
        })
    }


    setLocalCurrencyCode = (currencyCode) => {
        saveSelectedBasicCurrencyCode(currencyCode)
        setBseLink(null)
        this.handleClose()
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LocalCurrencyScreen')

        const { local_currency: localCurrency } = this.props.settingsData

        const { GRID_SIZE } = this.context
        const { viewCurrencies } = this.state

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
                        viewCurrencies.map((item, index) => (
                            <ListItem
                                checked={item.currencyCode === localCurrency}
                                title={item.currencyName}
                                subtitle={item.currencyCode}
                                onPress={() => this.setLocalCurrencyCode(item.currencyCode)}
                                last={viewCurrencies.length - 1 === index}
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
