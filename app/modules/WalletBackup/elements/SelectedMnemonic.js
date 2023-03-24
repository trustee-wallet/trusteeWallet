
import React from 'react'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'

import MnemonicWord from './MnemonicWord'

import { useTheme } from '@app/theme/ThemeProvider'


export default function SelectedMnemonic(props) {
    const {
        onPress,
        value,
        data = [],
        placeholder = '',
        showButtonTitle = '',
        isMnemonicVisible,
        showMnemonic,
        triggerMnemonicVisible,
        removeWord,
    } = props
    const { colors, GRID_SIZE } = useTheme()

    const triggerMnemonicVisibleOut = ()=> {
        if (!isMnemonicVisible) return;
        triggerMnemonicVisible();
    }

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={triggerMnemonicVisible}
            onPressOut={triggerMnemonicVisibleOut}
            onLongPress={showMnemonic}
            delayLongPress={2000}
        >
            <View
                style={[
                    styles.wordsContainer,
                    {
                        backgroundColor: colors.createWalletScreen.confirmMnemonic.wordsContainerBg,
                        padding: GRID_SIZE / 2,
                        marginBottom: GRID_SIZE
                    }
                ]}
            >
                {
                    data.length ? (
                        <View style={styles.wordsContent}>
                            {data.map((word, i) => (
                                <MnemonicWord
                                    value={word}
                                    key={`${word}${i}`}
                                    hidden={!isMnemonicVisible}
                                    onPress={() => removeWord(word, i)}
                                />
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.placeholder, { color: colors.createWalletScreen.confirmMnemonic.wordsContainerPlaceholder, margin: GRID_SIZE * 0.5 }]}>{placeholder}</Text>
                    )
                }
            </View>
            {!!data.length && (
                <View style={[styles.showButton, { padding: GRID_SIZE, paddingTop: 0, opacity: isMnemonicVisible ? 0.5 : 1 }]}>
                    <Text style={[styles.showButtonText, { color: colors.createWalletScreen.showMnemonic.showButtonText }]}>{showButtonTitle}</Text>
                </View>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    wordsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
        borderRadius: 16,
    },
    wordsContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    placeholder: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 18,
        lineHeight: 25,
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    showButton: {
        marginVertical: 8,
        alignItems: 'center'
    },
    showButtonText: {
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    }
})
