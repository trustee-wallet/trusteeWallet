/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    StyleSheet
} from 'react-native'
import { TouchableOpacity } from '@gorhom/bottom-sheet'

import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'copy':
            return <CustomIcon name='copy' size={24} color={color} />
        case 'blockchair':
            return <CustomIcon name='blockchair' size={20} color={color} />
        case 'invoice':
            return <CustomIcon name='invoice' size={20} color={color} />
        case 'toUp':
            return <CustomIcon name='toUp' size={20} color={color} />
        case 'toDown':
            return <CustomIcon name='toDown' size={20} color={color} />
        case 'edit':
            return <CustomIcon name='edit' size={20} color={color} />
        case 'hideAsset':
            return <CustomIcon name='hideAsset' size={20} color={color} />
        default:
            return null
    }
}

const InvoiceListItem = (props) => {

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    const {
        title,
        onPress,
        activeOpacity = 0.5,
        containerStyle,
        textStyles,
        textColor = colors.backDropModal.buttonText,
        iconType,
        last = false
    } = props



    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={activeOpacity}
            style={[styles.container, { backgroundColor: colors.backDropModal.buttonBg }, containerStyle]}
        >
            <View style={[styles.textContainer, { marginHorizontal: GRID_SIZE }]}>
                <Text style={[styles.text, textStyles, { color: textColor }]} numberOfLines={2} >{title}</Text>
                {getIcon(iconType, textColor)}
            </View>
            {!last && <View style={[styles.underline, { backgroundColor: colors.backDropModal.underline }]} />}
        </TouchableOpacity>
    )
}

export default InvoiceListItem

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50
    },
    text: {
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 18,
        letterSpacing: 0.5,
    },
    textContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    underline: {
        position: 'absolute',
        width: '100%',
        height: 1,
        bottom: 0
    }
})