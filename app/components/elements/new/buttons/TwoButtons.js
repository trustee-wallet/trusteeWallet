import React from 'react'
import {
    View,
    StyleSheet
} from 'react-native'

import CustomIcon from '../../CustomIcon'

import Button from './Button'

import { useTheme } from '@app/theme/ThemeProvider'
import TouchableDebounce from '../TouchableDebounce'

const getIcon = (type, color) => {
    const { colors } = useTheme()
    switch (type) {
        case 'settings':
            return <CustomIcon name='settings' size={28} color={color} style={{ left: 0.5 }} />
        case 'back':
            return <CustomIcon name='back' size={24} color={colors.common.text3} style={{ left: 0.5 }} />
        case 'sendMessage':
            return <CustomIcon name='sendMessage' size={28} color={color} style={{ left: 0.5 }} />
        case 'clean':
            return <CustomIcon name='cancel_filter' size={24} color={color} style={{ left: 0.5 }} />
        default:
            return null
    }
}

export default function TwoButtons(props) {

    const {
        mainButton = {},
        secondaryButton = {}
    } = props

    const { colors, GRID_SIZE } = useTheme()

    const hasSecodary = !!Object.keys(secondaryButton || {}).length

    const hasMain = !!Object.keys(mainButton || {}).length

    return (
        <View style={styles.buttonsContainer}>
            {hasSecodary && (
                <TouchableDebounce
                    style={[styles.secondaryButton, !secondaryButton.disable && styles.buttonShadow, secondaryButton.additionalSecondaryStyles, {
                        backgroundColor: !secondaryButton.inverted ? colors.common.button.secondary.bg : colors.common.button.bg,
                        marginRight: GRID_SIZE
                    }]}
                    {...secondaryButton}
                >
                    {getIcon(secondaryButton.type, secondaryButton.disable ? colors.common.button.disabledBg : !secondaryButton.inverted ? colors.common.text3 : '#F7F7F7')}
                </TouchableDebounce>
            )}

            {hasMain && <Button {...mainButton} containerStyle={styles.mainButton} />}
        </View>
    )
}

const styles = StyleSheet.create({
    buttonsContainer: {
        flexDirection: 'row'
    },
    mainButton: {
        flex: 1
    },
    secondaryButton: {
        height: 50,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    buttonShadow: {
        shadowColor: '#404040',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 6
        },
        elevation: 6
    },
})
