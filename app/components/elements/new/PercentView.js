/**
 * @version 0.53
 * @author yura
 */

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'

const PercentView = (props) => {

    const { colors } = useTheme()

    let {
        containerStyle,
        textStyles,
        value,
        staking
    } = props

    value = value + '%'

    if (staking) {
        value += ' APY'
    }

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
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 11,
        lineHeight: 13,
        letterSpacing: 0.5
    },
})