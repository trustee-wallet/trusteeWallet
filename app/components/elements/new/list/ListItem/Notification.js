import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'

import CustomIcon from '../../../CustomIcon'

import { useTheme } from '@app/theme/ThemeProvider'

import { SwipeRow } from 'react-native-swipe-list-view'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'


const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'exchange':
            return <CustomIcon name='exchange' size={20} color={color} style={{ left: 0.5 }} />
        case 'news':
            return <CustomIcon name='news' size={22} color={color} style={{ left: 0.5 }} />
        case 'blog':
            return <CustomIcon name='blog' size={22} color={color} style={{ left: 0.5 }} />
        case 'ratesUp':
            return <CustomIcon name='rateUp_notif' size={21} color={color} style={{ left: 0.5 }} />
        case 'ratesDown':
            return <CustomIcon name='rateDown_notif' size={21} color={color} style={{ left: 0.5 }} />
        case 'incoming':
            return <CustomIcon name='receive' size={17} color={color} style={{ left: 0.5 }} />
        case 'outgoing':
            return <CustomIcon name='send' size={17} color={color} style={{ left: 0.5 }} />
        case 'default':
            return <CustomIcon name='notificationDefoult' size={22} color={color} style={{ left: 0.5 }} />
        default:
            return null
    }
}

const getRightContent = (rightContent, params) => {
    const { onPress, value, disabled } = params
    const { colors } = useTheme()
    switch (rightContent) {
        case 'arrow':
            return <CustomIcon name='next' size={17} color={colors.common.text1} style={{ left: 0.5 }} />
        default:
            return null
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
        isNew,
        handlePressShare
    } = props
    const { colors, GRID_SIZE } = useTheme()

    return (
        <SwipeRow
            leftOpenValue={68}
            stopLeftSwipe={78}
            swipeToOpenPercent={5}
            swipeToClosePercent={5}
            disableLeftSwipe={true}
        >
            <View>
                <RoundButton
                    type="share"
                    containerStyle={styles.hiddenLayer__roundButton}
                    onPress={handlePressShare}
                    defaultShadow={false}
                    noTitle
                />
            </View>
            <View style={{ flexDirection: 'column' }}>
                <TouchableOpacity
                    style={styles.container}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    delayLongPress={delayLongPress}
                    activeOpacity={0.8}
                    disabled={disabled}
                >
                    <View style={styles.iconContainer}>
                        <View style={[styles.icon, { backgroundColor: colors.common.listItem.basic.iconBgDark, opacity: disabled ? 0.5 : 1 }]}>
                            {getIcon(iconType, colors.common.listItem.basic.iconColorDark)}
                            {isNew && <View style={[styles.newIndicator, { borderColor: colors.common.background, backgroundColor: colors.notifications.newNotiesIndicator }]} />}
                        </View>
                    </View>
                    <View style={styles.mainContent}>
                        <View style={[styles.textContent, { opacity: disabled ? 0.5 : 1, paddingVertical: 13 }]}>
                            <Text numberOfLines={subtitle ? 1 : 2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                            {!!subtitle && <Text numberOfLines={1} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                        </View>
                        {!!rightContent && (
                            <View style={[styles.rightContent, { opacity: disabled || disabledRightContent ? 0.3 : 1 }]}>
                                {getRightContent(rightContent, { ...switchParams, disabled })}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                {!last && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, paddingLeft: GRID_SIZE * 3 }} />}
            </View>
        </SwipeRow>
    )
}

const styles = StyleSheet.create({
    hiddenLayer__roundButton: {
        paddingTop: 14.2,
        left: -0.5,
        alignItems: 'flex-start',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 70.5
    },
    iconContainer: {
        height: 70.5,
        paddingRight: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        width: 41.5,
        height: 41.5,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    newIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        borderWidth: 2,
        width: 12,
        height: 12,
        borderRadius: 6
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 4,
        flex: 1
    },
    textContent: {
        flex: 1,
        justifyContent: 'center'
    },
    rightContent: {
        justifyContent: 'center',
        paddingLeft: 7
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
        paddingTop: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 15,
        letterSpacing: 1.75
    }
})
