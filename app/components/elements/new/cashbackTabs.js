/**
 * @version 0.50
 * @author Vadym
 */
import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from 'react-native'
import { useTheme } from '@app/theme/ThemeProvider'
import { HIT_SLOP } from '@app/theme/HitSlop'


export default function Tabs(props) {
    const {
        tabs,
        changeTab,
        containerStyle,
        tabStyle,
        active
    } = props

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    return (
        <View style={[styles.container, containerStyle, { backgroundColor: colors.common.button.disabledBg, marginBottom: GRID_SIZE / 2 }]}>
            {tabs.map((tab, index) => {
                const isActiveTab = active === index
                return (
                    <TouchableOpacity
                        style={[styles.tab, tabStyle, {backgroundColor: isActiveTab ? colors.common.listItem.basic.iconBgLight : null, }]}
                        activeOpacity={0.8}
                        disabled={isActiveTab}
                        key={index}
                        onPress={() => changeTab(index)}
                        hitSlop={HIT_SLOP}
                    >
                        <View>
                            <Text style={[styles.title, { color: isActiveTab ? colors.common.text1 : colors.homeScreen.newTabsText }]} numberOfLines={1} >{tab.title}</Text>
                            {tab.hasNewNoties && <View style={[styles.newNotifiesIndicator, { backgroundColor: colors.notifications.newNotiesIndicator }]} />}
                        </View>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 30,
        borderRadius: 8
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
        borderRadius: 8
    },
    title: {
        fontFamily: 'Montserrat-Bold',
        lineHeight: 18,
        fontSize: 14,
        letterSpacing: 1,
        textAlign: 'center',
        textTransform: 'uppercase',
        marginTop: -4
    },
    newNotifiesIndicator: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        top: -3,
        right: -7
    }
})
