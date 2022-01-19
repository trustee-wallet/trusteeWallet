/**
 * @version 0.54
 * @author Vadym
 */

import React from 'react'
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'

import AccountGradientBlock from '@app/components/elements/new/AccountGradientBlock'
import { useTheme } from '@app/theme/ThemeProvider'

const DappListItem = (props) => {

    const {
        colors,
        GRID_SIZE
    } = useTheme()

    const { data, last, onPress } = props

    return (
        <TouchableOpacity
            onPress={() => onPress(data)}
            style={{ marginBottom: last ? GRID_SIZE : -GRID_SIZE, marginHorizontal: GRID_SIZE }}
            activeOpacity={0.8}
        >
            <AccountGradientBlock>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        style={styles.logo}
                        source={{
                            uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/BMW_logo_%28gray%29.svg/2048px-BMW_logo_%28gray%29.svg.png'
                        }}
                    />
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
