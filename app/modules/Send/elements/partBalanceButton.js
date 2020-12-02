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
        <TouchableOpacity style={{...styles.button, backgroundColor: inverse ? '#404040' : '#f5f5f5'}} onPress={action}>
            <Text style={{...styles.text, color: inverse ? '#f5f5f5' : '#5C5C5C' }} >{text}</Text>
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
        alignItems: 'center'
    },
    text: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#5C5C5C'
    }
}
