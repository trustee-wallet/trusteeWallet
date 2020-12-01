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
    const { text, type, action } = props

    return (
        <TouchableOpacity style={styles.button} onPress={action}>
            <Text style={styles.text} >{text}</Text>
        </TouchableOpacity>
    )
}

export default PartBalanceButton

const styles = {
    button: {
        borderWidth: 2,
        height: 40,
        width: '20%',
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
