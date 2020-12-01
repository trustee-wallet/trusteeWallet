/**
 * @version 0.9
 */
import React from 'react'
import { Platform, View } from 'react-native'
import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'


const Loader = ({ size, color }) => {
    return (
        <View>
            {Platform.OS === 'ios' ? <UIActivityIndicator size={size} color={color}/> : <MaterialIndicator size={size} color={color}/>}
        </View>
    )
}

export default Loader
