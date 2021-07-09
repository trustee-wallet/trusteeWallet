/**
 * @version 0.41
 * @author yura
 */
import React from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'

const InputAndButtonsPartBalanceButton = (props) => {

    const { colors } = useTheme()
    const { text, action, inverse } = props

    return (
        <TouchableOpacity style={{...styles.button, backgroundColor: inverse ? colors.common.text1 : colors.common.background, borderColor: colors.common.text1}} onPress={action}>
            <Text style={{...styles.text, color: inverse ? colors.common.background : colors.common.text3 }} >{text}</Text>
        </TouchableOpacity>
    )
}

export default InputAndButtonsPartBalanceButton

const styles = StyleSheet.create({
    button: {
        borderWidth: 2,
        height: 40,
        width: '22%',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#5C5C5C'
    }
})
