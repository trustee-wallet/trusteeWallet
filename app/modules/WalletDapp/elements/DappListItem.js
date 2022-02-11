/**
 * @version 0.54
 * @author Vadym
 */

import React, { useState } from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'

import FastImage from 'react-native-fast-image'

import AccountGradientBlock from '@app/components/elements/new/AccountGradientBlock'
import { useTheme } from '@app/theme/ThemeProvider'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


const DappListItem = (props) => {

    const [errorLoad, setErrorLoad] = useState(false)

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    const { data, last, onPress } = props

    const imgLink = `${BlocksoftExternalSettings.getStatic('DAPPS_IMAGE_LINK')}${data?.dappsDomenName}.png`

    return (
        <TouchableOpacity
            onPress={() => onPress(data)}
            style={{ marginBottom: last ? GRID_SIZE : -GRID_SIZE, marginHorizontal: GRID_SIZE }}
            activeOpacity={0.8}
        >
            <AccountGradientBlock>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {errorLoad ?
                        <Image
                            style={styles.logo}
                            source={require('@assets/images/logoWithWhiteBG.png')}
                        />
                        :
                        <FastImage
                            style={styles.logo}
                            source={{
                                uri: imgLink,
                                priority: FastImage.priority.normal,
                            }}
                            onError={() => setErrorLoad(true)}
                        />
                    }
                    <Text style={[styles.dappName, { color: colors.common.text1, marginLeft: GRID_SIZE / 2 }]}>{data.dappName}</Text>
                </View>
            </AccountGradientBlock>
        </TouchableOpacity>
    )
}

export default DappListItem

const styles = StyleSheet.create({
    dappName: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 21
    },
    logo: {
        height: 30,
        width: 30,
        borderRadius: 15
    },
})
