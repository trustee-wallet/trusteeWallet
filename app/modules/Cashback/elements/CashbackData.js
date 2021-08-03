import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import GradientView from '@app/components/elements/GradientView'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

const widthWindow = Dimensions.get('window').width

const renderBalance = (balance, cashbackCurrency) => {

    const { colors, GRID_SIZE } = useTheme()

    let tmp = BlocksoftPrettyNumbers.makeCut(balance, 7, 'AccountScreen/renderBalance').separated
    if (typeof tmp.split === 'undefined') {
        throw new Error('AccountScreen.renderBalance split is undefined')
    }

    tmp = tmp.slice(0, 11)
    const tmps = tmp.split('.')
    let balancePrettyPrep1 = tmps[0]
    let balancePrettyPrep2 = ''
    if (typeof tmps[1] !== 'undefined' && tmps[1]) {
        balancePrettyPrep1 = tmps[0] + '.'
        balancePrettyPrep2 = tmps[1]
    }

    return (
        <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE }}>
            <View style={{ ...styles.topContent__title, flexGrow: 1 }}>
                <Text style={{ ...styles.topContent__title_first, color: colors.common.text1, marginTop: 10, fontSize: 40}} numberOfLines={1} >
                    {balancePrettyPrep1}
                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, lineHeight: 40, fontSize: 20}}>
                        {balancePrettyPrep2 + ' ' + cashbackCurrency}
                    </Text>
                </Text>
            </View>
        </View>
    )
}

const CashbackData = (props) => {

    const {
        data
    } = props

    const { title, subTitle, balance, ExtraViewData } = data

    const { colors } = useTheme()

    const cashbackCurrency = 'USDT'


    return (
        <View style={styles.topContent}>

            <View style={styles.topContent__content}>

                <View style={{ flexDirection: 'row' }} >
                    <View style={styles.header}>
                        <Text style={[styles.header__title, { color: colors.common.text1 }]}>{title}</Text>
                        <Text style={styles.header__subTitle}>{subTitle}</Text>
                    </View>
                </View>

                {renderBalance(balance, cashbackCurrency)}

                {ExtraViewData && (
                    <ExtraViewData />
                )}

            </View>

            <GradientView
                style={styles.bg}
                array={colors.accountScreen.containerBG}
                start={styles.containerBG.start}
                end={styles.containerBG.end}
            />
            <View style={styles.topContent__bg}>
                <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
            </View>
        </View>
    )
}

export default CashbackData

const styles = {
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    bg: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 216,

        zIndex: 1,

        borderRadius: 16,
    },
    topContent: {
        position: 'relative',

        height: 244,
        width: widthWindow * 0.75,

        marginRight: 16,
        borderRadius: 16
    },

    topContent__content: {
        position: 'relative',
        zIndex: 2,
    },

    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 206,
        borderRadius: 16,

        zIndex: 0
    },

    shadow: {
        marginTop: 10,
        marginHorizontal: 5,

        height: '100%',
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

    topContent__top: {
        position: 'relative',
        alignItems: 'center',
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16,
    },
    topContent__title_first: {
        fontSize: 32,
        fontFamily: 'Montserrat-Medium',
        lineHeight: 40
    },
    topContent__title_last: {
        fontSize: 16,
        fontFamily: 'Montserrat-Bold',
        lineHeight: 20
    },
    header: {
        marginTop: 16,
        marginLeft: 16
    },
    header__title: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
    },
    header__subTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        lineHeight: 16,
        letterSpacing: 0.5,
        color: '#999999',
        textTransform: 'uppercase'
    },

}

