
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import Button from '../../../components/elements/new/buttons/Button'

import { useTheme } from '@app/theme/ThemeProvider'

import { strings } from '../../../services/i18n'


export default function MnemonicWord(props) {
    const {
        onPress,
        value,
        hidden,
    } = props
    const title = hidden ? '-'.repeat(value.length) : value.toUpperCase()
    const { colors } = useTheme()

    return (
        <Button
            onPress={onPress}
            title={title}
            containerStyle={styles.container}
            textStyle={[styles.text, hidden && styles.textHidden]}
        />
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 9,
        margin: 8
    },
    text: {
        fontSize: 10,
        lineHeight: 11,
    },
    textHidden: {
        fontSize: 17,
        marginTop: 3,
        marginBottom: -3
    }
})
