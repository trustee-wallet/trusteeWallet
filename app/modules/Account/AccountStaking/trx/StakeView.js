/**
 * @version 0.30
 */
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'

import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import UIDict from '@app/services/UIDict/UIDict'
import CustomIcon from '@app/components/elements/CustomIcon'

const StakeView = (props) => {
    const { colors, isLight, GRID_SIZE } = useTheme()

    const { title, balance, textButton, handleButton, currencyCode } = props

    const dict = new UIDict(currencyCode)
    const mainColorCurrency = dict.settings.colors['mainColor']
    const darkColorCurrency = dict.settings.colors['darkColor']

    return (
        <View
            style={{
                ...styles?.wrapper,
                padding: GRID_SIZE,
                backgroundColor: colors.transactionScreen.backgroundItem
            }}>
            <CustomIcon name='staking' size={24} color={colors.common.text1} />
            <View style={styles?.mainContent}>
                <View style={[styles?.textContent, { paddingVertical: 3 }]}>
                    <Text style={[styles?.title, { color: colors.common.text2 }]}>{title}</Text>

                    <Text numberOfLines={1} style={[styles?.subtitle, { color: colors.common.text1 }]}>
                        {balance + ' '}
                        <Text style={{ color: isLight ? mainColorCurrency : darkColorCurrency }}>{currencyCode}</Text>
                    </Text>
                </View>
                {textButton && balance * 1 > 0 && (
                    <TouchableDebounce
                        style={[
                            styles?.button,
                            {
                                borderColor: colors.accountScreen.trxButtonBorderColor
                            }
                        ]}
                        onPress={handleButton}>
                        <Text style={[styles?.buttonText, { color: colors.common.text1 }]}>{textButton}</Text>
                    </TouchableDebounce>
                )}
            </View>
        </View>
    )
}

export default StakeView

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 16,
        width: '100%',
        position: 'relative',
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 14
    },
    subtitle: {
        marginTop: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 8,
        flex: 1
    },
    textContent: {
        flex: 1,
        justifyContent: 'center'
    },
    button: {
        borderRadius: 8,
        borderWidth: 2,
        minWidth: 85,
        height: 34,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 6,
        paddingRight: 6
    },
    buttonText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    }
})
