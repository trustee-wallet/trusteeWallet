/**
 * @version 0.42
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    Platform
} from 'react-native'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'

class DetailsContent extends React.Component {

    cashbackCurrency = 'USDT'

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
            <View style={styles.container} >
                {selectedTitle === 'CASHBACK' ?
                    <View style={[styles.container, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 1.5, backgroundColor: colors.cashback.detailsBg  }]}>
                        <Text style={[styles.mainTitle, {color: colors.common.text1}]}>{strings('cashback.cashbackInfo')}</Text>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.transAmount')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{`${overalPrep} ${this.cashbackCurrency}`}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.friendsJoined')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{invitedUsers}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.level2UsersAmount')}</Text>
                            <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{level2Users}</Text>
                        </View>
                    </View> : null}
                {selectedTitle === 'CPA' ?
                    <View style={[styles.container, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 1.5, backgroundColor: colors.cashback.detailsBg  }]}>
                        <Text style={[styles.mainTitle, {color: colors.common.text1}]}>{strings('cashback.cpaInfo')}</Text>
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
                    </View> : null}

            </View>
        )
    }
}

DetailsContent.contextType = ThemeContext

export default DetailsContent

const styles = StyleSheet.create({
    container: {
        marginVertical: 5,
        position: 'relative',
        borderRadius: 16,
        height: 'auto',
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
    }
})
