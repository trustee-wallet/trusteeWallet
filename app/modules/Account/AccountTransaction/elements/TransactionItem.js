/**
 * @version 0.30
 */
import React from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
} from 'react-native'

import { useTheme } from '@app/modules/theme/ThemeProvider'

import CustomIcon from '@app/components/elements/CustomIcon'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'share':
            return <CustomIcon name={'share'} color={color} size={20} />
        case 'support':
            return <CustomIcon name={'reload'} color={color} size={20} />
        case 'details':
            return <CustomIcon name={'share'} color={color} size={20} />
        case 'notes':
            return <CustomIcon name={'notes'} color={color} size={20} />
        case 'card':
            return <CustomIcon name={'card'} color={color} size={20} />
        case 'addressFrom':
        case 'addressTo':
        case 'exchangeTo':
        case 'self':
            return <CustomIcon name={'user'} color={color} size={20} />
        default: return null
    }
}

const TransactionItem = (props) => {


    const { colors, GRID_SIZE } = useTheme()

    const {
        title,
        subtitle,
        iconType,
        withoutBack,
        copyAction
    } = props

    return (
        <View style={{ marginTop: 16 }}>
            {withoutBack ?
                <View style={styles.withoutBack}>
                    <View style={styles.mainContent}>
                        <View style={[styles.textContent, { paddingVertical: 3 }]}>
                            <Text style={[styles.title, { color: colors.common.text2 }]}>{title}</Text>
                            {!!subtitle ?
                                    <TouchableOpacity onPress={copyAction}>
                                        <Text style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>
                                    </TouchableOpacity> : null}
                        </View>
                    </View>
                </View>
                :
                <>
                        <View style={{ ...styles.wrapper, flexDirection: 'row', padding: GRID_SIZE, backgroundColor: colors.transactionScreen.backgroundItem  }} >
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
                                                <TouchableOpacity onPress={copyAction}>
                                                {!!subtitle &&
                                                    <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>}
                                                </TouchableOpacity>
                                            )
                                        :
                                            !!subtitle &&
                                            <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>

                                    }
                                </View>
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
}

