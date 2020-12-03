
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import IconMaterial from 'react-native-vector-icons/MaterialIcons'
import IconAwesome from 'react-native-vector-icons/FontAwesome'
import AntIcon from 'react-native-vector-icons/AntDesign'

import Button from './Button'

import { useTheme } from '../../../../modules/theme/ThemeProvider'

import { strings } from '../../../../services/i18n'


const getIcon = (type) => {
    const { colors } = useTheme()
    switch (type) {
        case 'settings': return <IconAwesome name="gear" size={22} color={colors.common.text3} />
        case 'back': return <AntIcon name="left" size={20} color={colors.common.text3} />
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
        elevation: 12
    }
})
