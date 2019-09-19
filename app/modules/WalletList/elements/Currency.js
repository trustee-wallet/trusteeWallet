/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, TouchableOpacity, Text } from 'react-native'

import NavStore from '../../../components/navigation/NavStore'
import GradientView from '../../../components/elements/GradientView'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'

import { setSelectedAccount, setSelectedCryptocurrency } from '../../../appstores/Actions/MainStoreActions'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'

class Currency extends Component {

    constructor() {
        super()
        this.state = {}
    }

    handleCurrencySelect = async () => {

        const { currency } = this.props

        setSelectedCryptocurrency(currency)

        await setSelectedAccount()

        NavStore.goNext('AccountScreen')
    }

    render() {

        const { currency } = this.props
        const { localCurrencySymbol } = this.props.fiatRatesStore
        const tmpCurrency = JSON.parse(JSON.stringify(currency))

        let amount = +tmpCurrency.currencyBalanceAmount
        amount = amount.toFixed(5)
        amount = amount * 1

        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={() => this.handleCurrencySelect()}>
                    <View style={styles.cryptoList__item}>
                        <GradientView
                            style={styles.cryptoList__item__content}
                            array={styles_.cryptoList__item.array}
                            start={styles_.cryptoList__item.start}
                            end={styles_.cryptoList__item.end}>


                            <CurrencyIcon currencyCode={currency.currencyCode}
                                          containerStyle={styles.cryptoList__icoWrap}
                                          markStyle={styles.cryptoList__icon__mark}
                                          markTextStyle={styles.cryptoList__icon__mark__text}
                                          iconStyle={styles.cryptoList__icon}/>

                            <View style={styles.cryptoList__info}>
                                <Text style={styles.cryptoList__title}>
                                    {currency.currencyName}
                                </Text>
                                <Text style={styles.cryptoList__text}>
                                    { localCurrencySymbol } {currency.currency_rate_usd === 0 ? 0 : FiatRatesActions.toLocalCurrency(currency.currency_rate_usd)}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cryptoList__title}>
                                    { amount } { currency.currencySymbol }
                                </Text>
                                <Text style={styles.cryptoList__text}>
                                     { localCurrencySymbol } {currency.currency_rate_usd * currency.currencyBalanceAmount === 0 ? 0 : FiatRatesActions.toLocalCurrency(currency.currency_rate_usd * currency.currencyBalanceAmount)}
                                </Text>
                            </View>
                            <View>

                            </View>
                        </GradientView>
                    </View>

                </TouchableOpacity>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        account: state.mainStore.selectedAccount,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Currency)

const styles_ = {
    cryptoList__icoWrap_bitcoin: {
        array: ['#e67947', '#f9f871'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_eth: {
        array: ['#145de3', '#4ec8f7'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_omni: {
        array: ['#3ac058', '#27e3ae']
    },
    cryptoList__ico: {
        color: '#FBFFFF',
        size: 24
    },
    cryptoList__item: {
        array: ['transparent', 'transparent'],
        start: { x: 0.0, y: 0.5 }
    },
    bg: {
        array: ['#fff', '#F8FCFF'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 0, y: 1 }
    }
}

const styles = {
    cryptoList__item: {
        justifyContent: 'center',
        height: 70,
        marginBottom: 10,
        marginTop: 5,
        marginLeft: 20,
        marginRight: 20,
        paddingLeft: 15,
        borderRadius: 60,
        shadowColor: '#000',
        backgroundColor: '#fff',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    cryptoList__item__content: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cryptoList__title: {
        color: '#404040',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    cryptoList__info: {
        flex: 1
    },
    cryptoList__icoWrap: {
        width: 40,
        height: 40,
        marginRight: 15,
        elevation: 0,
        shadowColor: "#fff",
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5,
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    }
}
