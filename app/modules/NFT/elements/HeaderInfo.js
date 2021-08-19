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
// import ButtonLine from '@app/components/elements/CurrencyIcon'


const HeaderInfo = () => {

    const handleReceive = () => {
        NavStore.goNext('NftReceive')
    }

    return(
        <View style={styles.HeaderWrapper}>
            {/* <ButtonLine currencyCode={'ETH'} /> */}
            <BorderedButton
                icon='plus'
                text={strings('nftMainScreen.receive')}
                onPress={handleReceive}
                containerStyles={styles.button}
            />

        </View>
    )
}

export default HeaderInfo

const styles = StyleSheet.create({
    HeaderWrapper: {

    },
    button: {
        width: '100%',
        justifyContent: 'flex-end'
    }
})
