import React from 'react'
import {
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'

import CustomIcon from '../../CustomIcon'

import Button from './Button'

import { useTheme } from '@app/theme/ThemeProvider'

const getIcon = (type, color) => {
    const { colors } = useTheme()
    switch (type) {
        case 'settings':
            return <CustomIcon name='settings' size={28} color={color} style={{ left: 0.5 }} />
        case 'back':
            return <CustomIcon name='back' size={24} color={colors.common.text3} style={{ left: 0.5 }} />
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

    return (
        <View style={styles.buttonsContainer}>
            {hasSecodary && (
                <TouchableOpacity
                    style={[styles.secondaryButton, !secondaryButton.disable && styles.buttonShadow, {
                        backgroundColor: colors.common.button.secondary.bg,
                        marginRight: GRID_SIZE
                    }]}
                    {...secondaryButton}
                >
                    {getIcon(secondaryButton.type, secondaryButton.disable ? colors.common.button.disabledBg : colors.common.text3)}
                </TouchableOpacity>
            )}

            <Button {...mainButton} containerStyle={styles.mainButton} />
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
