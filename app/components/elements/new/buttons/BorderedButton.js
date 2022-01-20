/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity
} from 'react-native'

import Entypo from 'react-native-vector-icons/Entypo'
import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'
import TouchableDebounce from '../TouchableDebounce'

const getIcon = (type, style) => {
    switch (type) {
        case 'plus':
            return <Entypo style={style} size={13} name='plus' />
        case 'send':
            return <CustomIcon style={style} size={13} name='send' />
        default:
            return null
    }
}

const BorderedButton = (props) => {

    const {
        text,
        icon,
        isViolet,
        containerStyles,
        isBlack,
        onPress,
        customTextStyles,
        onPressIn,
        onPressOut,
        activeOpacity = 0.5,
        hitSlop = null
    } = props

    const {
        colors
    } = useTheme()

    return(
        <TouchableDebounce style={[styles.addAsset, containerStyles]} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={activeOpacity} hitSlop={hitSlop}>
            <View style={[styles.addAsset__content, { borderColor: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#404040' : colors.common.text1}]}>
                {getIcon(icon, [styles.addAsset__icon, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#5C5C5C' : colors.common.text3 }])}
                <Text style={[styles.addAsset__text, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#5C5C5C' : colors.common.text3 }, customTextStyles]}>
                    {text}
                </Text>
            </View>
        </TouchableDebounce>
    )
}

export default BorderedButton

const styles = StyleSheet.create({
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,


        borderRadius: 6,
        borderWidth: 1.5
    },
    addAsset: {
        
    },
    addAsset__text: {
        fontSize: 10,
        lineHeight: 14,
        fontFamily: 'Montserrat-Bold',
        textTransform: 'uppercase',
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,
    }
})
