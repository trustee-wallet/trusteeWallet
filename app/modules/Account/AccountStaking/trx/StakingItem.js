/**
 * @version 0.50
 * @author yura
 */

import React from 'react'
import { View, Text, Platform, StyleSheet } from 'react-native'
import moment from 'moment'

import GradientView from '@app/components/elements/GradientView'

import { useTheme } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
// import { capitalize } from '@app/services/UI/Capitalize/Capitalize'

const StakingItem = (props) => {
    const { colors } = useTheme()

    const { amount, currencyCode, color, status, inProcess, type, date } = props

    return (
        <View style={styles.transaction}>
            <View style={[styles.transaction__col, styles.transaction__col2]}>
                <View style={styles.transaction__top}>
                    <Text style={[styles.transaction__top__title, { color: colors.accountScreen.transactions.transactionTitleColor }]}>{type}</Text>
                </View>
                <View style={[styles.transaction__content, { backgroundColor: colors.accountScreen.transactions.transactionContentBack }]}>
                    <View style={[styles.transaction__content__item, { backgroundColor: colors.accountScreen.transactions.transactionContentBack }]}>
                        <GradientView
                            style={[styles.transaction__item, styles.transaction__item_active]}
                            array={colors.accountScreen.transactions.transactionGradientArray}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 1, y: 1 }}>
                            <View style={styles.transaction__item__content}>
                                <View style={{ justifyContent: 'center', flex: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                        <Text style={[styles.transaction__item__title, { color: colors.common.text1 }]} numberOfLines={1}>
                                            {amount}
                                        </Text>
                                        <Text style={[styles.transaction__item__title__subtitle, { color: color }]}>{currencyCode}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.willAvailable, { color: colors.common.text2 }]}>
                                    {strings('account.stakingTRX.willAvailable') + '\n' + moment(date).format('DD.MM.Y HH:mm')}
                                </Text>
                            </View>
                        </GradientView>
                    </View>

                    <View style={styles.shadow}>
                        <View style={[styles.shadow__item, { shadowColor: inProcess ? color : null }]} />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default StakingItem

const styles = StyleSheet.create({
    transaction: {
        flexDirection: 'row',
        height: 110,

        overflow: 'hidden'
    },
    transaction__content: {
        position: 'relative',

        borderRadius: 18
    },
    transaction__content__item: {
        position: 'relative',

        borderRadius: 18,

        zIndex: 2
    },
    transaction__col1: {
        alignItems: 'center',

        width: 48,
        paddingTop: 54,

        overflow: 'hidden'
    },
    transaction__colOld: {
        alignItems: 'center',

        width: 20,
        paddingTop: 54,

        overflow: 'hidden'
    },
    transaction__col2: {
        flex: 1,

        paddingTop: 4,
        paddingBottom: 16,
        marginLeft: 4,
        marginRight: 4
    },
    transaction__top: {
        flexDirection: 'row',
        alignItems: 'center',

        marginLeft: 16,
        marginBottom: 4
    },
    transaction__top__title: {
        marginRight: 8,

        fontFamily: 'Montserrat-Bold',
        fontSize: 14
    },
    transaction__item: {
        maxHeight: 62,
        paddingHorizontal: 16,

        borderRadius: 16,

        overflow: 'hidden'
    },
    transaction__item_active: {
        maxHeight: 1000
    },
    transaction__item__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        height: 62
    },
    transaction__item__title: {
        marginRight: 5,

        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18
    },
    transaction__item__title__subtitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#1EB3E4'
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
        flex: 1,

        marginHorizontal: 4,
        marginTop: 11,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

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
    },
    willAvailable: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'right'
    }
})
