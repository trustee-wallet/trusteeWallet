
import React from 'react'
import {
    Text,
    View,
    StyleSheet,
} from 'react-native'

import { TouchableOpacity } from '@gorhom/bottom-sheet'

import RadioButton from '../../RadioButton'

import { useTheme } from '@app/theme/ThemeProvider'

import CustomIcon from '@app/components/elements/CustomIcon'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'customSort':
            return <CustomIcon name='customSort' size={18} color={color} style={{ left: 1 }} />
        case 'tokenFirstSort':
            return <CustomIcon name='tokenFirstSort' size={18} color={color} style={{ left: 1 }} />
        case 'coinFirstSort':
            return <CustomIcon name='coinFirstSort' size={18} color={color} style={{ left: 1 }} />
        case 'nameSort':
            return <CustomIcon name='nameSort' size={18} color={color} style={{ left: 1 }} />
        case 'balanceSort':
            return <CustomIcon name='balanceSort' size={18} color={color} style={{ left: 1 }} />
        case 'wallet':
            return <CustomIcon name='shield' size={16} color={color} style={{ left: 1 }} />
        case 'eth':
            return <CustomIcon name='ETH' size={18} color={color} style={{ left: 1 }} />
        case 'matic':
            return <CustomIcon name='ETH_MATIC' size={18} color={color} />
        case 'bnb_smart':
            return <CustomIcon name='BNB_SMART' size={18} color={color} style={{ left: 1 }} />
        case 'optimism':
            return <CustomIcon name='OPTIMISM' size={18} color={color} style={{ left: 1 }} />
        case 'etc':
            return <CustomIcon name='ETC' size={18} color={color} style={{ left: 1 }} />
        case 'amb':
            return <CustomIcon name='AMB' size={18} color={color} style={{ left: 1 }} />
        case 'eth_ropsten':
            return <CustomIcon name='ETH_ROPSTEN' size={18} color={color} style={{ left: 1 }} />
        case 'eth_rinkeby':
            return <CustomIcon name='ETH_RINKEBY' size={18} color={color} style={{ left: 1 }} />
        case 'arrowRight':
            return <CustomIcon name='next' size={18} color={color} style={{ left: 1 }} />
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
        containerStyle,
        percentValueText,
        iconWithoutBackground,
        radioStyles
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
                <View style={containerStyle}>
                    <View style={[styles.mainContent, last && styles.noBorder]}>
                        <View style={[styles.rightContent, { marginRight: GRID_SIZE }]}>
                            <RadioButton
                                onChange={onPress}
                                checked={checked}
                                radioStyles={radioStyles}
                            />
                        </View>
                        <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                            <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: checkedStyle && checked ? '#864DD9' : colors.common.text1 }]}>{title}</Text>
                            {!!subtitle && <Text numberOfLines={3} style={[styles.subtitleFirst, { color: checkedStyle && checked ? '#864DD9' : colors.common.text2 }]}>{subtitle}</Text>}
                        </View>
                        {iconType &&
                            <View style={[styles.icon, { backgroundColor: iconWithoutBackground ? ' ' : colors.common.listItem.basic.iconBgDark }]}>
                                {getIcon(iconType, iconWithoutBackground ? colors.backDropModal.buttonText : colors.common.listItem.basic.iconColorDark)}
                            </View>
                        }
                    </View>
                    {(ExtraView && checked) && (
                        <ExtraView ExtraViewParams={ExtraViewParams} />
                    )}
                </View>
                :
                <View style={[styles.container, containerStyle]}>
                    {iconType &&
                        <View style={[styles.icon, { backgroundColor: colors.common.listItem.basic.iconBgDark }]}>
                            {getIcon(iconType, colors.common.listItem.basic.iconColorDark)}
                        </View>
                    }
                    <View style={[styles.mainContent, last && styles.noBorder]}>
                        <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                            <Text numberOfLines={2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                            {(percentValue || percentValue === 0) &&
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={[styles.text, { color: colors.common.text3 }]}>
                                        {`${percentValueText} ${percentValue}%`}
                                    </Text>
                                </View>
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
                !last && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: (percentValue || percentValue === 0) ? 0 : GRID_SIZE * 2 }} />}
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
    text: {
        marginTop: -4,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        lineHeight: 17,
        letterSpacing: 0.5,
        marginBottom: -6
    }
})
