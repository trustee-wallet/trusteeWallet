/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    View,
    StyleSheet
} from 'react-native'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'
import { useTheme } from '@app/theme/ThemeProvider'

const HeaderInfo = (props) => {

    const handleReceive = () => {
        NavStore.goNext('NftReceive')
    }

    const {
        GRID_SIZE
    } = useTheme()

    return (
        <View style={[styles.HeaderWrapper, { paddingBottom: GRID_SIZE }]}>
            <View style={{ flex: 1 }}>
                <NftTokenValue
                    walletCurrency='NFT'
                    balance
                    balanceData={props.usdTotalPretty}
                    currencySymbol='$'
                />
            </View>
            <View style={{ marginTop: GRID_SIZE / 2 }}>
                <BorderedButton
                    icon='plus'
                    text={strings('nftMainScreen.receive')}
                    onPress={handleReceive}
                />
            </View>
        </View>
    )
}

export default HeaderInfo

const styles = StyleSheet.create({
    HeaderWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
})
