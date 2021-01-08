/**
 * @version 0.9
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet
} from 'react-native'



import NavStore from '../../components/navigation/NavStore'

import { saveSelectedBasicCurrencyCode } from '../../appstores/Stores/Main/MainStoreActions'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

import { strings, sublocale } from '../../services/i18n'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'


class LocalCurrencyScreen extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            currencies: [],
            viewCurrencies: [],
            headerHeight: 0
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
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
        this.handleClose()
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LocalCurrencyScreen')

        const { local_currency: localCurrency } = this.props.settingsStore.data

        const { colors, GRID_SIZE } = this.context
        const { headerHeight, viewCurrencies } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.other.localCurrency')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
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
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

LocalCurrencyScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(LocalCurrencyScreen)

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
