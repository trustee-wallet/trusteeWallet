import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    Clipboard
} from 'react-native'

import firebase from 'react-native-firebase'


import IoniconsIcons from 'react-native-vector-icons/Ionicons'

import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'

import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'

import { strings } from '../../services/i18n'

import countries from '../../assets/jsons/other/country-by-currency-code'


class LocalCurrencyScreen extends Component {

    constructor(props){
        super(props)
        this.state = {
            currencies: []
        }
    }

    UNSAFE_componentWillMount() {

        const { fiatRates } = this.props.fiatRatesStore
        let currencies = []

        fiatRates.forEach(item1 => countries.forEach(item2 => {
            if(item1.cc === item2.currencyCode) currencies.push(item2)
        }))

        currencies = currencies.map(item => {
            item.currency = strings(`currencyList.${item.currencyCode}.currency`)
            return item
        })

        const array = ['GBP','CHF','RUB','UAH','EUR','USD']

        for(const item of array){
            const currencyIndex = currencies.findIndex(currency => currency.currencyCode === item)
            currencies.unshift( currencies.splice( currencyIndex, 1 )[0] )
        }

        this.setState({
            currencies,
            viewCurrencies: currencies
        })
    }


    setLocalCurrency = (localCurrency) => {
        FiatRatesActions.setLocalCurrency(localCurrency)
    }

    searchInputCallback = (value) => {
        let tmpArray = JSON.parse(JSON.stringify(this.state.currencies))
        let newArray = []

        for(const item of tmpArray){
            if(item.currency.match(new RegExp(value, 'i')) != null){
                newArray.push(item)
            }
        }

        this.setState({
            viewCurrencies: newArray
        })
    }

    render() {
        firebase.analytics().setCurrentScreen('Settings.LocalCurrencyScreen')

        const { local_currency: localCurrency } = this.props.settingsStore.data

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={ strings('settings.other.localCurrency') }
                    searchInputCallback={this.searchInputCallback}
                />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__content}>
                        <View style={styles.block}>
                                {
                                    this.state.viewCurrencies.map((item, index) => {
                                        return (
                                            <View style={styles.block__content} key={index}>
                                                <TouchableOpacity
                                                    style={{...styles.block__item}}
                                                    onPress={() => this.setLocalCurrency(item.currencyCode)}
                                                    key={index}
                                                    disabled={item.currencyCode === localCurrency}>
                                                    <View style={styles.block__item__content}>
                                                        <Text style={styles.block__text}>{ strings(`currencyList.${item.currencyCode}.currency`) }{ ` (${item.currencyCode})` }</Text>
                                                    </View>
                                                    <View style={checkBox.styleBox}>
                                                        { item.currencyCode === localCurrency ?
                                                            <View style={{ position: 'relative', top: Platform.OS === 'ios' ? 0 : 0 }}>
                                                                <IoniconsIcons name='ios-checkmark' size={30} color='#7127ac' />
                                                            </View> : null
                                                        }
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        )
                                    })
                                }
                        </View>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const styles_ = {
    array: ["#f9f9f9","#f9f9f9"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const checkBox = {
    array: ["#fff","#fff"],
    array_: ["#43156d","#7027aa"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 },
    styleBox: {
        alignItems: 'center',

        width: 30,
        height: 30,
    },
    styleGradient: {
        width: 20,
        height: 20,
        borderRadius: 4
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore,
        fiatRatesStore: state.fiatRatesStore,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(LocalCurrencyScreen)

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 110,
    },
    wrapper__top: {
        height: 145,
        marginBottom: 35
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 35
    },
    title: {
        position: 'absolute',
        top: 75,
        width: '100%',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#f4f4f4',
        textAlign: 'center'
    },
    block__content: {
        paddingLeft: 5,
        paddingRight: 5,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
        backgroundColor: '#fff',
        borderRadius: 40,
    },
    block__title: {
        paddingLeft: 15,
        marginBottom: 5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127ac'
    },
    block__item: {
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        height: 40,
        paddingLeft: 8,
        paddingRight: 8,
    },
    block__item__content: {
        paddingTop: 5,
        paddingBottom: 5
    },
    block__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#404040'
    },
    block__subtext: {
        marginTop: -6,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 11,
        color: '#999999'
    },
    block__text__right: {
        marginLeft: 'auto',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#999999'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },
    icon: {
        marginRight: 15,
        marginBottom: 1,
        color: '#999999'
    },
}
