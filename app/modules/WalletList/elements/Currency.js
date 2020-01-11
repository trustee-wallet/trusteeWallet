/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, TouchableOpacity, Text, Platform } from 'react-native'

import NavStore from '../../../components/navigation/NavStore'
import GradientView from '../../../components/elements/GradientView'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import ToolTips from '../../../components/elements/ToolTips'

import { setSelectedAccount, setSelectedCryptocurrency } from '../../../appstores/Actions/MainStoreActions'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'
import utils from '../../../services/utils'

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

    renderTooltip = (props) => {

        if(typeof props == 'undefined'){
            return <View></View>
        }

        const { cryptocurrency } = props
        const { localCurrencySymbol } = props.fiatRatesStore
        const tmpCurrency = JSON.parse(JSON.stringify(cryptocurrency))

        let amount = +tmpCurrency.currencyBalanceAmount
        amount = amount.toFixed(5)
        amount = amount * 1

        let fiatEquivalent = cryptocurrency.currency_rate_usd * cryptocurrency.currencyBalanceAmount

        return (
            <View style={styles.container}>
                <View style={{ position: 'relative' }}>
                    <View style={{
                        position: "relative",

                        marginBottom: 15,
                        marginTop: 5,
                        marginLeft: 16,
                        marginRight: 16,
                        backgroundColor: "#fff",
                        borderRadius: 16,

                        zIndex: 2
                    }}>
                        <TouchableOpacity style={styles.cryptoList__item} {...props} onPress={() => this.handleCurrencySelect()}>
                            <GradientView
                                style={styles.cryptoList__item__content}
                                array={styles_.cryptoList__item.array}
                                start={styles_.cryptoList__item.start}
                                end={styles_.cryptoList__item.end}>
                                <CurrencyIcon currencyCode={cryptocurrency.currencyCode}
                                              containerStyle={styles.cryptoList__icoWrap}
                                              markStyle={styles.cryptoList__icon__mark}
                                              markTextStyle={styles.cryptoList__icon__mark__text}
                                              iconStyle={styles.cryptoList__icon}/>

                                <View style={styles.cryptoList__info}>
                                    <Text style={styles.cryptoList__title}>
                                        {cryptocurrency.currencyName}
                                    </Text>
                                    <Text style={styles.cryptoList__text}>
                                        { localCurrencySymbol } {cryptocurrency.currency_rate_usd === 0 ? 0 : utils.prettierNumber(FiatRatesActions.toLocalCurrency(cryptocurrency.currency_rate_usd, false), 2).toString().split('').join('\u200A'.repeat(1)) }
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cryptoList__title}>
                                        { localCurrencySymbol } {cryptocurrency.currency_rate_usd * cryptocurrency.currencyBalanceAmount === 0 ? 0 : utils.prettierNumber(FiatRatesActions.toLocalCurrency(fiatEquivalent, false), 2)}
                                    </Text>
                                    <Text style={styles.cryptoList__text}>
                                        { amount.toString().split('').join('\u200A'.repeat(1)) } { cryptocurrency.currencySymbol }
                                    </Text>
                                </View>
                            </GradientView>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.shadow}>
                        <View style={styles.shadow__item} />
                    </View>
                </View>
            </View>
        )
    }

    render() {
        const { currency } = this.props
        const { fiatRatesStore } = this.props
        return currency.currencyCode === 'BTC' ? <ToolTips animatePress={true} height={100} mainComponentProps={{ cryptocurrency: currency, fiatRatesStore }} disabled={true} MainComponent={this.renderTooltip} type={'HOME_SCREEN_CRYPTO_BTN_TIP'} nextCallback={this.handleCurrencySelect} /> : this.renderTooltip({ cryptocurrency: currency, fiatRatesStore })
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
        array: ['#fff', '#f4f4f4'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
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
        borderRadius: 16,
        shadowColor: '#000',
    },
    cryptoList__item__bg: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,

        backgroundColor: "#fff"
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        paddingLeft: 15,

        borderRadius: 16
    },
    cryptoList__title: {
        color: '#404040',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
    },
    cryptoList__info: {
        flex: 1
    },
    cryptoList__icoWrap: {
        width: 42,
        height: 42,
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
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    shadow__item: {

        marginHorizontal: 20,
        marginTop: 25,
        height: Platform.OS === 'ios' ? 50 : 43,

        backgroundColor: "#fff",

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10,
    },
}
