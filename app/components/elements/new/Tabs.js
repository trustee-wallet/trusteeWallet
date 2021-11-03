
import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform
} from 'react-native'
import { useTheme } from '@app/theme/ThemeProvider'


export default function Tabs(props) {
    const {
        tabs,
        changeTab,
        containerStyle,
        tabStyle
    } = props
    const { colors } = useTheme()

    return (
        <View style={[styles.container, containerStyle]}>
            {tabs.map(tab => (
                <TouchableOpacity
                    style={[styles.tab, tabStyle]}
                    activeOpacity={0.8}
                    key={tab.index}
                    disabled={tab.active}
                    onPress={() => changeTab(tab)}
                >
                    <View>
                        <Text style={[styles.title, { color: tab.active ? colors.common.text1 : colors.common.text2 }]} numberOfLines={1} >{tab.title}</Text>
                        {tab.hasNewNoties && <View style={[styles.newNotifiesIndicator, { backgroundColor: colors.notifications.newNotiesIndicator }]} />}
                    </View>
                    {tab.active && <View style={[styles.activeTabIndicator, { backgroundColor: colors.common.text3 }]} />}
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 16,
        marginBottom: -7, // negative value because of paddingBottom in ExtraView into Header component
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 16,
        letterSpacing: 1,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    newNotifiesIndicator: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        top: -3,
        right: -7
    },
    activeTabIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 4
    }
})
