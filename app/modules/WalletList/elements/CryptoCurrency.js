/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    StyleSheet
} from 'react-native'

import { SwipeRow } from 'react-native-swipe-list-view'

import RoundButton from '@app/components/elements/new/buttons/RoundButton'

import { getAccountCurrency } from '@app/appstores/Stores/Account/selectors'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import { getStakingCoins } from '@app/appstores/Stores/Main/selectors'

import Log from '@app/services/Log/Log'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { SIZE, handleCurrencySelect } from '../helpers';

import CryptoCurrencyContent from './CryptoCurrencyContent'


class CryptoCurrency extends React.PureComponent {

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
            account = { basicCurrencyRate: '', basicCurrencyBalance: '', basicCurrencySymbol: '', balancePretty: '', balanceStakedPretty: '', basicCurrencyBalanceNorm: '' }
        }

        let ratePrep = account.basicCurrencyRate
        if (ratePrep > 0) {
            ratePrep = BlocksoftPrettyNumbers.makeCut(ratePrep, 2).separated
            if (ratePrep.indexOf('.') === 1) {
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

        const availableStaking = Object.keys(this.props.stakingCoins).includes(currencyCode)

        return (
            <View style={styles.container}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <View style={[styles.shadow__item__background, { backgroundColor: colors.homeScreen.listItemShadowBg }]} />
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cryptoList__item}
                    onPress={() => handleCurrencySelect(this.props)}
                    onLongPress={() => this.props.constructorMode ? handleCurrencySelect(this.props) : null}
                    delayLongPress={this.props.constructorMode ? 100 : null}
                >
                    <CryptoCurrencyContent
                        currencyCode={currencyCode}
                        cryptoCurrency={cryptoCurrency}
                        isSynchronized={isSynchronized}
                        isBalanceVisible={isBalanceVisible}
                        account={account}
                        basicBalancePrep={basicBalancePrep}
                        ratePrep={ratePrep}
                        priceChangePercentage24h={priceChangePercentage24h}
                        priceChangePercentage24hPrep={priceChangePercentage24hPrep}
                        constructorMode={this.props.constructorMode}
                        onDrag={this.props.onDrag}
                        availableStaking={availableStaking}
                        stakingCoins={this.props.stakingCoins}
                    />
                </TouchableOpacity>
            </View>
        )
    };

    renderHiddenCashbackLayer = (item) => {
        return (
            <View style={styles.hiddenLayer__container}>
                <View style={styles.hiddenLayer__leftButtons__wrapper}>
                    <RoundButton
                        type="receive"
                        containerStyle={styles.hiddenLayer__roundButton}
                        onPress={() => handleCurrencySelect(this.props, 'CashbackScreen')}
                        noTitle
                    />
                </View>
                <RoundButton
                    type="hide"
                    containerStyle={styles.hiddenLayer__roundButton}
                    onPress={() => this.props.handleHide(item)}
                    noTitle
                />
            </View>
        );
    }

    renderHiddenNFTLayer = (item) => {
        return (
            <View style={styles.hiddenLayer__container}>
                <View style={styles.hiddenLayer__leftButtons__wrapper}>
                    <RoundButton
                        type="receive"
                        containerStyle={styles.hiddenLayer__roundButton}
                        onPress={() => handleCurrencySelect(this.props, 'NftReceive')}
                        noTitle
                    />
                    <RoundButton
                        type="edit"
                        containerStyle={styles.hiddenLayer__roundButton}
                        onPress={() => handleCurrencySelect(this.props, 'NftAddAssetScreen')}
                        noTitle
                    />
                </View>
                <RoundButton
                    type="hide"
                    containerStyle={styles.hiddenLayer__roundButton}
                    onPress={() => this.props.handleHide(item)}
                    noTitle
                />
            </View>
        );
    }

    renderNFTLayer = (props) => {
        const { colors } = this.context
        const cryptoCurrency = props.cryptoCurrency

        const currencyCode = cryptoCurrency.currencyCode || 'BTC'


        return (
            <View style={styles.container}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <View style={[styles.shadow__item__background, { backgroundColor: colors.homeScreen.listItemShadowBg }]} />
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cryptoList__item}
                    onPress={() => handleCurrencySelect(this.props)}
                    onLongPress={() => this.props.constructorMode ? handleCurrencySelect(this.props) : null}
                    delayLongPress={this.props.constructorMode ? 100 : null}
                >
                    <CryptoCurrencyContent
                        type='NFT'
                        currencyCode={currencyCode}
                        cryptoCurrency={cryptoCurrency}
                        constructorMode={this.props.constructorMode}
                        onDrag={this.props.onDrag}
                    />
                </TouchableOpacity>
            </View>
        )
    };

    render() {
        // TODO: change condition - still need?
        if (typeof this.props === 'undefined') return <View />

        if (this.props.cryptoCurrency.currencyCode === 'NFT') {
            return (
                <SwipeRow
                    disableLeftSwipe={this.props.constructorMode}
                    disableRightSwipe={this.props.constructorMode}
                    leftOpenValue={140}
                    rightOpenValue={-70}
                    stopLeftSwipe={160}
                    stopRightSwipe={-90}
                    swipeToOpenPercent={5}
                    swipeToClosePercent={5}
                    setScrollEnabled={this.props.setScrollEnabled}
                >
                    {this.renderHiddenNFTLayer(this.props.cryptoCurrency)}
                    {this.renderNFTLayer(this.props)}
                </SwipeRow>
            );
        } else if (this.props.cryptoCurrency.currencyCode === 'CASHBACK') {
            return (
                <SwipeRow
                    disableLeftSwipe={this.props.constructorMode}
                    disableRightSwipe={this.props.constructorMode}
                    leftOpenValue={70}
                    rightOpenValue={-70}
                    stopLeftSwipe={90}
                    stopRightSwipe={-90}
                    swipeToOpenPercent={5}
                    swipeToClosePercent={5}
                    setScrollEnabled={this.props.setScrollEnabled}
                >
                    {this.renderHiddenCashbackLayer()}
                    {this.renderVisibleLayer(this.props)}
                </SwipeRow>
            )
        }

        return (
            <SwipeRow
                disableLeftSwipe={this.props.constructorMode}
                disableRightSwipe={this.props.constructorMode}
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
    account: getAccountCurrency(state, props),
    stakingCoins: getStakingCoins(state)
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
    dragBtns: {
        marginLeft: 18
    }
})
