/**
 * @version 0.44
 */

import React from 'react'
import {
    Text,
    TextInput,
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Keyboard,
    Clipboard
} from 'react-native'

import QR from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { useTheme } from '@app/theme/ThemeProvider'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'


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
        compRef,
        onFocus,
        paste,
        qr,
        qrCallback,
        callback,
        numberOfLines,
        ...nativeProps
    } = props

    const handleReadFromClipboard = async () => {
        const { callback } = props

        Keyboard.dismiss()
        const clipboardContent = await Clipboard.getString()
        if (typeof callback !== 'undefined') {
            callback(clipboardContent)
        }

    }

    return (
        <View>
            {!!label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
            <Animated.View style={[styles.inputWrapper, containerStyle]}>
                <TextInput
                    numberOfLines={numberOfLines}
                    style={[
                        styles.input,
                        (qr && paste) ? styles.inputWithBtns : (HelperAction || qr || paste) ? styles.inputWithHelper : null,
                        { backgroundColor: colors.common.textInput.bg, color: colors.common.textInput.text },
                        inputStyle
                    ]}
                    allowFontScaling={false}
                    placeholder={placeholder}
                    placeholderTextColor={colors.common.textInput.placeholder}
                    autoCorrect={autoCorrect}
                    onChangeText={onChangeText}
                    value={value}
                    ref={compRef}
                    onFocus={onFocus}
                    {...nativeProps}
                />
                <View style={styles.actions}>
                    {
                        typeof paste !== 'undefined' && paste ?
                            <TouchableOpacity onPress={handleReadFromClipboard} style={styles.actionBtn} hitSlop={{ top: 15, left: 15, right: 7, bottom: 15 }}>
                                <MaterialCommunityIcons style={{ ...styles.actionBtn__icon, paddingTop: 2, paddingRight: qr ? 7 : 0 }} name='content-paste' size={25} color={inputStyle?.color || colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                    {
                        typeof qr !== 'undefined' && qr ?
                            <TouchableOpacity onPress={() => checkQRPermission(qrCallback)} style={styles.actionBtn} hitSlop={{ top: 15, left: 0, right: 15, bottom: 15 }}>
                                <QR style={{ ...styles.actionBtn__icon, paddingTop: 2, paddingRight: 0 }} name='qrcode' size={25} color={inputStyle?.color || colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                </View>
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
        lineHeight: 18,
        letterSpacing: 0.3,
    },
    inputWithHelper: {
        paddingRight: 48
    },
    inputWithBtns: {
        paddingRight: 90
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
    },
    actions: {
        position: 'absolute',
        right: 16,
        zIndex: 20,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {},
    actionBtn__icon: {
        paddingHorizontal: 7
    },
})
