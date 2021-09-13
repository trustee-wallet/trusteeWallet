/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Dimensions
} from 'react-native'

import { strings } from '@app/services/i18n'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import { useTheme } from '@app/theme/ThemeProvider'
import Message from '@app/components/elements/new/Message'

const {width: WINDOW_WIDTH} = Dimensions.get('window')

const MnemonicQrCode = (props) => {

    const {
        walletMnemonic
    } = props

    const {
        GRID_SIZE
    } = useTheme()

    return(
        <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
            <Message
                name={'warningM'}
                text={strings('walletBackup.step0Screen.infoQR')}
            />
            <View style={styles.wrapperQR}>
                <View style={styles.qr}>
                    <QrCodeBox
                        value={walletMnemonic}
                        size={WINDOW_WIDTH * 0.5}
                        color='#404040'
                        backgroundColor='#F5F5F5'
                        logo={qrLogo}
                        logoSize={WINDOW_WIDTH * 0.175}
                        logoBackgroundColor='transparent'
                        onError={(e) => {
                            Log.err('MnemonicQrCode QRCode error ' + e.message)
                        }}
                    />
                </View>
            </View>
        </View>
    )
}

export default MnemonicQrCode

const styles = StyleSheet.create({
    wrapperQR: {
        alignItems: 'center',
        marginTop: WINDOW_WIDTH * 0.225
    },
    qr: {
        position: 'relative',
        backgroundColor: '#F5F5F5',
        width: WINDOW_WIDTH * 0.625,
        height: WINDOW_WIDTH * 0.625,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
    }
})
