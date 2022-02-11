/**
 * @version 0.41
 * @author yura
 */
import React from 'react'
import { Text, StyleSheet } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const InputAndButtonsPartBalanceButton = (props) => {

    const { colors } = useTheme()
    const { text, action, inverse } = props

    return (
        <TouchableDebounce style={{
            ...styles.button,
            backgroundColor: inverse ? colors.common.text1 : colors.common.background,
            borderColor: inverse ? '' : colors.common.text1,
            borderWidth: inverse ? 0 : 2,
        }} onPress={action}>
            <Text style={{ ...styles.text, color: inverse ? colors.common.background : colors.common.text3 }} >{text}</Text>
        </TouchableDebounce>
    )
}

export default InputAndButtonsPartBalanceButton

const styles = StyleSheet.create({
    button: {
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
