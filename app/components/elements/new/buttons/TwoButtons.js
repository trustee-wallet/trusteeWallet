
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import CustomIcon from '../../CustomIcon'

import Button from './Button'

import { useTheme } from '../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


const getIcon = (type) => {
    const { colors } = useTheme()
    switch (type) {
        case 'settings':
            return <CustomIcon name="settings" size={28} color={colors.common.text3} style={{ left: 0.5 }} />
        case 'back':
            return <CustomIcon name="back" size={24} color={colors.common.text3} style={{ left: 0.5 }} />
        default: return null
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
        <View style={styles.container}>
            {hasSecodary && (
                <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.common.button.secondary.bg, marginRight: GRID_SIZE }]}
                    {...secondaryButton}
                >
                    {getIcon(secondaryButton.type)}
                </TouchableOpacity>
            )}

            <Button {...mainButton} containerStyle={styles.mainButton} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
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

        shadowColor: '#404040',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 6
        },
        elevation: 8
    }
})
