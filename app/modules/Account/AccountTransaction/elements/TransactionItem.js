/**
 * @version 0.30
 */
import React from 'react'
import {
    Platform,
    View,
    Text
} from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'

import CustomIcon from '@app/components/elements/CustomIcon'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'share':
            return <CustomIcon name='share' color={color} size={20} />
        case 'support':
            return <CustomIcon name='reload' color={color} size={20} />
        case 'details':
            return <CustomIcon name='share' color={color} size={20} />
        case 'notes':
            return <CustomIcon name='notes' color={color} size={20} />
        case 'card':
            return <CustomIcon name='card' color={color} size={20} />
        case 'addressFrom':
        case 'addressTo':
        case 'exchangeTo':
        case 'self':
            return <CustomIcon name='user' color={color} size={20} />
        case 'bse':
            return <CustomIcon name='swapLinked' color={color} size={20} />
        case 'txFee':
            return <CustomIcon name='feeTxScreen' color={color} size={20} />
        case 'txID':
            return <CustomIcon name='swapID2' color={color} size={20} />
        case 'balance':
            return <CustomIcon name='balance' color={color} size={20} />
        case 'wallet':
            return <CustomIcon name='wallet' color={color} size={20} />
        case 'contract':
            return <CustomIcon name='contract2' color={color} size={20} />
        case 'tokenId':
            return <CustomIcon name='tokenID' color={color} size={20} />
        case 'block':
            return <CustomIcon name='blockchain' color={color} size={20} />
        default: return null
    }
}

const TransactionItem = (props) => {


    const { colors, GRID_SIZE } = useTheme()

    const {
        mainTitle,
        title,
        subtitle,
        iconType,
        withoutBack,
        copyAction,
        bse,
        orderHandler,
        textOrder,
        colorLink,
        handleLink
    } = props

    return (
        <View style={{ marginTop: mainTitle ? 0 : 12 }}>
            {withoutBack ?
                <View style={styles.withoutBack}>
                    <View style={styles.mainContent}>
                        <View style={[styles.textContent, { paddingVertical: 3 }]}>
                            <Text style={[styles.title, { color: colors.common.text2 }]}>{title}</Text>
                            {!!subtitle ?
                                <TouchableDebounce onPress={handleLink ? handleLink : copyAction} onLongPress={handleLink ? copyAction : null}>
                                    <Text numberOfLines={2} style={[styles.subtitle, { color: colorLink ? colorLink : colors.common.text1, textDecorationLine: colorLink ? 'underline' : null }]}>{subtitle}</Text>
                                </TouchableDebounce> : null}
                        </View>
                    </View>
                </View>
                :
                <>
                    <View style={{ ...styles.wrapper, padding: GRID_SIZE, backgroundColor: colors.transactionScreen.backgroundItem }} >
                        {iconType && (
                            <View style={styles.icon}>
                                {getIcon(iconType, colors.common.text1)}
                            </View>
                        )}
                        <View style={styles.mainContent}>
                            <View style={[styles.textContent, { paddingVertical: 3 }]}>
                                <Text style={[styles.title, { color: colors.common.text2 }]}>{title}</Text>
                                {
                                    copyAction ?
                                        (
                                            <TouchableDebounce onPress={copyAction}>
                                                {!!subtitle &&
                                                    <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>}
                                            </TouchableDebounce>
                                        )
                                        :
                                        !!subtitle &&
                                        <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>

                                }
                            </View>
                            {bse && (
                                <TouchableDebounce onPress={orderHandler}
                                    style={[styles.button, { borderColor: colors.accountScreen.trxButtonBorderColor }]}>
                                    <Text style={[styles.buttonText, { color: colors.common.text1 }]}>{textOrder}</Text>
                                </TouchableDebounce>
                            )}
                        </View>
                    </View>
                </>
            }
        </View>
    )

}

export default TransactionItem

const styles = {
    wrapper: {
        borderRadius: 16,
        width: '100%',
        // backgroundColor: '#F2F2F2',
        position: 'relative',
        zIndex: 2,

        flexDirection: 'row',
    },
    withoutBack: {
        width: '100%',
        position: 'relative',

        zIndex: 2,
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',
        zIndex: 1
    },
    shadowItem: {
        flex: 1,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
    },
    icon: {
        width: 40,
        justifyContent: 'center',
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
        letterSpacing: 1.5,
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 4,
        flex: 1,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
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
        letterSpacing: 1,
    }
}

