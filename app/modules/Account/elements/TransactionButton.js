/**
 * @version 0.43
 * @author yura
 */

import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import FontistoIcon from 'react-native-vector-icons/Fontisto'

import { useTheme } from '@app/modules/theme/ThemeProvider'
import CustomIcon from '@app/components/elements/CustomIcon'


const iconButton = (type) => {

    const { colors } = useTheme()

    if (type === 'receive') {
        return <CustomIcon name={'receive'} color={colors.common.text1} size={18} />
    } else if (type === 'send') {
        return <CustomIcon name={'send'} color={colors.common.text1} size={18} />
    } else if (type === 'buy') {
        return (
            <FontistoIcon size={18} name={'shopping-basket-add'} color={colors.common.text1} />
        )
    }
}

const TransactionButton = (props) => {

    const { text, type, action, style } = props

    const { colors } = useTheme()

    return (
        <TouchableOpacity style={style} onPress={action}>
            {iconButton(type)}
            {text &&
            <Text style={{ paddingTop: 4, color: colors.common.text1 }} >{text}</Text>}
        </TouchableOpacity>
    )
}

export default TransactionButton
