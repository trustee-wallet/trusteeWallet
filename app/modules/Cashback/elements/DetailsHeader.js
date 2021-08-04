import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'
import React, { PureComponent } from 'react'
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet
} from 'react-native'

import { ProgressCircle } from 'react-native-svg-charts'

const getIcon = (icon) => {

    const { colors } = useTheme()

    switch(icon) {
        case 'close':
            return <CustomIcon name='close' size={25} color={colors.common.text2} />
        case 'more':
            return <CustomIcon name='coinSettings' size={25} color={colors.common.text2} />
        default:
            return null
    }
}

const DetailsHeader = (props) => {

    const {
        onPress,
        title,
        subTitle,
        value,
        icon
    } = props

    const { colors, GRID_SIZE } = useTheme()

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.container, { marginTop: GRID_SIZE }]}
        >
            <View style={styles.wrapper}>
                <View style={styles.chart}>
                    <ProgressCircle
                        style={{ height: 43, width: 43, marginHorizontal: GRID_SIZE }}
                        progress={value}
                        progressColor={colors.common.radioButton.checked}
                        backgroundColor={colors.cashback.chartBg}
                        strokeWidth={4}
                    />
                    <View style={styles.description}>
                        <Text style={[styles.title, { color: colors.common.text3 }]}>{title}</Text>
                        <Text style={[styles.subTitle, { color: colors.common.checkbox.borderColorUnchecked }]}>{subTitle}</Text>
                    </View>
                </View>
                <View style={[styles.rightBtn, { paddingRight: GRID_SIZE }]}>
                    {getIcon(icon)}
                </View>
            </View>

        </TouchableOpacity>
    )
}

export default DetailsHeader

const styles = StyleSheet.create({
    container: {
        // flex: 5
    },
    wrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    description: {
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Montserrat-SemiBold',
        fontWeight: '600',
        fontSize: 17,
        lineHeight: 17
    },
    subTitle: {
        fontFamily: 'SFUIDisplay-Regular',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    },
    rightBtn: {
        justifyContent: 'center',
        alignItems: 'center',
    }
})
