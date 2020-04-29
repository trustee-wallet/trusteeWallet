/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, TouchableOpacity, Text, Platform } from 'react-native'

import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'

import Ionicons from 'react-native-vector-icons/Ionicons'

import NavStore from '../../../components/navigation/NavStore'
import GradientView from '../../../components/elements/GradientView'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import ToolTips from '../../../components/elements/ToolTips'

import { setSelectedAccount, setSelectedCryptoCurrency } from '../../../appstores/Stores/Main/MainStoreActions'
import currencyActions from '../../../appstores/Stores/Currency/CurrencyActions'

import Log from '../../../services/Log/Log'
import prettyNumber from '../../../services/UI/PrettyNumber/PrettyNumber'

import { strings } from '../../../services/i18n'
import LetterSpacing from '../../../components/elements/LetterSpacing'

class CryptoCurrency extends Component {

    handleCurrencySelect = async () => {

        const { cryptoCurrency } = this.props

        try {

            Log.log('HomeScreen.Currency handleCurrencySelect inited ', cryptoCurrency)

            setSelectedCryptoCurrency(cryptoCurrency)

            await setSelectedAccount()

            Log.log('HomeScreen.Currency handleCurrencySelect finished ', cryptoCurrency)

            NavStore.goNext('AccountScreen')

        } catch (e) {
            Log.err('HomeScreen.Currency handleCurrencySelect error ' + e.message, cryptoCurrency)
        }
    }

    renderBalance = (account, cryptoCurrency) => {
        try {

            const isSynchronized = currencyActions.checkIsCurrencySynchronized({account, cryptoCurrency})

            if (!isSynchronized) {
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.cryptoList__text, { marginRight: 5 }]}>
                            {strings('homeScreen.synchronizing')}
                        </Text>
                        <View>
                            {Platform.OS === 'ios' ? <UIActivityIndicator size={10} color='#404040'/> : <MaterialIndicator size={10} color='#404040'/>}
                        </View>
                    </View>
                )
            }

            return <LetterSpacing text={prettyNumber(account.balancePretty, 5, account.balancePretty < 1) + ' ' + cryptoCurrency.currencySymbol} textStyle={styles.cryptoList__text} letterSpacing={0.5}/>
        } catch (e) {
            Log.err('HomeScreen.Currency renderBalance ' + e.message)
            return <View/>
        }
    }

    renderTooltip = (props) => {

        if (typeof props === 'undefined') {
            return <View/>
        }

        const walletHash = props.selectedWallet.walletHash
        const accountList = props.accountList[walletHash]
        const cryptoCurrency = props.cryptoCurrency

        const currencyCode = cryptoCurrency.currencyCode || 'BTC'
        if (typeof accountList === 'undefined' || typeof accountList[currencyCode] === 'undefined') {
            return <View/>
        }
        const account = accountList[currencyCode]

        let ratePrep = account.basicCurrencyRate
        if (ratePrep > 0) {
            ratePrep = prettyNumber(ratePrep, 2, ratePrep < 1)
        }

        const priceChangePercentage24h = cryptoCurrency.priceChangePercentage24h * 1 || 0
        const priceChangePercentage24hPrep = (priceChangePercentage24h).toFixed(2).toString().replace('-', '') + String.fromCodePoint(parseInt('2006', 16)) + '%'

        let basicBalancePrep = account.basicCurrencyBalance
        if (basicBalancePrep) {
            basicBalancePrep = prettyNumber(basicBalancePrep, 2, basicBalancePrep < 1).toString()
        }

        return (
            <View style={styles.container}>
                <View style={{ position: 'relative' }}>
                    <View style={{
                        position: 'relative',

                        marginBottom: 15,
                        marginTop: 5,
                        marginLeft: 16,
                        marginRight: 16,
                        backgroundColor: '#fff',
                        borderRadius: 16,

                        zIndex: 2
                    }}>
                        <TouchableOpacity style={styles.cryptoList__item} {...props} onPress={() => this.handleCurrencySelect(props.accounts)}>
                            <GradientView
                                style={styles.cryptoList__item__content}
                                array={styles_.cryptoList__item.array}
                                start={styles_.cryptoList__item.start}
                                end={styles_.cryptoList__item.end}>
                                <CurrencyIcon currencyCode={currencyCode}
                                              containerStyle={styles.cryptoList__icoWrap}
                                              markStyle={styles.cryptoList__icon__mark}
                                              markTextStyle={styles.cryptoList__icon__mark__text}
                                              iconStyle={styles.cryptoList__icon}/>

                                <View style={styles.cryptoList__info}>
                                    <Text style={styles.cryptoList__title}>
                                        {cryptoCurrency.currencyName}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <LetterSpacing text={account.basicCurrencySymbol + ' ' + ratePrep.toString()} textStyle={styles.cryptoList__text} letterSpacing={0.5} />
                                        {
                                            typeof priceChangePercentage24h !== 'undefined' && priceChangePercentage24h !== null && priceChangePercentage24h !== 0 ?
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={[styles.cryptoList__text, { marginHorizontal: 3 }]}>
                                                        |
                                                    </Text>
                                                    <Text style={[styles.cryptoList__text, { marginRight: 3 }]}>
                                                        {priceChangePercentage24hPrep}
                                                    </Text>
                                                    <View style={styles.cryptoList__arrow}>
                                                        <Ionicons name={priceChangePercentage24h > 0 ? 'ios-arrow-round-up' : 'ios-arrow-round-down'} size={18} color={priceChangePercentage24h > 0 ? '#31D182' : '#fc5088'}/>
                                                    </View>
                                                </View> : null
                                        }
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cryptoList__title}>
                                        {account.basicCurrencySymbol} {basicBalancePrep}
                                    </Text>
                                    {this.renderBalance(account, cryptoCurrency)}
                                </View>
                            </GradientView>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.shadow}>
                        <View style={styles.shadow__item}/>
                    </View>
                </View>
            </View>
        )
    }

    render() {
        const { cryptoCurrency, settingsStore, accountList, selectedWallet } = this.props

        return cryptoCurrency.currencyCode === 'BTC'
            ?
            <ToolTips animatePress={true} height={100} mainComponentProps={{ cryptoCurrency, settingsStore, accountList, selectedWallet }} disabled={true} MainComponent={this.renderTooltip} type={'HOME_SCREEN_CRYPTO_BTN_TIP'} nextCallback={this.handleCurrencySelect}/>
            :
            this.renderTooltip({ cryptoCurrency, settingsStore, accountList, selectedWallet })
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        settingsStore: state.settingsStore,
        accountList: state.accountStore.accounts
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CryptoCurrency)

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
        shadowColor: '#000'
    },
    cryptoList__item__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,

        backgroundColor: '#fff'
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
        lineHeight: 20,
        fontFamily: 'SFUIDisplay-Regular'
    },
    cryptoList__info: {
        flex: 1
    },
    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 15,
        elevation: 0,
        shadowColor: '#fff'
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },
    cryptoList__arrow: {
        marginRight: 3
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

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    }
}
