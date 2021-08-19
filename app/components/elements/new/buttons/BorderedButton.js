/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'

import Entypo from 'react-native-vector-icons/Entypo'
import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'

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
        onPress
    } = props

    const {
        colors
    } = useTheme()

    return(
        <TouchableOpacity style={[styles.addAsset, containerStyles]} onPress={onPress}>
            <View style={[styles.addAsset__content, { borderColor: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#404040' : colors.common.text1}]}>
                {getIcon(icon, [styles.addAsset__icon, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#5C5C5C' : colors.common.text3 }])}
                <Text style={[styles.addAsset__text, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : isBlack ? '#5C5C5C' : colors.common.text3 }]}>
                    {text}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

export default BorderedButton

const styles = StyleSheet.create({
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,


        borderRadius: 6,
        borderWidth: 1.5
    },
    addAsset: {
        paddingVertical: 19,
        paddingLeft: 15
    },
    addAsset__text: {
        fontSize: 10,
        fontFamily: 'Montserrat-Bold',
        textTransform: 'uppercase',
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,
    }
})
