
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import { useTheme } from '../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


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
        activeOpacity = 0.5
    } = props
    const { colors } = useTheme()
    const preparedStyles = getStyle(type, disabled, containerStyle, textStyle)

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[preparedStyles.container]}
            disabled={disabled}
            activeOpacity={activeOpacity}
        >
            <Text style={[preparedStyles.text]}>{title}</Text>
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
        elevation: 10
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
