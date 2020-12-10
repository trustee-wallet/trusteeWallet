import React from 'react'
import { Text, View } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import AccountButtons from './accountButtons'

import { useTheme } from '../../../modules/theme/ThemeProvider'

const BalanceHeader = (props) => {

    const {
        account, 
        cryptoCurrency
    } = props

    const { colors, isLight } = useTheme()

    let tmp = BlocksoftPrettyNumbers.makeCut(account.balancePretty, 7, 'AccountScreen/renderBalance').separated

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
                    <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                        {balancePrettyPrep1}
                        <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                            {balancePrettyPrep2 + ' ' + cryptoCurrency.currencySymbol}
                        </Text>
                    </Text>
                </View>
                <LetterSpacing text={account.basicCurrencySymbol + ' ' + account.basicCurrencyBalance}
                    textStyle={{ ...styles.topContent__subtitle, color: colors.accountScreen.balanceNotEquivalent }} letterSpacing={.5} />
            </View>
            <View style={{ paddingTop: 12 }}>
                <AccountButtons />
            </View>
        </>
    )
}

export default BalanceHeader

const styles = {
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 6
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 16,
    },
    topContent__title_first: {
        height: 34,
        fontSize: 30,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 30
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
}