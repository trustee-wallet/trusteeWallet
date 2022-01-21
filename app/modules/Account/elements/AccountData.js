/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { Text, View, StyleSheet, Platform } from 'react-native'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/theme/ThemeProvider'

import AccountButtons from './AccountButtons'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

class AccountData extends PureComponent {

    render() {
        const {
            balancePretty,
            currencySymbol,
            actionReceive,
            actionBuy,
            actionSend,
            triggerBalanceVisibility
        } = this.props

        const { colors } = this.context

        const { isBalanceVisible, isBalanceVisibleTriggered, originalVisibility } = this.props
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility


        let tmp = BlocksoftPrettyNumbers.makeCut(balancePretty, 7, 'AccountScreen/renderBalance').separated

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
            <>
                <View style={styles.topContent__top}>
                    <View style={styles.topContent__title}>
                        <TouchableDebounce
                            onPressIn={() => triggerBalanceVisibility(true, originalVisibility)}
                            onPressOut={() => triggerBalanceVisibility(false, originalVisibility)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
                        >
                            {finalIsBalanceVisible ?
                                <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                                    {balancePrettyPrep1}
                                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                                        {balancePrettyPrep2 + ' ' + currencySymbol}
                                    </Text>
                                </Text> :
                                <Text style={[styles.topContent__title_last, styles.hiddenBalance, { color: colors.common.text1 }]}>****</Text>
                            }
                        </TouchableDebounce>
                    </View>
                </View>
                <AccountButtons
                    actionBuy={actionBuy}
                    actionSend={actionSend}
                    actionReceive={actionReceive}
                />
            </>
        )
    }
}

AccountData.contextType = ThemeContext

export default AccountData

const styles = StyleSheet.create({
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    topContent__title_first: {
        fontSize: 30,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 38,
        paddingTop: Platform.OS === 'android' ? 5 : 0
    },
    topContent__title_last: {
        height: 32,
        fontSize: 24,
        fontFamily: 'Montserrat-Medium',
        lineHeight: 28,
        opacity: 1,
    },
    topContent__subtitle: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        textAlign: 'center'
    },
    hiddenBalance: {
        height: 'auto',
        fontSize: Platform.OS === 'ios' ? 34 : 30,
        lineHeight: Platform.OS === 'ios' ? 38 : 32.4
    }
})
