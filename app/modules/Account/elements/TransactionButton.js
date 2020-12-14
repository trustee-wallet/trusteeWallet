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

import { useTheme } from '../../theme/ThemeProvider'

import { strings } from '../../../services/i18n'
import ReceiveIcon from '../../../assets/images/HomePage/receive';
import SendIcon from '../../../assets/images/HomePage/send';
import FontistoIcon from 'react-native-vector-icons/Fontisto'


const iconButton = (type) => {

    const { colors } = useTheme()

    if (type === 'receive') {
        return (
            <ReceiveIcon color={colors.common.text1} />
            )
    } else if (type === 'send') {
        return (
            <SendIcon color={colors.common.text1} />
            )
    } else if (type === 'buy') {
        return (
            <FontistoIcon size={18} name={'shopping-basket-add'} color={colors.common.text1} />
        )
    }
}

const TransactionButton = (props) => {

    const { text, type, action, style } = props


    return (
        <TouchableOpacity style={style} onPress={action}>
            {iconButton(type)}
            {text &&
            <Text style={{ paddingTop: 4 }} >{text}</Text>}
        </TouchableOpacity>
    )
}

export default TransactionButton
