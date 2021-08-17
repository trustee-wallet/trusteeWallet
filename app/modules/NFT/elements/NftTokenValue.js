/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet
} from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'

const NftTokenValue = (props) => {

    const {
        walletCurrency,
        balance,
        balanceData,
        currencySymbol
    } = props

    const {
        colors
    } = useTheme()

    return (
        <View style={styles.currencyContainer}>
            <CurrencyIcon
                setBackground={true}
                currencyCode={walletCurrency}
                containerStyle={{ borderWidth: 0, width: 40, height: 40}}
                markStyle={{ top: 30 }}
                textContainerStyle={{ bottom: -19 }}
                textStyle={{ backgroundColor: 'transparent' }}
            />
            <View style={styles.balanceContainer}>
                <Text style={[styles.balance, {color: colors.common.text3}]}>{balance + ' ' + walletCurrency}</Text>
                <Text style={styles.balanceData}>{currencySymbol + ' ' + balanceData}</Text>
            </View>
        </View>
    )
}

export default NftTokenValue

const styles = StyleSheet.create({
    currencyContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    balance: {
        fontSize: 13,
        fontFamily: 'SFUIDisplay-Bold',
        letterSpacing: 1.75
    },
    balanceData: {
        fontSize: 10,
        fontFamily: 'Montserrat-Bold',
        letterSpacing: 0.5,
        color: '#999999'
    },
    balanceContainer: {
        marginLeft: 10
    }
})
