/**
 * @version 0.31
 * @author yura
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

import LetterSpacing from '@app/components/elements/LetterSpacing'

import { useTheme } from '@app/theme/ThemeProvider'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'


const CheckData = (props) => {

    const { colors } = useTheme()

    const {
        name,
        value,
        subvalue,
        icon,
        iconCallback
    } = props

    return (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between', paddingTop: 22 }}>
            <TouchableOpacity style={{ width: '40%', flexDirection: 'row', alignItems: 'center' }} disabled={!iconCallback} onPress={() => iconCallback ? iconCallback() : null}>
                <Text style={{...styles.name, color: colors.sendScreen.amount }}>{name}</Text>
                    {icon &&
                    <MaterialCommunityIcons
                        name="information-outline"
                        size={20}
                        color={'#864DD9'}
                        style={{ paddingLeft: 2, marginTop: 3 }}
                        />
                    }
            </TouchableOpacity>
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

const styles  = StyleSheet.create({
    name: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.5
    },
    value: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        lineHeight: 18,

    },
    subValue: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 12,
        lineHeight: 12,
        color: '#999999',
    }
})
