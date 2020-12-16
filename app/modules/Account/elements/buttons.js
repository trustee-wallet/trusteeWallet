import React from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions
} from 'react-native'
import Feather from 'react-native-vector-icons/Feather'
import CustomIcon from '../../../components/elements/CustomIcon'

import { useTheme } from '../../../modules/theme/ThemeProvider'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'x':
            return <Feather name="x" style={{ marginTop: 2, marginLeft: 1 }} size={30} color={color} />
        case 'share':
            return <CustomIcon name={'share'} color={color} size={26} />
        case 'support':
            return <CustomIcon name={'support'} color={color} size={26} />
        case 'details':
            return <CustomIcon name={'details'} color={color} size={26} />
        case 'check':
            return <CustomIcon name={'receipt'} color={color} size={26} />
        case 'canceled':
            return <CustomIcon name={'cancel'} color={color} size={26} />
        case 'remove':
            return <CustomIcon name={'delete'} color={color} size={26} />
        case 'rbf':
            return <CustomIcon name={'rbf'} color={color} size={26} />
        default: return null
    }
}

const renderItem = (data, title) => {

    const { colors } = useTheme()

    return (
        <>
            {data.map((item) => {
                return (
                    // eslint-disable-next-line react/jsx-key
                    <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 90 }}>
                        <TouchableOpacity style={styles.icon} onPress={item.action}>
                            {getIcon(item.icon.toString(), '#f7f7f7')}
                        </TouchableOpacity>
                        {title && (
                            <Text style={styles.title}>{item.title}</Text>
                        )}
                    </View>
                )
            })}
        </>
    )
}

const Buttons = (props) => {

    const {
        data,
        title
    } = props

    const { colors, GRID_SIZE } = useTheme()

    return (
        <View style={{ width: SCREEN_WIDTH < 300 ? '80%' : 300, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {renderItem(data, title)}
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