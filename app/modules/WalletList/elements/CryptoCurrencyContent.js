/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import { View, Text, Platform, StyleSheet } from 'react-native'

import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'

import Ionicons from 'react-native-vector-icons/Ionicons'

import GradientView from '@app/components/elements/GradientView'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import CustomIcon from '@app/components/elements/CustomIcon'

import { HIT_SLOP } from '@app/theme/HitSlop'
import { useTheme } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { SIZE } from '../helpers';
import PercentView from '@app/components/elements/new/PercentView'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const renderSynchronization = () => {
    const {
        colors
    } = useTheme()

    return (
        <View style={styles.cryptoList__syncRow}>
            <Text style={[styles.cryptoList__text, { marginRight: 5, color: colors.common.text2 }]}>
                {strings('homeScreen.synchronizing')}
            </Text>
            <View>
                {Platform.OS === 'ios'
                    ? <UIActivityIndicator size={10} color='#404040' />
                    : <MaterialIndicator size={10} color='#404040' />}
            </View>
        </View>
    )
}

const CryptoCurrencyContent = (props) => {

    const {
        colors, GRID_SIZE
    } = useTheme()

    const {
        currencyCode,
        cryptoCurrency,
        isSynchronized,
        isBalanceVisible,
        account,
        basicBalancePrep,
        ratePrep,
        priceChangePercentage24h,
        priceChangePercentage24hPrep,
        animation,
        availableStaking,
        stakingCoins
    } = props

    return (
        <GradientView
            style={[styles.cryptoList__item__content, { paddingLeft: animation ? SIZE - 4 : SIZE }]}
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

            {props.type === 'NFT' ?
                <View style={styles.cryptoList__info}>
                    <View style={styles.cryptoList__currency__balance}>
                        <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>
                            {cryptoCurrency.currencySymbol}
                        </Text>
                    </View>

                    <View style={styles.cryptoList__currency__rate}>
                        <Text style={[styles.cryptoList__text, { color: colors.common.text2 }]}>
                            {cryptoCurrency.currencyName}
                        </Text>
                    </View>
                </View>
                :
                <View style={styles.cryptoList__info}>
                    <View style={styles.cryptoList__currency__balance}>
                        <View style={styles.stakingPercent}>
                            <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>
                                {cryptoCurrency.currencySymbol}
                            </Text>
                            {availableStaking ?
                                <PercentView
                                    value={stakingCoins[currencyCode]}
                                    staking
                                    containerStyle={{ marginTop: -2 }}
                                />
                                : null}
                        </View>
                        {typeof isSynchronized !== 'undefined'
                            ? !isSynchronized
                                ? renderSynchronization()
                                : isBalanceVisible
                                    ? <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>{BlocksoftPrettyNumbers.makeCut(account.balancePretty, 5,  'WalletList', false).separated}</Text>
                                    : <Text style={[styles.cryptoList__title, { color: colors.common.text1 }]}>****</Text>
                            : null}
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

                    {props.constructorMode || ratePrep === '' ? null :
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
                    }
                </View>
            }
            {!props.constructorMode ? null :
                <TouchableDebounce
                    style={{ marginLeft: GRID_SIZE }}
                    activeOpacity={0.7}
                    onPressIn={props.onDrag}
                    hitSlop={HIT_SLOP}
                >
                    <CustomIcon name='dots' color={colors.common.text1} size={20} />
                </TouchableDebounce>
            }
        </GradientView>
    )
}

export default CryptoCurrencyContent

const styles = StyleSheet.create({
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
        alignItems: 'flex-end'
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
    stakingPercent: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    }
})
