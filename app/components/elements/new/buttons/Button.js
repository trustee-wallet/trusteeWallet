
import React from 'react'
import {
    Text,
    View,
    StyleSheet,
} from 'react-native'

import LottieView from 'lottie-react-native'
import { TouchableOpacity } from '@gorhom/bottom-sheet'

import { useTheme } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'

import loaderWhite from '@assets/jsons/animations/loaderWhite.json'

import CustomIcon from '../../CustomIcon'
import TouchableDebounce from '../TouchableDebounce'

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
    } else if (type === 'withoutShadow') {
        style.container.push(containerStyle)
        style.text.push(
            styles.transparentButtonText,
            { color: colors.common.button[disabled ? 'disabledText' : 'text'] },
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

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'sendMessage':
            return <CustomIcon name="sendMessage" size={24} color={color} style={{left: 0}} />
        default: return null
    }
}

export default function Button(props) {
    const {
        type = null,
        onPress,
        containerStyle,
        textStyle,
        title,
        disabled = false,
        activeOpacity = 0.5,
        sendInProcess,
        iconType,
        bottomSheet
    } = props
    const preparedStyles = getStyle(type, disabled, containerStyle, textStyle)

    const {colors} = useTheme()

    const data = !sendInProcess ?
        !iconType ? 
            <Text style={[preparedStyles.text]}>{title}</Text>
            :
            iconType && <View>{getIcon(iconType, colors.common.roundButtonContent)}</View>
        :
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[preparedStyles.text, { paddingRight: 6 }]}>{strings('send.receiptScreen.sending')}</Text>
            <LottieView style={{ width: 40, height: 40, marginTop: -20, top: 16 }}
                source={loaderWhite}
                autoPlay loop />
        </View>

    const Touchable = bottomSheet ? TouchableOpacity : TouchableDebounce
    

    return (
        <Touchable
            onPress={onPress}
            style={[preparedStyles.container]}
            disabled={sendInProcess ? true : disabled}
            activeOpacity={activeOpacity}
        >
            {data}
        </Touchable>
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
        lineHeight: 18,
        letterSpacing: 0.5,
    },
    transparentButtonText: {
        fontFamily: 'Montserrat-Bold',
    }
})
