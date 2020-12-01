
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import { Switch } from 'react-native-switch'

import AntIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import NotificationIcon from '../../../../../assets/images/notification_icon'

import CustomIcon from '../../../CustomIcon'

import { useTheme } from '../../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../../services/i18n'


const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'wallet':
            return <MaterialCommunityIcon name="wallet" color={color} size={22} style={{ marginTop: 2, marginLeft: 1 }} />
        case 'accounts':
            return <FontAwesomeIcon name="address-book" color={color} size={19} style={{ marginLeft: 2 }} />
        case 'pinCode':
            return <MaterialIcon name="lock" color={color} size={20} style={{ marginLeft: 2 }} />
        case 'biometricLock':
            return <MaterialCommunityIcon name="face" color={color} size={22} style={{ marginLeft: 1, marginTop: 1 }} />
        case 'transactionConfirmation':
            return <MaterialCommunityIcon name="lock-question" color={color} size={22} style={{ marginLeft: 1, marginTop: 1 }} />
        case 'notifications':
            return <NotificationIcon color={color} />
        case 'about':
            return <MaterialCommunityIcon name="information" size={22} style={{ marginLeft: 1, marginTop: 2 }} />
        case 'localCurrency':
            return null; // TODO: add icon when custom icon set is ready
        case 'changePinCode':
            return null; // TODO: add icon when custom icon set is ready
        case 'language':
            return null; // TODO: add icon when custom icon set is ready
        case 'scanning':
            return null; // TODO: add icon when custom icon set is ready
        case 'shareLogs':
            return null; // TODO: add icon when custom icon set is ready
        case 'contactSupport':
            return null; // TODO: add icon when custom icon set is ready
        case 'termsOfUse':
            return null; // TODO: add icon when custom icon set is ready
        case 'transactions':
            return <CustomIcon name="exchangeMain" size={19} color={color} style={{ left: 1 }} />
        case 'privacyPolicy':
            return <CustomIcon name="privacy" size={18} color={color} style={{ top: 1 }} />
        case 'exchangeRates':
            return null; // TODO: add icon when custom icon set is ready
        case 'news':
            return null; // TODO: add icon when custom icon set is ready
        default: return null
    }
}

const getRightContent = (rightContent, params) => {
    const { onPress, value, disabled } = params
    const { colors } = useTheme()
    switch (rightContent) {
        case 'arrow':
            return <AntIcon name="right" color={colors.common.text1} size={16} />
        case 'switch':
            return (
                <Switch
                    onValueChange={onPress}
                    value={value}
                    disabled={disabled}
                    renderActiveText={false}
                    renderInActiveText={false}
                    backgroundActive={colors.common.switch.bgActive}
                    backgroundInactive={colors.common.switch.bgInactive}
                    circleActiveColor={colors.common.switch.circleBg}
                    circleInActiveColor={colors.common.switch.circleBg}
                    circleSize={18}
                    switchWidthMultiplier={1.6}
                    outerCircleStyle={{ paddingRight: value ? 5 : 0, paddingLeft: value ? 0 : 5 }}
                    innerCircleStyle={{ borderColor: value ? colors.common.switch.bgActive : colors.common.switch.bgInactive }}
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
        onLongPress,
        delayLongPress = 5000
    } = props
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={delayLongPress}
            activeOpacity={0.8}
            disabled={disabled}
        >
            <View style={[styles.icon, { backgroundColor: colors.common.listItem.basic.iconBgLight, opacity: disabled ? 0.5 : 1 }]}>
                {getIcon(iconType, colors.common.text1)}
            </View>
            <View style={[styles.mainContent, last && styles.noBorder, { borderColor: colors.common.listItem.basic.borderColor }]}>
                <View style={[styles.textContent, { opacity: disabled ? 0.5 : 1, paddingVertical: !!subtitle ? 13 : 23 }]}>
                    <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                    {!!subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                </View>
                {!!rightContent && (
                    <View style={[styles.rightContent, { opacity: disabled ? 0.3 : 1 }]}>
                        {getRightContent(rightContent, { ...switchParams, disabled })}
                    </View>
                )}
            </View>
        </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'center'
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
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
    }
})
