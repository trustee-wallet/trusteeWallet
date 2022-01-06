/**
 * @author Vadym
 * @version 0.50
 */

import React from 'react'
import {
    View,
    Dimensions,
    TouchableOpacity
} from 'react-native'
import FastImage from 'react-native-fast-image'

import GradientView from '@app/components/elements/GradientView'
import { useTheme } from '@app/theme/ThemeProvider'
import NftTokenInfo from '@app/modules/NFT/elements/NftTokenInfo'
import { HIT_SLOP } from '@app/theme/HitSlop'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const FlatListItem = (props) => {

    const {
        GRID_SIZE,
        colors
    } = useTheme()

    const {
        margin,
        data,
        numColumns,
        onPress
    } = props

    const { img, title, ExtraViewData } = data

    const widthItem = (WINDOW_WIDTH - GRID_SIZE * (numColumns + 1)) / numColumns

    return (
        <View>
            <TouchableOpacity
                onPress={onPress}
                hitSlop={HIT_SLOP}
                style={[styles.topContent, {
                    height: widthItem * 1.1,
                    marginLeft: margin ? GRID_SIZE : 0,
                    marginRight: GRID_SIZE,
                    marginVertical: GRID_SIZE * 0.5
                }]}>
                <View style={[styles.topContent__content, {
                    paddingBottom: GRID_SIZE,
                    width: widthItem
                }]}>
                    {img ?
                        <FastImage
                            style={styles.img}
                            source={{
                                uri: img,
                                priority: FastImage.priority.normal,
                            }}
                        />
                        :
                        <View style={styles.img} />
                    }
                    <View style={styles.descriptions}>
                        <NftTokenInfo
                            title={title}
                        />
                        {ExtraViewData && (
                            <ExtraViewData />
                        )}
                    </View>
                </View>
                <GradientView
                    style={[styles.collectionItem, {
                        height: widthItem * 1.1,
                        width: widthItem
                    }]}
                    array={colors.accountScreen.containerBG}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                />
                <View style={[styles.topContent__bg, {
                    height: widthItem * 1.1,
                    width: widthItem
                }]}>
                    <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default FlatListItem

const styles = {
    collectionItem: {
        borderRadius: 20,
        position: 'absolute'
    },
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        // height: WINDOW_WIDTH * 0.6125,
        borderRadius: 16,
        zIndex: 0
    },
    topContent__content: {
        flexGrow: 1,
        flexDirection: 'column',
        position: 'relative',
        zIndex: 2
    },
    topContent: {
        position: 'relative',
        justifyContent: 'space-between',
        // height: WINDOW_WIDTH * 0.6125,
        flex: 1
    },
    topContent__top: {
        position: 'relative',
        alignItems: 'center'
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
    img: {
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        width: '100%',
        height: '55%',
    },
    descriptions: {
        flexGrow: 1,
        justifyContent: 'space-between',
        marginHorizontal: 12,
        marginTop: 12
    }
}
