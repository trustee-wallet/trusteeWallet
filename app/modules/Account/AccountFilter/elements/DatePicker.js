/**
 * @version 0.52
 * @author yura
 */

import React, { useState } from 'react'
import { View, LayoutAnimation } from 'react-native'
import DatePicker from 'react-native-date-picker'

import { strings, sublocale } from '@app/services/i18n'
import { useTheme } from '@app/theme/ThemeProvider'

import TextAndButton from '@app/components/elements/new/TextAndButton'
import { getCurrentDate } from '../../helpers'

const DatePickerComponent = (props) => {

    const [show, setShow] = useState(false)

    const { value, onDateChange, side } = props

    const { GRID_SIZE } = useTheme()

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

    const trigerShowDatePicker = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation)
        setShow(!show)
    }

    return (
        <View>
            <TextAndButton
                title={side === 'out' ? strings('account.transaction.endDate') : strings('account.transaction.startDate')}
                buttonText={value ? getCurrentDate(value) : strings('account.transaction.pickDate')}
                onPress={trigerShowDatePicker}
            />
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