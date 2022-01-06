/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions
} from 'react-native'

import FastImage from 'react-native-fast-image'

import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import GradientView from '@app/components/elements/GradientView'
import { useTheme } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'

import { HIT_SLOP } from '@app/theme/HitSlop'
import Nfts from '@crypto/common/BlocksoftDictNfts'

const { width: WINDOW_WIDTH } = Dimensions.get('window')


const FlatListCollections = (props) => {

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    const {
        data,
        onPress
    } = props

    const { img, title, numberAssets, walletCurrency } = data

    return (

        <TouchableOpacity
            onPress={onPress}
            hitSlop={HIT_SLOP}
            style={[styles.topContent, {
                width: WINDOW_WIDTH - GRID_SIZE * 2,
                marginLeft: GRID_SIZE,
                marginTop: 12
            }]}>
            <View style={[styles.topContent__content, { paddingHorizontal: GRID_SIZE, paddingVertical: 12 }]}>
                {img ?
                    <FastImage
                        style={styles.image} 
                        source={{ 
                            uri: img,
                            priority: FastImage.priority.normal,
                        }}
                    /> : 
                    <View style={styles.image} />
                }
                <View style={styles.text}>
                    <Text style={[styles.title, { color: colors.common.text1 }]}>{title}</Text>
                    <Text style={styles.subTitle}>{strings('nftMainScreen.assets') + ': ' + numberAssets}</Text>
                </View>
                <CurrencyIcon
                    setBackground={true}
                    currencyCode={Nfts.getCurrencyCode(walletCurrency)}
                    containerStyle={{ borderWidth: 0, width: 30, height: 30, alignSelf: 'center' }}
                    markStyle={{ top: 30 }}
                    textContainerStyle={{ bottom: -19 }}
                    textStyle={{ backgroundColor: 'transparent' }}
                    iconStyle={{ fontSize: 18 }}
                />
            </View>
            <GradientView
                style={[styles.collectionItem, { width: WINDOW_WIDTH - GRID_SIZE * 2 }]}
                array={colors.accountScreen.containerBG}
                start={styles.containerBG.start}
                end={styles.containerBG.end}
            />
            <View style={[styles.topContent__bg, { width: WINDOW_WIDTH - GRID_SIZE * 2 }]}>
                <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
            </View>
        </TouchableOpacity>
    )
}

export default FlatListCollections


const styles = {
    topContent: {
        position: 'relative',
        flex: 1
    },
    topContent__content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 74,
        flexGrow: 1,
        position: 'relative',
        zIndex: 2
    },
    topContent__bg: {
        height: 74,
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: 16,
        zIndex: 0
    },
    shadow: {
        height: '100%',
        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 0
    },
    collectionItem: {
        height: 74,
        borderRadius: 20,
        position: 'absolute'
    },
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    image: {
        borderRadius: 13,
        width: 50,
        height: 50
    },
    text: {
        flex: 1,
        marginLeft: 12,
        alignSelf: 'center'
    },
    title: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        letterSpacing: 0.5
    },
    subTitle: {
        color: '#999999'
    }
}
