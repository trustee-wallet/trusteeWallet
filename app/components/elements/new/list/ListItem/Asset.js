
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import { Switch } from 'react-native-switch'

import CurrencyIcon from '../../../CurrencyIcon'

import { useTheme } from '@app/theme/ThemeProvider'


const getRightContent = (rightContent, params) => {
    const { onPress, value, disabled } = params
    const { colors } = useTheme()
    // next value needed to corret switch component rendering
    const reversedValue = !value
    switch (rightContent) {
        case 'switch':
            return (
                <Switch
                    onValueChange={onPress}
                    value={reversedValue}
                    renderActiveText={false}
                    renderInActiveText={false}
                    backgroundActive={colors.common.switch.bgInactive}
                    backgroundInactive={colors.common.switch.bgActive}
                    circleActiveColor={colors.common.switch.circleBg}
                    circleInActiveColor={colors.common.switch.circleBg}
                    circleSize={20}
                    changeValueImmediately={false}
                    switchWidthMultiplier={1.6}
                    switchLeftPx={-5}
                    switchRightPx={-5}
                    outerCircleStyle={{ paddingRight: reversedValue ? 5 : 0, paddingLeft: reversedValue ? 0 : 5 }}
                    innerCircleStyle={Object.assign({}, !disabled && styles.switchShadow, { borderColor: reversedValue ? colors.common.switch.bgInactive : colors.common.switch.bgActive })}
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
    } = props
    const { colors, GRID_SIZE } = useTheme()

    return (
        <View style={{ flexDirection: 'column' }}>
            <TouchableOpacity
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
                        <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                        {!!subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                    </View>
                    {!!rightContent && (
                        <View style={[styles.rightContent, { opacity: disabled || disabledRightContent ? 0.3 : 1 }]}>
                            {getRightContent(rightContent, { ...switchParams, disabled })}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
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
