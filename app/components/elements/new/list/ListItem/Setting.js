
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
            return <CustomIcon name="wallet" size={21} color={color} style={{ left: 1 }} />
        case 'accounts':
            return <CustomIcon name="addressBook" size={21} color={color} style={{ left: 1 }} />
        case 'pinCode':
            return <CustomIcon name="pin" size={24} color={color} />
        case 'biometricLock':
            return <CustomIcon name="faceId" size={24} color={color} />
        case 'transactionConfirmation':
            return <MaterialCommunityIcon name="lock-question" color={color} size={22} style={{ marginLeft: 1, marginTop: 1 }} />
        case 'notifications':
            return <CustomIcon name="notifications" size={24} color={color} style={{ left: 0.5 }} />
        case 'about':
            return <MaterialCommunityIcon name="information" size={22} style={{ marginLeft: 1, marginTop: 2 }} />
        case 'darkMode':
            return <FontAwesomeIcon name="moon-o" color={color} size={23} style={{ marginLeft: 2 }} />
        case 'localCurrency':
            return <CustomIcon name="localCurrency" size={24} color={color} style={{ left: 0.5 }} />
        case 'changePinCode':
            return <CustomIcon name="changePin" size={24} color={color} style={{ left: 1 }} />
        case 'language':
            return <CustomIcon name="language" size={24} color={color} style={{ left: 0.5 }} />
        case 'scanning':
            return null; // TODO: add icon when custom icon set is ready
        case 'shareLogs':
            return <CustomIcon name="logs" size={22} color={color} style={{ left: 0.5 }} />
        case 'contactSupport':
            return <CustomIcon name="support" size={23} color={color} style={{ left: 0.5 }} />
        case 'termsOfUse':
            return <CustomIcon name="terms" size={24} color={color} style={{ left: 0.5 }} />
        case 'transactions':
            return <CustomIcon name="exchange" size={22} color={color} style={{ left: 0.5 }} />
        case 'privacyPolicy':
            return <CustomIcon name="privacy" size={24} color={color} style={{ left: 0.5 }} />
        case 'exchangeRates':
            return <CustomIcon name="exchangeRates" size={22} color={color} style={{ left: 0.5 }} />
        case 'news':
            return <CustomIcon name="news" size={22} color={color} style={{ left: 0.5 }} />
        case 'key':
            return null; // TODO: add icon when custom icon set is ready
        case 'importWallet':
            return <CustomIcon name="importWallet" size={22} color={color} style={{ left: 0.5 }} />
        case 'cashMultiple':
            return <MaterialCommunityIcon name="cash-multiple" color={color} size={22} style={{ marginTop: 0, marginLeft: 1 }} />
        case 'accountBoxMultiple':
            return <MaterialCommunityIcon name="account-box-multiple" color={color} size={22} style={{ marginTop: 0, marginLeft: 1 }} />
        case 'cogs':
            return <MaterialCommunityIcon name="cogs" color={color} size={22} style={{ marginTop: 0, marginLeft: 1 }} />
        case 'information':
            return <MaterialCommunityIcon name="information" color={color} size={22} style={{ marginTop: 0, marginLeft: 1 }} />
        case 'hd':
            return <CustomIcon name={'multiAddress'} size={18} color={color} />
        case 'rbf':
            return <CustomIcon name={'editingTx'} size={18} color={color} />
        case 'unconfirmed':
            return <CustomIcon name={'unconfirmed'} size={18} color={color} />
        case 'address':
            return <CustomIcon name={'selectVisibleAddress'} size={18} color={color} />
        case 'fee':
            return <CustomIcon name={'fee'} size={22} color={color} />
        default: return null
    }
}

const getRightContent = (rightContent, params, color) => {
    const { onPress, value, disabled } = params
    const { colors } = useTheme()
    // next value needed to corret switch component rendering
    const reversedValue = !value
    switch (rightContent) {
        case 'arrow':
            return <AntIcon name="right" color={colors.common.text1} size={16} />
        case 'switch':
            return (
                <Switch
                    onValueChange={onPress}
                    value={reversedValue}
                    disabled={disabled}
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
                    innerCircleStyle={[!disabled && styles.switchShadow, { borderColor: reversedValue ? colors.common.switch.bgInactive : colors.common.switch.bgActive}]}
                />
            )
        case 'arrow_down':
            return <CustomIcon name={'down'} size={18} color={color} />
        case 'arrow_up':
            return <CustomIcon name={'up'} size={18} color={color} />
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
        type,
        ExtraView
    } = props
    const { colors, GRID_SIZE } = useTheme()

    if (type === 'dropdown') {
        return (
            <>
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
                            <View style={[styles.rightContent, { opacity: disabled || disabledRightContent ? 0.3 : 1 }]}>
                                {getRightContent(rightContent, { ...switchParams, disabled }, colors.common.text1)}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                {(ExtraView && switchParams.value) && (
                    <ExtraView />
                )}
            </>
        )
    } else {
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
                    <View style={[styles.icon, { backgroundColor: colors.common.listItem.basic.iconBgLight, opacity: disabled ? 0.5 : 1 }]}>
                        {getIcon(iconType, colors.common.text1)}
                    </View>
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
                {ExtraView && (
                    <ExtraView />
                )}
                { !last && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 3 }} />}
            </View>
        )
    }
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
