/**
 * @version 0.42
 * @author Vadym
 */

import React from 'react'
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    LayoutAnimation
} from 'react-native'

import { ProgressCircle } from 'react-native-svg-charts'

import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'

const getIcon = (icon) => {

    const { colors } = useTheme()

    switch (icon) {
        case 'close':
            return <CustomIcon name='close' size={20} color={colors.common.text2} />
        case 'coinSettings':
            return <CustomIcon name='coinSettings' size={20} color={colors.common.text2} />
        default:
            return null
    }
}

const DetailsHeader = (props) => {

    const {
        onPress,
        progress,
        balance,
        currency,
        icon,
        title
    } = props

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    return (
        <TouchableOpacity style={[styles.switchableTabsLocation, { marginHorizontal: GRID_SIZE }]}
                          onPress={() => {
                              onPress()
                              LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
                          }}>
            <View style={styles.switchableTabsContainer}>
                <ProgressCircle
                    style={styles.switchableCircle}
                    strokeWidth={3.5}
                    progress={progress}
                    backgroundColor={colors.cashback.chartBg}
                    progressColor={colors.cashback.token}
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.switchableTabsText, { color: colors.common.text3 }]}>{title}</Text>
                    <Text style={[styles.switchableTabsBalance]}>{balance + ' ' + currency}</Text>
                </View>
            </View>
            <View style={{ marginTop: 15 }}>
                {getIcon(icon)}
            </View>
        </TouchableOpacity>
    )
}

export default DetailsHeader

const styles = StyleSheet.create({
    switchableTabsText: {
        fontSize: 20,
        lineHeight: 20,
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: 2
    },
    switchableTabsContainer: {
        flexDirection: 'row'
    },
    switchableTabsBalance: {
        fontSize: 16,
        lineHeight: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        letterSpacing: 1
    },
    switchableCircle: {
        width: 50,
        height: 50
    },
    textContainer: {
        marginLeft: 12,
        marginTop: 6
    },
    switchableTabsLocation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 13
    }
})
