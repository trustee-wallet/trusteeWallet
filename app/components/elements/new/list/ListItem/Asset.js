
import React from 'react'
import {
    Text,
    View,
    StyleSheet,
} from 'react-native'

import Switch from 'react-native-switch-pro'

import CurrencyIcon from '../../../CurrencyIcon'

import { useTheme } from '@app/theme/ThemeProvider'
import TouchableDebounce from '../../TouchableDebounce'


const getRightContent = (rightContent, params) => {
    const { onPress, value, disabled } = params
    const { colors } = useTheme()
    // next value needed to corret switch component rendering
    const reversedValue = !value
    switch (rightContent) {
        case 'switch':
            return (
                <Switch
                    onSyncPress={onPress}
                    value={!reversedValue}
                    backgroundInactive={colors.common.switch.bgInactive}
                    backgroundActive={colors.common.switch.bgActive}
                    circleColorInactive={colors.common.switch.circleBg}
                    circleColorActive={colors.common.switch.circleBg}
                    width={34}
                    circleStyle={Object.assign({}, !disabled && styles.switchShadow, { borderColor: reversedValue ? colors.common.switch.bgInactive : colors.common.switch.bgActive })}
                />
            )
        default: return null
    }
}

export default function SettingListItem(props) {
    const {
        onPress,
        last,
        title,
        subtitle,
        iconType,
        rightContent,
        switchParams = {},
        disabled,
        disabledRightContent,
        onLongPress,
        delayLongPress = 5000,
        TitleExtraView
    } = props
    const { colors } = useTheme()

    return (
        <View style={{ flexDirection: 'column' }}>
            <TouchableDebounce
                style={styles.container}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={delayLongPress}
                activeOpacity={0.8}
                disabled={disabled}
            >
                <CurrencyIcon
                    currencyCode={iconType}
                    containerStyle={styles.icon}
                    iconStyle={{ fontSize: 20 }}
                    markStyle={{ paddingLeft: 1, paddingTop: 1 }}
                />
                <View style={styles.mainContent}>
                    <View style={[styles.textContent, { opacity: disabled ? 0.5 : 1, paddingVertical: !!subtitle ? 13 : 23 }]}>
                        <View style={styles.container}>
                            <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                            {TitleExtraView && <TitleExtraView />}
                        </View>
                        {!!subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                    </View>
                    {!!rightContent && (
                        <View style={[styles.rightContent, { opacity: disabled || disabledRightContent ? 0.3 : 1 }]}>
                            {getRightContent(rightContent, { ...switchParams, disabled })}
                        </View>
                    )}
                </View>
            </TouchableDebounce>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 4,
        flex: 1,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContent: {
        justifyContent: 'center',
        marginLeft: 7
    },
    noBorder: {
        borderBottomWidth: 0
    },
    title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 21
    },
    subtitle: {
        marginTop: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 15,
        letterSpacing: 1.75
    },
    switchShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 4
        },
        elevation: 4
    }
})
