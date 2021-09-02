/**
 * @version 0.53
 * @author yura
 */

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'

const ProcentView = (props) => {

    const { colors } = useTheme()

    const {
        containerStyle,
        textStyles,
        value
    } = props


    return (
        <View style={[styles.container, containerStyle, { backgroundColor: colors.common.button.bg }]}>
            <Text style={[styles.text, textStyles, { color: colors.common.button.text }]} >{value + ' %'}</Text>
        </View>
    )
}

export default ProcentView

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        paddingHorizontal: 8,
        marginHorizontal: 10,
        paddingVertical: 2

    },
    text: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 15,
    },
})