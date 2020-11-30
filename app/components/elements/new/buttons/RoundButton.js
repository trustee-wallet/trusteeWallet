
import React from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import EvilIcon from 'react-native-vector-icons/EvilIcons'

import ReceiveIcon from '../../../../assets/images/HomePage/receive';
import SendIcon from '../../../../assets/images/HomePage/send';
import HideIcon from '../../../../assets/images/HomePage/hide';

import { useTheme } from '../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


const ICON_SET = {
    receive: ReceiveIcon,
    send: SendIcon,
    hide: HideIcon,
    telegram: props => <EvilIcon name="sc-telegram" {...props} size={32} />,
    twitter: props => <EvilIcon name="sc-twitter" {...props} size={34} style={{ left: 1 }} />,
    facebook: props => <EvilIcon name="sc-facebook" {...props} size={32} style={{ top: 0.5, left: 0.5 }} />,
    vk: props => <EvilIcon name="sc-vk" {...props} size={34} />,
    github: props => <EvilIcon name="sc-github" {...props} size={36} style={{ top: 0.5, left: 0.5 }} />
}

export default function ButtonIcon(props) {
    const {
        type,
        onPress,
        containerStyle,
        noTitle,
        size = 42,
        shadowStyle
    } = props
    const { colors } = useTheme()
    const Icon = ICON_SET[type];

    const text = !noTitle && strings(`homeScreen.buttons.${type}`)

    return (
        <View style={[styles.container, containerStyle]}>
            <TouchableOpacity
                onPress={onPress}
                style={[
                    styles.roundButton,
                    shadowStyle,
                    {
                        backgroundColor: colors.common.roundButtonBg,
                        width: size,
                        height: size,
                        borderRadius: size / 2
                    }
                ]}
            >
                {Icon && <Icon color={colors.common.roundButtonContent} />}
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
