/**
 * @version 0.50
 * @author yura
 */

import React from 'react'
import { View, TouchableOpacity, Text, Platform } from 'react-native'

import GradientView from '@app/components/elements/GradientView'

import { BoxShadow } from 'react-native-shadow'
import { useTheme } from '@app/theme/ThemeProvider'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'

const StakingItem = (props) => {

    const { colors } = useTheme()

    const {
        address,
        amount,
        currencyCode,
        onPress,
        color,
        status,
        inProcess
    } = props

    return (
        <View style={styles.transaction}>
            <View style={[styles.transaction__col, styles.transaction__col2]}>
                <View style={styles.transaction__top}>
                    <Text style={[styles.transaction__top__title, { color: colors.accountScreen.transactions.transactionTitleColor }]}>
                        {capitalize(status)}
                    </Text>
                </View>
                <View style={[styles.transaction__content, { backgroundColor: colors.accountScreen.transactions.transactionContentBack }]}>
                    <View style={[styles.transaction__content__item, { backgroundColor: colors.accountScreen.transactions.transactionContentBack }]}>
                        <TouchableOpacity onPress={onPress}>
                            <GradientView
                                style={[styles.transaction__item, styles.transaction__item_active]}
                                array={colors.accountScreen.transactions.transactionGradientArray}
                                start={styles.transaction__item_bg.start}
                                end={styles.transaction__item_bg.end}
                            >
                                <View style={styles.transaction__item__content}>
                                    <View style={{ justifyContent: 'center', flex: 3 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                            <Text style={[styles.transaction__item__title, { color: colors.common.text1 }]} numberOfLines={1}>
                                                {amount}
                                            </Text>
                                            <Text style={[styles.transaction__item__title__subtitle, { color: color }]}>
                                                {currencyCode}
                                            </Text>
                                        </View>
                                        <Text style={[styles.transaction__item__title__subtitle, { color: '#999999' }]}>{address}</Text>
                                    </View>
                                </View>
                            </GradientView>
                        </TouchableOpacity>
                    </View>
                    {
                        inProcess && Platform.OS !== 'ios' && typeof this.state !== 'undefined' && typeof this.state.height !== 'undefined' ? (
                            <BoxShadow
                                setting={[
                                    styles.shadow__item__android,
                                    {
                                        color: color,
                                        height: this.state.height,
                                        width: this.state.width
                                    }]}
                                fromTransaction={1}
                            />
                        ) : (
                            <View style={styles.shadow}>
                                <View style={[styles.shadow__item, { shadowColor: inProcess ? color : null }]} />
                            </View>
                        )
                    }
                </View>
            </View>
        </View>
    )

}

export default StakingItem

const styles = {
    transaction: {
        flexDirection: 'row',
        height: 110,

        overflow: 'hidden',
    },
    transaction__content: {
        position: 'relative',

        borderRadius: 18
    },
    transaction__content__item: {
        position: 'relative',

        borderRadius: 18,

        zIndex: 2,
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
    transaction__circle__small: {
        width: 10,
        height: 10,
        border: 0
    },
    transaction__circle__big: {
        width: 20,
        height: 20,
        border: 3,
        backgroundInnerColor: '#f6f6f6'
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
        fontSize: 14,
    },
    transaction__top__type__icon: {
        marginTop: 2,
        fontSize: 16,
    },
    transaction__top__type: {
        marginTop: Platform.OS === 'android' ? 2.5 : 0.5,

        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
    },
    transaction__top__confirmation: {},
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
    transaction__item_bg: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
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
    transaction__item__subtitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 12,
    },
    circle: {},
    transaction__item__arrow: {
        marginLeft: .5,

        fontSize: 16
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

    shadow__item__android: {
        flex: 1,

        marginHorizontal: 4,
        marginTop: 11,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        width: 350,
        height: 63,
        border: 6,
        radius: 16,
        opacity: 0.07,
        x: 0,
        y: 0,
        style: {
            flexDirection: 'row',
            position: 'absolute',
        }
    },
    transaction__data: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
    },
}
