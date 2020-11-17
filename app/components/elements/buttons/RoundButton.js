
import React from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import ReceiveIcon from '../../../assets/images/HomePage/receive';
import SendIcon from '../../../assets/images/HomePage/send';
import HideIcon from '../../../assets/images/HomePage/hide';

import { useTheme } from '../../../modules/theme/ThemeProvider'

import { strings } from '../../../services/i18n'


const ICON_SET = {
    receive: ReceiveIcon,
    send: SendIcon,
    hide: HideIcon,
}

export default function ButtonIcon(props) {
    const {
        type,
        onPress,
        containerStyle,
        noTitle,
    } = props
    const { colors } = useTheme()
    const Icon = ICON_SET[type];

    if (!Icon) return null
    const text = !noTitle && strings(`homeScreen.buttons.${type}`)

    return (
        <View style={[styles.container, containerStyle]}>
            <TouchableOpacity onPress={onPress} style={[styles.roundButton, { backgroundColor: colors.common.roundButtonBg }]}>
                <Icon color={colors.common.roundButtonContent} />
            </TouchableOpacity>
            {!noTitle && <Text style={[styles.text, { color: colors.common.text1 }]}>{text}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    roundButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,

        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 3
        },

        elevation: 10
    },
    text: {
        marginTop: 6,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
    },
})
