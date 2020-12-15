
import React from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import CustomIcon from '../../CustomIcon'

import { useTheme } from '../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


const ICON_SET = {
    receive: props => <CustomIcon {...props} name="receive" size={18} style={{ left: 0.5 }} />,
    send: props => <CustomIcon {...props} name="send" size={18} style={{ left: 0.5 }} />,
    hide: props => <CustomIcon {...props} name="hide" size={24} style={{ left: 0.5 }} />,
    telegram: props => <CustomIcon {...props} name="telegram" size={25} style={{ left: 0.5 }} />,
    twitter: props => <CustomIcon {...props} name="twitter" size={25} style={{ left: 0.5 }} />,
    facebook: props => <CustomIcon {...props} name="facebook" size={25} style={{ left: 0.5 }} />,
    instagram: props => <CustomIcon {...props} name="insta" size={25} style={{ left: 0.5 }} />,
    vk: props => <CustomIcon {...props} name="vk" size={25} style={{ left: 0.5 }} />,
    github: props => <CustomIcon {...props} name="git" size={25} style={{ left: 0.5 }} />,
    faq: props => <CustomIcon {...props} name="faq" size={27} style={{ left: 0.5 }} />,
    edit: props => <CustomIcon {...props} name="edit" size={22} style={{ left: 0.5 }} />,
    delete: props => <CustomIcon {...props} name="delete" size={22} style={{ left: 0.5 }} />,
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
