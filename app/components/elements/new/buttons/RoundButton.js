
import React from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import CustomIcon from '../../CustomIcon'

import { useTheme } from '@app/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


const ICON_SET = {
    receive: props => <CustomIcon {...props} name="receive" size={18} style={{ left: 0.5 }} />,
    send: props => <CustomIcon {...props} name="send" size={18} style={{ left: 0.5 }} />,
    hide: props => <CustomIcon {...props} name="hide" size={24} style={{ left: 0.5 }} />,
    telegram: props => <CustomIcon {...props} name="telegram" size={25} style={{ left: 0.5 }} />,
    sendMessage: props => <CustomIcon {...props} name="sendMessage" size={25} style={{ left: 0.5 }} />,
    twitter: props => <CustomIcon {...props} name="twitter" size={25} style={{ left: 0.5 }} />,
    facebook: props => <CustomIcon {...props} name="facebook" size={25} style={{ left: 0.5 }} />,
    instagram: props => <CustomIcon {...props} name="insta" size={25} style={{ left: 0.5 }} />,
    vk: props => <CustomIcon {...props} name="vk" size={25} style={{ left: 0.5 }} />,
    github: props => <CustomIcon {...props} name="git" size={25} style={{ left: 0.5 }} />,
    faq: props => <CustomIcon {...props} name="faq" size={27} style={{ left: 0.5 }} />,
    edit: props => <CustomIcon {...props} name="edit" size={22} style={{ left: 0.5 }} />,
    delete: props => <CustomIcon {...props} name="delete" size={22} style={{ left: 0.5 }} />,
    share: props => <CustomIcon {...props} name="share" size={22} style={{ left: 0.5 }} />,
    promo: props => <CustomIcon {...props} name="promo" size={22} style={{ left: 0.5 }} />,
    close: props => <CustomIcon {...props} name="close" size={22} style={{ left: 0.5 }} />,
    details: props => <CustomIcon {...props} name="details" size={22} style={{ left: 0.5 }} />,
    support: props => <CustomIcon {...props} name="support" size={22} style={{ left: 0.5 }} />,
    check: props => <CustomIcon {...props} name="receipt" size={22} style={{ left: 0.5 }} />,
    canceled: props => <CustomIcon {...props} name="cancel" size={22} style={{ left: 0.5 }} />,
    rbf: props => <CustomIcon {...props} name="rbf" size={22} style={{ left: 0.5 }} />,
    exchange: props => <CustomIcon {...props} name="exchange" size={22} style={{ left: 0.5 }} />,
    youtube: props => <CustomIcon {...props} name="youtube" size={22} style={{ left: 0.5 }} />,
}

export default function ButtonIcon(props) {
    const {
        type,
        onPress,
        containerStyle,
        noTitle,
        size = 42,
        shadowStyle,
        title,
        defaultShadow
    } = props
    const { colors } = useTheme()
    const Icon = ICON_SET[type];

    return (
        <View style={[styles.container, containerStyle]}>
            <TouchableOpacity
                onPress={onPress}
                style={[
                    styles.roundButton,
                    defaultShadow ? styles.shadow : null,
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
            {!!title && <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.text, { color: colors.common.text2 }]}>{title}</Text>
                </View>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    roundButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
    },
    text: {
        position: 'absolute',
        marginTop: 10,
        fontFamily: 'SFUIDisplay-Semibold', // TODO: use medium
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textAlign: 'center'
    },
    shadow: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 3
        },

        elevation: 10
    }
})
