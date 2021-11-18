/**
 * @version 0.31
 * @author Vadym
*/

import React from 'react'
import { 
    View,
    Dimensions,
    StyleSheet
} from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import TextInput from '@app/components/elements/NewInput'
import Button from './buttons/Button'

const { width: SCREEN_WIDTH } = Dimensions.get('window') 

const InputAndButton = (props) => {

    const {
        ref,
        placeholder,
        onPress
    } = props

    const { GRID_SIZE } = useTheme()

    return(
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: GRID_SIZE * 1.5 }}>
            <View style={[styles.amountInput, { marginTop: GRID_SIZE, width: SCREEN_WIDTH * 0.6, height: 50 }]}>
                <TextInput
                    ref={ref}
                    name={placeholder}
                    type='TRANSACTION_AMOUNT'
                    id='TRANSACTION_AOUNT'
                    validPlaceholder={true}
                    keyboardType='numeric'
                    containerStyle={{ height: 50 }}
                    inputStyle={{ marginTop: -6 }}
                />
            </View>
            <View style={{ marginTop: GRID_SIZE }}>
                <Button
                    containerStyle={{width: 50, height: 50, padding: 0}}
                    iconType="sendMessage"
                    onPress={onPress}
                />
            </View>
        </View>
    )
}

export default InputAndButton

const styles = StyleSheet.create({
    amountInput: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    }
})