/**
 * @version 0.53
 * @author yura
 */

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const PercentView = (props) => {

    const { colors } = useTheme()

    let {
        containerStyle,
        textStyles,
        value,
        staking,
        currencyCode
    } = props

    const percentValue = BlocksoftExternalSettings.getStatic(`${currencyCode}_STAKING_PERCENT`)

    value = value + ' %'

    value = staking ? percentValue + ' % APY' : value

    return (
        <View style={[styles.container, { backgroundColor: staking ? colors.stakingPercent.bg : colors.common.button.bg }, containerStyle]}>
            <Text style={[styles.text, { color: staking ? colors.stakingPercent.color : colors.common.button.text }, textStyles]}>{value}</Text>
        </View>
    )
}

export default PercentView

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        paddingHorizontal: 8,
        marginLeft: 10,
        paddingVertical: 4

    },
    text: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 15,
        letterSpacing: 0.5
    },
})