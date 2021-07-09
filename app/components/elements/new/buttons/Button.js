
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import LottieView from 'lottie-react-native'

import { useTheme } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'

import loaderWhite from '@assets/jsons/animations/loaderWhite.json'

const getStyle = (type, disabled, containerStyle, textStyle) => {
    const { colors, GRID_SIZE } = useTheme()
    const style = {
        container: [styles.container, { padding: GRID_SIZE === 8 ? GRID_SIZE * 1.5 : GRID_SIZE }],
        text: [styles.text],
    };
    if (type === 'transparent') {
        style.container.push(containerStyle)
        style.text.push(
            styles.transparentButtonText,
            { color: colors.common.button[disabled ? 'transparentDisabledText' : 'transparentText'] },
            textStyle
        )
    } else {
        style.container.push(
            { backgroundColor: colors.common.button[disabled ? 'disabledBg' : 'bg'] },
            !disabled && styles.buttonShadow,
            containerStyle
        )
        style.text.push(
            { color: colors.common.button[disabled ? 'disabledText' : 'text'] },
            textStyle
        )
    }
    return style
};

export default function Button(props) {
    const {
        type = null,
        onPress,
        containerStyle,
        textStyle,
        title,
        disabled = false,
        activeOpacity = 0.5,
        sendInProcess
    } = props
    const preparedStyles = getStyle(type, disabled, containerStyle, textStyle)

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[preparedStyles.container]}
            disabled={sendInProcess ? true : disabled}
            activeOpacity={activeOpacity}
        >
            {!sendInProcess ?
                <Text style={[preparedStyles.text]}>{title}</Text>
                :
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[preparedStyles.text, { paddingRight: 6 }]}>{strings('send.receiptScreen.sending')}</Text>
                    <LottieView style={{ width: 40, height: 40, marginTop: -20, top: 16 }}
                        source={loaderWhite}
                        autoPlay loop />
                </View>
            }
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    buttonShadow: {
        shadowColor: '#404040',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 6
        },
        elevation: 6
    },
    text: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    transparentButtonText: {
        fontFamily: 'Montserrat-Bold',
    }
})
