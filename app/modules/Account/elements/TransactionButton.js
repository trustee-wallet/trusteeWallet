/**
 * @version 0.43
 * @author yura
 */

import React from 'react'
import { Text } from 'react-native'
import FontistoIcon from 'react-native-vector-icons/Fontisto'

import { useTheme } from '@app/theme/ThemeProvider'
import CustomIcon from '@app/components/elements/CustomIcon'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'


const iconButton = (type) => {

    const { colors } = useTheme()

    switch (type.toLowerCase()) {
        case 'receive':
            return <CustomIcon name={'receive'} color={colors.common.text1} size={18} />
        case 'send':
            return <CustomIcon name={'send'} color={colors.common.text1} size={18} />
        case 'buy':
            return <FontistoIcon size={18} name={'shopping-basket-add'} color={colors.common.text1} />
        case 'rbf':
            return <CustomIcon name={'rbf'} color={colors.common.text1} size={20} />
        case 'canceled':
            return <CustomIcon name={'return'} color={colors.common.text1} size={20} />
    }
}

const TransactionButton = (props) => {

    const { text, type, action, style, textStyle } = props

    const { colors } = useTheme()

    return (
        <TouchableDebounce style={style} onPress={action}>
            {iconButton(type)}
            {text &&
                <Text style={{ ...textStyle, paddingTop: 4, color: colors.common.text1 }} >{text}</Text>}
        </TouchableDebounce>
    )
}

export default TransactionButton
