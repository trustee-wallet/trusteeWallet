/**
 * @version 0.77
 * @author Vadym
 */

import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'

import NavStore from '@app/components/navigation/NavStore'

import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import BlocksoftCustomLinks from '@crypto/common/BlocksoftCustomLinks'

class DetailsContent extends React.Component {

    cashbackCurrency = '$'

    handleOpenLink = (link) => {
        NavStore.goNext('WebViewScreen', { url: link, title: strings('cashback.howItWorks.title') })
    }

    render() {
        const {
            colors,
            GRID_SIZE
        } = this.context
        const {
            overalPrep,
            invitedUsers,
            level2Users,
            selectedTitle,
            cpaLevel1,
            cpaLevel2,
            cpaLevel3
        } = this.props

        return (
            <View style={[styles.container, { marginHorizontal: GRID_SIZE, marginLeft: GRID_SIZE * 3.5, marginTop: -GRID_SIZE * 1.5 }]} >
                {selectedTitle === 'CASHBACK' ?
                    <View style={[styles.container, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 1.5  }]}>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.transAmount')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{`${this.cashbackCurrency} ${overalPrep}`}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.friendsJoined')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{invitedUsers}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.level2UsersAmount')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{level2Users}</Text>
                        </View>
                        <TouchableDebounce
                            onPress={() => this.handleOpenLink(BlocksoftCustomLinks.getLink('HOW_WORK_CASHBACK_LINK', this.context.isLight))}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.howItWorks, { color: colors.common.text3, marginTop: GRID_SIZE }]}>{strings('cashback.howItWorks.title')}</Text>
                        </TouchableDebounce>
                    </View> : null}
                {selectedTitle === 'CPA' ?
                    <View style={[styles.container, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 1.5 }]}>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.cpaLevel1')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{cpaLevel1}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.cpaLevel2')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{cpaLevel2}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.cpaLevel3')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{cpaLevel3}</Text>
                        </View>
                        <TouchableDebounce onPress={() => this.handleOpenLink(BlocksoftCustomLinks.getLink('HOW_WORK_CPA_LINK', this.context.isLight))}>
                            <Text style={[styles.howItWorks, { color: colors.common.text3, marginTop: GRID_SIZE }]}>{strings('cashback.howItWorks.title')}</Text>
                        </TouchableDebounce>
                    </View> : null}

            </View>
        )
    }
}

DetailsContent.contextType = ThemeContext

export default DetailsContent

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        height: 'auto'
    },
    textRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6
    },
    textRowTitle: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        flex: 1.5
    },
    textRowValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'right',
        flex: 1
    },
    currentBalanceTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    allBalanceTitleRow: {
        alignItems: 'center'
    },
    balanceTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 14
    },
    balanceUpdatedAt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        lineHeight: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 5
    },
    balanceSlider: {
        height: 130
    },
    balanceValueContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    balanceValueText: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    balanceValue: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 32,
        lineHeight: 32
    },
    balanceValueLower: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 16,
        marginBottom: Platform.OS === 'android' ? 4.5 : 4
    },
    mainTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        textAlign: 'center',
        marginBottom: 12
    },
    howItWorks: {
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textDecorationLine: 'underline'
    }
})
