/**
 * @version 0.77
 */

import React from 'react'
import { StyleSheet } from 'react-native'

import Button from '@app/components/elements/new/buttons/Button'

export default function MnemonicWord(props) {
    const {
        onPress,
        value,
        hidden,
    } = props
    const title = hidden ? '-'.repeat(value.length) : value.toUpperCase()

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
