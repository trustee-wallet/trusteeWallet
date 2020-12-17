
import React from 'react'
import {
    Text,
    TextInput,
    View,
    StyleSheet,
    Animated
} from 'react-native'

import { useTheme } from '../../../modules/theme/ThemeProvider'

import { strings } from '../../../services/i18n'


export default function Input(props) {
    const { colors } = useTheme()
    const {
        placeholder = '',
        label = '',
        labelColor = colors.common.text1,
        autoCorrect = false,
        onChangeText = null,
        value,
        inputStyle,
        containerStyle,
        HelperAction,
        ...nativeProps
    } = props

    return (
        <View>
            {!!label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
            <Animated.View style={[styles.inputWrapper, containerStyle]}>
                <TextInput
                    style={[
                        styles.input,
                        HelperAction && styles.inputWithHelper,
                        { backgroundColor: colors.common.textInput.bg, color: colors.common.textInput.text },
                        inputStyle
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.common.textInput.placeholder}
                    autoCorrect={autoCorrect}
                    onChangeText={onChangeText}
                    value={value}
                    {...nativeProps}
                />
                {HelperAction && (
                    <View style={styles.helper}>
                        <HelperAction />
                    </View>
                )}
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 7,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    },
    input: {
        flex: 1,
        borderRadius: 10,
        padding: 16,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.3,
    },
    inputWithHelper: {
        paddingRight: 48
    },
    label: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 21,
        marginLeft: 16,
        marginBottom: 12
    },
    helper: {
        position: 'absolute',
        right: 16,
        zIndex: 20,
    }
})
