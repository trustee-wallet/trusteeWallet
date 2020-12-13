import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput, Dimensions, PixelRatio,
    SafeAreaView, ScrollView
} from 'react-native'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import AntIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import Theme from '../../../themes/Themes'

import { useTheme } from '../../../modules/theme/ThemeProvider'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'wallet':
            return <MaterialCommunityIcon name="wallet" color={color} size={22} style={{ marginTop: 2, marginLeft: 1 }} />
        case 'accounts':
            return <FontAwesomeIcon name="address-book" color={color} size={19} style={{ marginLeft: 2 }} />
        case 'pinCode':
            return <MaterialIcon name="lock" color={color} size={30} style={{ marginLeft: 2 }} />
        case 'x':
            return <Feather name="x" style={{ marginTop: 2, marginLeft: 1 }} size={30} color={color} />
        default: return null
    }
}

const renderItem = (data) => {

    const { colors } = useTheme()

    return (
        <>
            {data.map((item) => {
                return (
                    <View style={{ flexDirection: 'column', paddingHorizontal: 25 }}>
                        <TouchableOpacity style={styles.icon} onPress={item.action}>
                            {getIcon(item.icon.toString(), '#f7f7f7')}
                        </TouchableOpacity>
                        <Text style={styles.title} >{item.title}</Text>
                    </View>
                )
            })}
        </>
    )
}

const Buttons = (props) => {

    const {
        data
    } = props

    const { colors, GRID_SIZE } = useTheme()

    return (
        <View style={{ width: SCREEN_WIDTH < 300 ? '80%' : 300, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {renderItem(data)}
            </View>
        </View>
    )

}

export default Buttons

const styles = {
    icon: {
        width: 54,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 50,
        backgroundColor: '#404040'
    },
    title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        lineHeight: 14,
        textAlign: 'center',
        letterSpacing: 1.5,
        color: '#999999',
        marginTop: 6
    }
}