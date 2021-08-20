/**
 * @author Vadym
 * @version 0.50
 */

//  <CurrencyIcon
//                     setBackground={true}
//                     currencyCode={walletCurrency}
//                     containerStyle={{ borderWidth: 0, width: 40, height: 40 }}
//                     markStyle={{ top: 30 }}
//                     textContainerStyle={{ bottom: -19 }}
//                     textStyle={{ backgroundColor: 'transparent' }}
//                 />

import React, { useState } from 'react'
import {
    View,
    Dimensions,
    Image,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native'
import GradientView from '@app/components/elements/GradientView'
import { useTheme } from '@app/theme/ThemeProvider'
import NftTokenInfo from '@app/modules/NFT/elements/NftTokenInfo'
import NavStore from '@app/components/navigation/NavStore'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const FlatListItem = (props) => {

    const [loading, setLoading] = useState(true)

    const setLoad = () => {
        setLoading(false)
    }

    const goNext = () => {
        NavStore.goNext('NftDetailedInfo')
    }

    const {
        GRID_SIZE,
        colors
    } = useTheme()

    const {
        margin,
        data,
        numColumns
    } = props

    const { img, title, subTitle, ExtraViewData } = data

    const widthItem = (WINDOW_WIDTH - GRID_SIZE * (numColumns + 1)) / numColumns

    return (

        <TouchableOpacity
            onPress={goNext}
            style={[styles.topContent, {
                height: widthItem * 1.4,
                marginLeft: margin ? GRID_SIZE : 0,
                marginRight: GRID_SIZE,
                marginVertical: GRID_SIZE
            }]}>
            <View style={[styles.topContent__content, {
                marginBottom: GRID_SIZE,
                width: widthItem - GRID_SIZE * 1.5
            }]}>
                {loading ?
                    <Image
                        style={styles.img}
                        onLoad={() => setLoad}
                        source={{
                            uri: img,
                            cache: 'only-if-cached'
                        }}
                    /> :
                    <ActivityIndicator
                        style={styles.img}
                        color={'#999999'}
                    />

                }
                <NftTokenInfo
                    title={title}
                    subTitle={subTitle}
                />
                {ExtraViewData && (
                    <ExtraViewData />
                )}
            </View>
            <GradientView
                style={[styles.collectionItem, {
                    height: widthItem * 1.4,
                    width: widthItem
                }]}
                array={colors.accountScreen.containerBG}
                start={styles.containerBG.start}
                end={styles.containerBG.end}
            />
            <View style={[styles.topContent__bg, {
                height: widthItem * 1.4,
                width: widthItem
            }]}>
                <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
            </View>
        </TouchableOpacity>
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
        marginHorizontal: 12,
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
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
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        width: '100%',
        height: '40%',
        resizeMode: 'center'
    }
}
