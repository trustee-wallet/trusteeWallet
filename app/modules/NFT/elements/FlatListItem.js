/**
 * @author Vadym
 * @version 0.50
 */

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

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const FlatListItem = (props) => {

    const [loading, setLoading] = useState(true)

    const setLoad = () => {
        setLoading(false)
    }


    const {
        GRID_SIZE,
        colors
    } = useTheme()

    const {
        margin,
        data
    } = props

    const { img, title, subTitle, ExtraViewData } = data

    return (
        <TouchableOpacity style={[styles.topContent, {
            marginLeft: margin ? 16 : 0,
            marginRight: GRID_SIZE * 2,
            marginBottom: GRID_SIZE
        }]}>
            <View style={[styles.topContent__content, { marginLeft: GRID_SIZE / 2 }]}>
                    {loading ?

                        <Image
                            style={styles.img}
                            onLoad={() => setLoad}
                            source={require('@assets/images/logoWhite.png')}
                            resizeMode='center'
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
                    width: (WINDOW_WIDTH - GRID_SIZE * 3) / 2
                }]}
                array={colors.accountScreen.containerBG}
                start={styles.containerBG.start}
                end={styles.containerBG.end}
            />
            <View style={[styles.topContent__bg, {
                width: (WINDOW_WIDTH - GRID_SIZE * 3) / 2
            }]}>
                <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
            </View>
        </TouchableOpacity>
    )
}

export default FlatListItem

const styles = {
    collectionItem: {
        height: 245,
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
        height: 245,
        borderRadius: 16,
        zIndex: 0
    },
    topContent__content: {
        position: 'relative',
        zIndex: 2
    },
    topContent: {
        position: 'relative',
        height: 245,
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
        alignItems: 'center',
        justifyContent: 'center',
        resizeMode: 'center'
    }

}
