/**
 * @version 0.52
 * @author yura
 */

import React, { useState } from 'react'
import { View, LayoutAnimation, Text, StyleSheet } from 'react-native'
import DatePicker from 'react-native-date-picker'

import { strings, sublocale } from '@app/services/i18n'
import { useTheme } from '@app/theme/ThemeProvider'

import { getCurrentDate } from '../../helpers'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'

const DatePickerComponent = (props) => {

    const [show, setShow] = useState(false)

    const { value, onDateChange, side } = props

    const { GRID_SIZE, colors } = useTheme()

    const CustomLayoutAnimation = {
        duration: 500,
        create: {
            type: LayoutAnimation.Types.linear,
            property: LayoutAnimation.Properties.opacity,
        },
        update: {
            type: LayoutAnimation.Types.spring,
            springDamping: 1.2
        },
        delate: {
            type: LayoutAnimation.Types.linear,
            property: LayoutAnimation.Properties.opacity,
        }
    };

    const triggerShowDatePicker = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation)
        setShow(!show)
    }

    return (
        <View>
            <View>
                <View style={[styles.inputPosition, { marginRight: GRID_SIZE * 2, marginLeft: GRID_SIZE * 3.5 }]}>
                    <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>{side === 'out' ? strings('account.transaction.endDate') : strings('account.transaction.startDate')}</Text>
                    <BorderedButton
                        text={value ? getCurrentDate(value) : strings('account.transaction.pickDate')}
                        customTextStyles={{ paddingHorizontal: GRID_SIZE }}
                        onPress={triggerShowDatePicker}
                    />
                </View>
            </View>
            {show ?
                <View style={{ backgroundColor: '#F5F5F5', marginTop: GRID_SIZE, borderRadius: 14 }}>
                    <DatePicker
                        locale={sublocale()}
                        date={value || new Date()}
                        mode='date'
                        style={{ marginLeft: GRID_SIZE * 1.5 }}
                        onDateChange={onDateChange}
                    />
                </View>
                : null}
        </View>
    )
}

export default DatePickerComponent

const styles = StyleSheet.create({
    inputPosition: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    categoriesText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 18
    }
})