/**
 * @version 0.77
 * @author Vadym
 */

import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

import { ProgressCircle } from 'react-native-svg-charts'

import { useTheme } from '@app/theme/ThemeProvider'


const ProgressCircleBox = (props) => {

    const {
        additionalStyles,
        progress,
        cashbackPercent,
        cpaPercent,
        cashbackTitle,
        cpaTitle
    } = props

    const { colors } = useTheme()

    return(
        <View style={[styles.circleBox, additionalStyles]}>
            <View style={styles.percentWrapper}>
                <Text style={[styles.circlePercent, { color: colors.common.text1 }]}>{(cashbackPercent >= 100 ? '100' : cashbackPercent) + ' %'}</Text>
                <Text style={styles.circleTitle}>{cashbackTitle}</Text>
            </View>
            <View style={[styles.circle, { transform: [ { scaleX: -1 } ] }]}>
                <ProgressCircle
                    style={styles.progressCircle}
                    strokeWidth={3.5}
                    progress={progress}
                    backgroundColor={ progress ? colors.cashback.circleBg : colors.createWalletScreen.showMnemonic.wordIndexText}
                    progressColor={colors.cashback.token}
                />
            </View>
            <View style={styles.percentWrapper}>
                <Text style={[styles.circlePercent, { color: colors.common.text1, textAlign: 'left' }]}>{(cpaPercent >= 100 ? '100' : cpaPercent) + ' %'}</Text>
                <Text style={[styles.circleTitle, { textAlign: 'left' }]}>{cpaTitle}</Text>
            </View>
        </View>
    )
}

export default ProgressCircleBox

const styles = StyleSheet.create({
    circleBox: {
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    },
    progressCircle: {
        height: 45,
        width: 40
    },
    circleTitle: {
        marginTop: 3,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'right',
        letterSpacing: 1,
        color: '#999999'
    },
    circlePercent: {
        marginTop: 4,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 20,
        textAlign: 'right'
    },
    circle: {
        paddingRight: 2,
        paddingBottom: 2,
        marginRight: 5
    },
    percentWrapper: {
        minWidth: 80
    }
})
