/**
 * @version 0.30
 * @author Vadym
 */

import React from 'react'
import { View, Text, Dimensions, StyleSheet } from 'react-native'

import { Bar } from 'react-native-progress'

import { useTheme } from '@app/theme/ThemeProvider'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const InfoProgressBar = (props) => {

    const {
        title,
        amount
    } = props

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    return (
        <View>
            <Text style={[styles.updateTime, { marginBottom: GRID_SIZE / 3 }]}>{title}</Text>
            <Bar
                width={WINDOW_WIDTH * 0.4}
                borderWidth={0}
                unfilledColor={colors.cashback.chartBg}
                color={colors.common.checkbox.bgChecked}
                progress={amount / 100}
            />
            <View style={[styles.bandwidthContainer, { marginTop: GRID_SIZE / 2 }]}>
                <Text style={styles.progressText}>{`${amount} / 100`}</Text>
            </View>
        </View>
    )
}

export default InfoProgressBar

const styles = StyleSheet.create({
    updateTime: {
        color: '#999999',
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        lineHeight: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    bandwidthContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    progressText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
})