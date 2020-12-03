
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import RadioButton from '../../RadioButton'

import { useTheme } from '../../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../../services/i18n'


export default function SubSettingListItem(props) {
    const {
        onPress,
        last,
        title,
        subtitle,
        checked,
        radioButtonFirst,
        withoutLine,
        checkedStyle
    } = props
    const { colors, GRID_SIZE } = useTheme()

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={checked}
        >
            {radioButtonFirst ?
                <View style={[styles.mainContent, last && styles.noBorder]}>
                    <View style={[styles.rightContent, { marginRight: GRID_SIZE }]}>
                        <RadioButton
                            onChange={onPress}
                            checked={checked}
                        />
                    </View>
                    <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                        <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: checkedStyle && checked ? '#864DD9' : colors.common.text1 }]}>{title}</Text>
                        {!!subtitle && <Text numberOfLines={1} style={[styles.subtitle, { color: checkedStyle && checked ? '#864DD9' : colors.common.text2 }]}>{subtitle}</Text>}
                    </View>
                </View>
                :
                <View style={[styles.mainContent, last && styles.noBorder]}>
                    <View style={[styles.textContent, { paddingVertical: !!subtitle ? 16 : 17 }]}>
                        <Text numberOfLines={!!subtitle ? 1 : 2} style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                        {!!subtitle && <Text numberOfLines={1} style={[styles.subtitle, { color: colors.common.text2 }]}>{subtitle}</Text>}
                    </View>
                    <View style={[styles.rightContent, { marginRight: GRID_SIZE }]}>
                        <RadioButton
                            onChange={onPress}
                            checked={checked}
                        />
                    </View>
                </View>}
            {withoutLine ? null :
                !last && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
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
    }
})
