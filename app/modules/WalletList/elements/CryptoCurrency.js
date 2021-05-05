/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    Text,
    Platform,
    StyleSheet
} from 'react-native'

import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'
import { SwipeRow } from 'react-native-swipe-list-view'

import Ionicons from 'react-native-vector-icons/Ionicons'

import RoundButton from '@app/components/elements/new/buttons/RoundButton'

import NavStore from '@app/components/navigation/NavStore'
import GradientView from '@app/components/elements/GradientView'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'

import { setSelectedAccount, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'
import { getAccountCurrency } from '@app/appstores/Stores/Account/selectors'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

import Log from '@app/services/Log/Log'

import { strings } from '@app/services/i18n'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import { SIZE } from '../helpers';
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

let CACHE_CLICK = false
class CryptoCurrency extends React.PureComponent {

    handleCurrencySelect = async () => {
        if (CACHE_CLICK) return

        const { cryptoCurrency } = this.props

        let status = ''
        CACHE_CLICK = true
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

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }
        CACHE_CLICK = false
    }

    renderSynchronization = () => (
        <View style={styles.cryptoList__syncRow}>
            <Text style={[styles.cryptoList__text, { marginRight: 5, color: this.context.colors.common.text2 }]}>
                {strings('homeScreen.synchronizing')}
            </Text>
            <View>
                {Platform.OS === 'ios'
                    ? <UIActivityIndicator size={10} color='#404040' />
                    : <MaterialIndicator size={10} color='#404040' />}
            </View>
        </View>
    )

    renderHiddenLayer = () => {
        return (
            <View style={styles.hiddenLayer__container}>
                <View style={styles.hiddenLayer__leftButtons__wrapper}>
                    <RoundButton
                        type="receive"
                        containerStyle={styles.hiddenLayer__roundButton}
                        onPress={() => this.props.handleReceive(this.props.account)}
                        noTitle
                    />
                    <RoundButton
                        type="send"
                        containerStyle={styles.hiddenLayer__roundButton}
                        onPress={() => this.props.handleSend(this.props.account)}
                        noTitle
                    />
                </View>
                <RoundButton
                    type="hide"
                    containerStyle={styles.hiddenLayer__roundButton}
                    onPress={this.props.handleHide}
                    noTitle
                />
            </View>
        );
    };

    renderVisibleLayer = (props) => {
        const { colors } = this.context
        const cryptoCurrency = props.cryptoCurrency
        const isBalanceVisible = this.props.isBalanceVisible;

        const currencyCode = cryptoCurrency.currencyCode || 'BTC'
        let account = props.account
        if (typeof account === 'undefined') {
            account = { basicCurrencyRate: '', basicCurrencyBalance: '', basicCurrencySymbol: '', balancePretty: '', basicCurrencyBalanceNorm: '' }
        }

        let ratePrep = account.basicCurrencyRate
        if (ratePrep > 0) {
            ratePrep = BlocksoftPrettyNumbers.makeCut(ratePrep, 2).separated
            if (ratePrep.indexOf('0.0') === 0) {
                ratePrep = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyRate, 4).separated
            }
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
            <View style={styles.container}>
                <View style={styles.shadow__container}>
                    <View style={[styles.shadow__item, this.props.isActive && styles.shadow__item__active]} />
                </View>
                <View style={[styles.shadow__item__background, { backgroundColor: colors.homeScreen.listItemShadowBg }]} />
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cryptoList__item}
                    onPress={() => this.handleCurrencySelect(props.accounts)}
                    onLongPress={this.props.onDrag}
                    delayLongPress={3000}
                >
                    <GradientView
                        style={styles.cryptoList__item__content}
                        array={colors.homeScreen.listItemGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
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
                                <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>
                                    {cryptoCurrency.currencySymbol}
                                </Text>
                                {
                                    typeof isSynchronized !== 'undefined'
                                        ? !isSynchronized
                                            ? this.renderSynchronization()
                                            : isBalanceVisible
                                                ? <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>{BlocksoftPrettyNumbers.makeCut(account.balancePretty).separated}</Text>
                                                : <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>****</Text>
                                        : null
                                }
                            </View>

                            <View style={styles.cryptoList__currency__rate}>
                                <Text style={[styles.cryptoList__text, { color: colors.common.text2 }]}>
                                    {cryptoCurrency.currencyName}
                                </Text>
                                {isSynchronized === true && isBalanceVisible && (
                                    <Text style={[styles.cryptoList__text, { color: colors.common.text2 }]}>
                                        {`${account.basicCurrencySymbol} ${basicBalancePrep}`}
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.cryptoList__currency__changes, { borderColor: colors.homeScreen.listItemSeparatorLine }]}>
                                <View style={styles.cryptoList__currency__changes__rate}>
                                    {priceChangePercentage24h !== null && priceChangePercentage24h !== undefined && priceChangePercentage24h !== 0 && (
                                        <Ionicons
                                            name={priceChangePercentage24h > 0 ? 'ios-arrow-round-up' : 'ios-arrow-round-down'}
                                            color={priceChangePercentage24h > 0 ? colors.homeScreen.listItemArrowUp : colors.homeScreen.listItemArrowDown}
                                            style={styles.cryptoList__arrow}
                                            size={18}
                                        />
                                    )}
                                    <Text style={[styles.cryptoList__text, { color: colors.common.text2 }]}>
                                        {`${account.basicCurrencySymbol} ${ratePrep.toString()}`}
                                    </Text>
                                </View>
                                <Text style={[styles.cryptoList__text, { color: colors.common.text2 }]}>
                                    {priceChangePercentage24h !== null && priceChangePercentage24h !== undefined && `${priceChangePercentage24h < 0 ? '- ' : ''}${priceChangePercentage24hPrep}`}
                                </Text>
                            </View>
                        </View>

                    </GradientView>
                </TouchableOpacity>
            </View>
        )
    };

    render() {
        // TODO: change condition - still need?
        if (typeof this.props === 'undefined') return <View />

        return (
            <SwipeRow
                leftOpenValue={140}
                rightOpenValue={-70}
                stopLeftSwipe={160}
                stopRightSwipe={-90}
                swipeToOpenPercent={5}
                swipeToClosePercent={5}
                setScrollEnabled={this.props.setScrollEnabled}
            >
                {this.renderHiddenLayer()}
                {this.renderVisibleLayer(this.props)}
            </SwipeRow>
        );
    }
}

CryptoCurrency.contextType = ThemeContext

const mapStateToProps = (state, props) => ({
    account: getAccountCurrency(state, props)
})

export default connect(mapStateToProps)(CryptoCurrency)


const styles = StyleSheet.create({
    container: {
        marginHorizontal: SIZE,
        marginVertical: SIZE / 2,
    },
    shadow__container: {
        position: 'absolute',
        paddingTop: 1,
        paddingBottom: 6,
        paddingRight: 3,
        paddingLeft: 3,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    shadow__item: {
        flex: 1,
        borderRadius: SIZE,
        elevation: 10,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
    },
    shadow__item__active: {
        shadowOffset: {
            width: 0,
            height: 7
        },
        shadowOpacity: 0.16,
        shadowRadius: 8,
        elevation: 20
    },
    shadow__item__background: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: SIZE,
    },
    cryptoList__item: {
        borderRadius: SIZE,
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        padding: SIZE,

        borderRadius: SIZE,
        zIndex: 10,
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
    hiddenLayer__container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SIZE,
        paddingHorizontal: SIZE,
    },
    hiddenLayer__leftButtons__wrapper: {
        flexDirection: 'row'
    },
    hiddenLayer__roundButton: {
        marginHorizontal: 10
    },
})
