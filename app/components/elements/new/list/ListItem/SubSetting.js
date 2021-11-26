
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import RadioButton from '../../RadioButton'

import { useTheme } from '@app/theme/ThemeProvider'

import PercentView from '../../PercentView'
import CustomIcon from '@app/components/elements/CustomIcon'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'customSort':
            return <CustomIcon name='customSort' size={14} color={color} style={{ left: 1 }} />
        case 'tokenFirstSort':
            return <CustomIcon name='tokenFirstSort' size={14} color={color} style={{ left: 1 }} />
        case 'coinFirstSort':
            return <CustomIcon name='coinFirstSort' size={14} color={color} style={{ left: 1 }} />
        case 'nameSort':
            return <CustomIcon name='nameSort' size={14} color={color} style={{ left: 1 }} />
        case 'balanceSort':
            return <CustomIcon name='balanceSort' size={14} color={color} style={{ left: 1 }} />
        case 'wallet':
            return <CustomIcon name='shield' size={14} color={color} style={{ left: 1 }} />
        default:
            return null
    }
}

export default function SubSettingListItem(props) {
    const {
        onPress,
        last,
        title,
        subtitle,
        checked,
        radioButtonFirst,
        withoutLine,
        checkedStyle,
        ExtraView,
        ExtraViewParams,
        percentValue,
        iconType,
        containerStyle
    } = props
    const { colors, GRID_SIZE } = useTheme()

    return (
        <TouchableOpacity
            // style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={checked}
        >
            {radioButtonFirst ?
                <>
                    <View style={[styles.mainContent, last && styles.noBorder]}>
                        <View style={[styles.rightContent, { marginRight: GRID_SIZE }]}>
                            <RadioButton
                                onChange={onPress}
                                checked={checked}
                            />
                        </View>
                        <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                            <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: checkedStyle && checked ? '#864DD9' : colors.common.text1 }]}>{title}</Text>
                            {!!subtitle && <Text numberOfLines={3} style={[styles.subtitleFirst, { color: checkedStyle && checked ? '#864DD9' : colors.common.text2 }]}>{subtitle}</Text>}
                        </View>
                    </View>
                    {(ExtraView && checked) && (
                        <ExtraView ExtraViewParams={ExtraViewParams} />
                    )}
                </>
                :
                <View style={[styles.container, containerStyle]}>
                    {iconType &&
                        <View style={[styles.icon, { backgroundColor: colors.common.listItem.basic.iconBgLight }]}>
                            {getIcon(iconType, colors.common.listItem.basic.iconColorLight)}
                        </View>
                    }
                    <View style={[styles.mainContent, last && styles.noBorder]}>
                        <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                            {percentValue ?
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text numberOfLines={2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                                    <PercentView
                                        containerStyle={{ marginTop: -3 }}
                                        value={percentValue}
                                    />
                                </View>
                                :
                                <Text numberOfLines={2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                            }
                            {!!subtitle && <Text numberOfLines={1} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                        </View>
                        <View style={[styles.rightContent, { marginRight: GRID_SIZE }]}>
                            <RadioButton
                                onChange={onPress}
                                checked={checked}
                            />
                        </View>
                    </View>
                </View>}
            {withoutLine ? null :
                !last && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17
    },
    subtitle: {
        marginTop: 7,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 13,
        letterSpacing: 1.75
    },
    subtitleFirst: {
        marginTop: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 18,
        letterSpacing: 1.75
    },
    icon: {
        width: 32,
        height: 32,
        borderRadius: 20,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
})
