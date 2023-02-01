/**
 * @version 0.77
 * @author Vadym
 */

import React from 'react'
import { View, Text, Dimensions, TouchableOpacity } from 'react-native'

import LottieView from 'lottie-react-native'
import { connect } from 'react-redux'

import { useTheme } from '@app/theme/ThemeProvider'
import GradientView from '@app/components/elements/GradientView'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'

import { Tab1 } from '@app/modules/Cashback/elements/ExtraViewDataContent'

import { HIT_SLOP } from '@app/theme/HitSlop'

import blackLoader from '@assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@assets/jsons/animations/refreshWhite.json'
import CustomIcon from '@app/components/elements/CustomIcon'

const widthWindow = Dimensions.get('window').width

const renderBalance = (balance, cashbackCurrency) => {

    const { colors, GRID_SIZE } = useTheme()

    let tmp = BlocksoftPrettyNumbers.makeCut(balance, 7, 'CashbackScreen/renderBalance').separated
    if (typeof tmp.split === 'undefined') {
        throw new Error('CashbackScreen.renderBalance split is undefined')
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
                <Text style={{ ...styles.topContent__title_first, color: colors.common.text1, marginTop: 10, fontSize: 40 }} numberOfLines={1}>
                    {balancePrettyPrep1}
                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, lineHeight: 40, fontSize: 20 }}>
                        {balancePrettyPrep2 + ' ' + cashbackCurrency}
                    </Text>
                </Text>
            </View>
        </View>
    )
}

const CashbackData = (props) => {

    const {
        data,
        cashbackStore,
        refresh,
        clickRefresh,
        handleRefresh
    } = props

    const cashbackToken = cashbackStore.dataFromApi.cashbackToken || cashbackStore.cashbackToken
    const cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false

    let cashbackParentToken = cashbackStore.dataFromApi.parentToken || false
    if (!cashbackParentToken) {
        cashbackParentToken = cashbackStore.parentToken || ''
    }
    if (cashbackParentToken === cashbackToken || cashbackParentToken === cashbackLinkTitle) {
        cashbackParentToken = ''
    }

    const { title, subTitle, balance, ExtraViewData, textInput } = data

    const {
        colors,
        GRID_SIZE,
        isLight
    } = useTheme()

    const cashbackCurrency = 'USDT'

    return (
        <View style={[styles.topContent, { marginRight: GRID_SIZE, marginLeft: refresh ? GRID_SIZE : 0 }]}>

            <View style={styles.topContent__content}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={styles.header}>
                        <Text numberOfLines={1} style={[styles.header__title, { color: colors.common.text1 }]}>{title}</Text>
                        <Text style={styles.header__subTitle}>{subTitle}</Text>
                    </View>
                    {refresh &&
                        <TouchableOpacity style={[styles.refreshBtn, { alignItems: 'flex-end', marginRight: GRID_SIZE, marginTop: GRID_SIZE }]} onPress={handleRefresh} hitSlop={HIT_SLOP}>
                            {clickRefresh ?
                                <LottieView
                                    style={{ width: 22, height: 22 }}
                                    source={isLight ? blackLoader : whiteLoader}
                                    autoPlay
                                    loop
                                /> :
                                <CustomIcon name={'reloadTx'} size={22} color={colors.common.text1} />}
                        </TouchableOpacity>
                    }
                </View>

                {renderBalance(balance, cashbackCurrency)}

                {ExtraViewData && (
                    <View style={{ marginTop: -GRID_SIZE }}>
                        <ExtraViewData />
                    </View>
                )}

                {textInput && (
                    <Tab1
                        windowWidth={widthWindow}
                        cashbackParentToken={cashbackParentToken}
                        cashbackStore={cashbackStore}
                    />
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

const mapStateToProps = (state) => {
    return {
        cashbackStore: getCashBackData(state)
    }
}

export default connect(mapStateToProps)(CashbackData)

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
        height: 190,
        zIndex: 1,

        borderRadius: 16
    },
    topContent: {
        position: 'relative',

        height: 206,
        width: widthWindow * 0.75,

        borderRadius: 16
    },

    topContent__content: {
        position: 'relative',
        zIndex: 2
    },

    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 180,
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
        alignItems: 'center'
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16
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
        lineHeight: 21,
        width: widthWindow * 0.605
    },
    header__subTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        lineHeight: 16,
        letterSpacing: 0.5,
        color: '#999999',
        textTransform: 'uppercase'
    },
    refreshBtn: {

    }
}

