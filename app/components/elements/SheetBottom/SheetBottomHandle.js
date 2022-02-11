/**
 * @version 0.53
 * @author yura 
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@app/theme/ThemeProvider'

const CustomHandle = (props) => {

    const { GRID_SIZE } = useTheme()

    return <View {...props} style={[styles.topBtn, { marginTop: GRID_SIZE }]} />
}

export default CustomHandle

const styles = StyleSheet.create({
    topBtn: {
        height: 4,
        width: 40,
        borderRadius: 5,
        backgroundColor: '#999999',
        alignSelf: 'center'
    }
})
