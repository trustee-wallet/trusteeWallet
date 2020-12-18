/**
 * @version 0.1
 * @author yura
 */

import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import { useTheme } from '../../../modules/theme/ThemeProvider'

const PartBalanceButton = (props) => {

    const { colors } = useTheme()
    const { text, type, action, inverse } = props

    return (
        <TouchableOpacity style={{...styles.button, backgroundColor: inverse ? colors.common.text1 : colors.common.background, borderColor: colors.common.text1}} onPress={action}>
            <Text style={{...styles.text, color: inverse ? colors.common.background : colors.common.text3 }} >{text}</Text>
        </TouchableOpacity>
    )
}

export default PartBalanceButton

const styles = {
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
}
