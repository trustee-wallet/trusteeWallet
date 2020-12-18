/**
 * @version 0.1
 * @author yura
 */

import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { useTheme } from '../../../modules/theme/ThemeProvider'


const CheckData = (props) => {

    const { colors } = useTheme()

    const {
        name,
        value,
        subvalue
    } = props

    return (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between', paddingTop: 22 }}>
            <View style={{ width: '40%' }}>
                <Text style={{...styles.name, color: colors.sendScreen.amount }}>{name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <LetterSpacing numberOfLines={2} text={value} textStyle={{...styles.value, color: colors.sendScreen.amount}} letterSpacing={1} />
                {subvalue && (
                    <LetterSpacing text={subvalue} textStyle={{ ...styles.subValue, paddingTop: 5 }} letterSpacing={1} />
                )}
            </View>
        </View>
    )
}

export default CheckData

const styles = {
    name: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        fontHeight: 18,
        letterSpacing: 0.5
    },
    value: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        fontHeight: 14,

    },
    subValue: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 12,
        fontHeight: 12,
        color: '#999999',
    }
}