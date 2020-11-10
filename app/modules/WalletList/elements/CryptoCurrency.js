/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, TouchableOpacity, Text, Platform, Dimensions, PixelRatio } from 'react-native'

import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'

import Ionicons from 'react-native-vector-icons/Ionicons'

import NavStore from '../../../components/navigation/NavStore'
import GradientView from '../../../components/elements/GradientView'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import ToolTips from '../../../components/elements/ToolTips'

import { setSelectedAccount, setSelectedCryptoCurrency } from '../../../appstores/Stores/Main/MainStoreActions'
import currencyActions from '../../../appstores/Stores/Currency/CurrencyActions'

import Log from '../../../services/Log/Log'

import { strings } from '../../../services/i18n'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8 // iphone 5s
}

class CryptoCurrency extends Component {

    handleCurrencySelect = async () => {

        const { cryptoCurrency } = this.props

        let status = ''
        try {

            // Log.log('HomeScreen.Currency handleCurrencySelect inited ', cryptoCurrency)

            status = 'setSelectedCryptoCurrency started'

            setSelectedCryptoCurrency(cryptoCurrency)

            status = 'setSelectedAccount started'

            await setSelectedAccount()

            // Log.log('HomeScreen.Currency handleCurrencySelect finished ', cryptoCurrency)

            NavStore.goNext('AccountScreen')

        } catch (e) {
            Log.err('HomeScreen.Currency handleCurrencySelect error ' + status + ' ' + e.message, cryptoCurrency)
        }
    }

    renderSynchrinization = () => (
        <View style={styles.cryptoList__syncRow}>
            <Text style={[styles.cryptoList__text, { marginRight: 5 }]}>
                {strings('homeScreen.synchronizing')}
            </Text>
            <View>
                {Platform.OS === 'ios'
                    ? <UIActivityIndicator size={10} color='#404040' />
                    : <MaterialIndicator size={10} color='#404040' />}
            </View>
        </View>
    )

    renderTooltip = (props) => {

        if (typeof props === 'undefined') {
            return <View />
        }

        const accountListByWallet = props.accountListByWallet
        const cryptoCurrency = props.cryptoCurrency
        const isBalanceVisible = this.props.isBalanceVisible;

        const currencyCode = cryptoCurrency.currencyCode || 'BTC'
        let account
        if (typeof accountListByWallet === 'undefined' || typeof accountListByWallet[currencyCode] === 'undefined') {
            account = { basicCurrencyRate: '', basicCurrencyBalance: '', basicCurrencySymbol: '', balancePretty: '', basicCurrencyBalanceNorm: '' }
        } else {
            account = accountListByWallet[currencyCode]
        }

        let ratePrep = account.basicCurrencyRate
        if (ratePrep > 0) {
            ratePrep = BlocksoftPrettyNumbers.makeCut(ratePrep, 2).separated
        }

        const priceChangePercentage24h = cryptoCurrency.priceChangePercentage24h * 1 || 0
        const priceChangePercentage24hPrep = (priceChangePercentage24h).toFixed(2).toString().replace('-', '') + String.fromCodePoint(parseInt('2006', 16)) + '%'

        const basicBalancePrep = account.basicCurrencyBalance

        let isSynchronized;
        try {
            isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })
        } catch (e) {
            Log.err('HomeScreen.Currency render ' + e.message)
        }

        return (
            <TouchableOpacity
                style={styles.cryptoList__item}
                onPress={() => this.handleCurrencySelect(props.accounts)}
            >

                <GradientView
                    style={styles.cryptoList__item__content}
                    array={styles_.cryptoList__item.array}
                    start={styles_.cryptoList__item.start}
                    end={styles_.cryptoList__item.end}
                >

                    <CurrencyIcon
                        currencyCode={currencyCode}
                        containerStyle={styles.cryptoList__icoWrap}
                        markStyle={styles.cryptoList__icon__mark}
                        markTextStyle={styles.cryptoList__icon__mark__text}
                        iconStyle={styles.cryptoList__icon}
                    />

                    <View style={styles.cryptoList__info}>
                        <View style={styles.cryptoList__currency__balance}>
                            <Text style={styles.cryptoList__title}>
                                {cryptoCurrency.currencySymbol}
                            </Text>
                            {
                                typeof isSynchronized !== 'undefined'
                                    ? !isSynchronized
                                        ? this.renderSynchrinization()
                                        : isBalanceVisible
                                            ? <Text style={styles.cryptoList__title}>{BlocksoftPrettyNumbers.makeCut(account.balancePretty).separated}</Text>
                                            : <Text style={styles.cryptoList__title}>****</Text>
                                    : null
                            }
                        </View>

                        <View style={styles.cryptoList__currency__rate}>
                            <Text style={styles.cryptoList__text}>
                                {cryptoCurrency.currencyName}
                            </Text>
                            {isSynchronized === true && isBalanceVisible && (
                                <Text style={styles.cryptoList__text}>
                                    {`${account.basicCurrencySymbol} ${basicBalancePrep}`}
                                </Text>
                            )}
                        </View>

                        <View style={styles.cryptoList__currency__changes}>
                            <View style={styles.cryptoList__currency__changes__rate}>
                                {priceChangePercentage24h !== null && priceChangePercentage24h !== undefined && priceChangePercentage24h !== 0 && (
                                    <Ionicons
                                        name={priceChangePercentage24h > 0 ? 'ios-arrow-round-up' : 'ios-arrow-round-down'}
                                        color={priceChangePercentage24h > 0 ? '#31D182' : '#fc5088'}
                                        style={styles.cryptoList__arrow}
                                        size={18}
                                    />
                                )}
                                <Text style={styles.cryptoList__text}>
                                    {`${account.basicCurrencySymbol} ${ratePrep.toString()}`}
                                </Text>
                            </View>
                            <Text style={styles.cryptoList__text}>
                                {priceChangePercentage24h !== null && priceChangePercentage24h !== undefined && `${priceChangePercentage24h < 0 ? '- ' : ''}${priceChangePercentage24hPrep}`}
                            </Text>
                        </View>
                    </View>

                </GradientView>
            </TouchableOpacity>
        )
    }

    render() {
        const { cryptoCurrency, settingsStore, accountListByWallet } = this.props

        return cryptoCurrency.currencyCode === 'BTC'
            ? (
                <ToolTips
                    animatePress={true}
                    height={100}
                    mainComponentProps={{ cryptoCurrency, settingsStore, accountListByWallet }}
                    disabled={true}
                    MainComponent={this.renderTooltip}
                    type={'HOME_SCREEN_CRYPTO_BTN_TIP'}
                    nextCallback={this.handleCurrencySelect}
                />
            )
            : this.renderTooltip({ cryptoCurrency, settingsStore, accountListByWallet })
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        settingsStore: state.settingsStore,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CryptoCurrency)

const styles_ = {
    cryptoList__item: {
        array: ['#fff', '#f4f4f4'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
}

const styles = {
    cryptoList__item: {
        marginHorizontal: SIZE,
        marginVertical: SIZE / 2,
        borderRadius: SIZE,
        minHeight: 102, // needed for tooltip

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
        elevation: 6,
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        padding: SIZE,

        borderRadius: SIZE,
    },
    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 12
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 50
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },
    cryptoList__info: {
        flex: 1,
    },
    cryptoList__currency__balance: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cryptoList__title: {
        color: '#404040',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
    },
    cryptoList__syncRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cryptoList__currency__rate: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    cryptoList__currency__changes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        marginTop: 10,
        paddingTop: 4
    },
    cryptoList__currency__changes__rate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cryptoList__arrow: {
        marginRight: 8
    },
}
