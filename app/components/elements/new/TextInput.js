
import React from 'react'
import {
    Text,
    TextInput,
    View,
    StyleSheet,
} from 'react-native'

import { useTheme } from '../../../modules/theme/ThemeProvider'

import { strings } from '../../../services/i18n'


export default function Input(props) {
    const {
        placeholder = '',
        label = '',
        autoCorrect = false,
        onChangeText = null,
        value,
        inputStyle,
        HelperAction,
        ...nativeProps
    } = props
    const { colors } = useTheme()

    return (
        <View>
            {!!label && <Text style={[styles.label, { color: colors.common.text1 }]}>{label}</Text>}
            <View style={styles.inputWrapper}>
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
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    input: {
        height: 50,
        borderRadius: 10,
        padding: 16,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.3,

        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    },
    inputWithHelper: {
        paddingRight: 48
    },
    inputWrapper: {
        justifyContent: 'center'
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
        zIndex: 2
    }
})
