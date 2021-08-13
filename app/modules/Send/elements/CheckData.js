/**
 * @version 0.31
 * @author yura
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

import LetterSpacing from '@app/components/elements/LetterSpacing'

import { useTheme } from '@app/theme/ThemeProvider'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { HIT_SLOP } from '@app/theme/HitSlop'


const CheckData = (props) => {

    const { colors } = useTheme()

    const {
        name,
        value,
        subvalue,
        icon,
        callback
    } = props

    return (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between', paddingTop: 22 }}>
            <TouchableOpacity style={{ width: '40%', flexDirection: 'row', alignItems: 'center' }} 
                disabled={!callback} 
                onPress={() => callback ? callback() : null}
                hitSlop={HIT_SLOP}>
                <Text style={[
                        callback && styles.callbackStyle, 
                        styles.name, 
                        { color: callback ? colors.common.radioButton.checked : colors.sendScreen.amount }
                    ]}>{name}</Text>
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
    },
    callbackStyle: {
        textDecorationLine: 'underline'
    }
})
