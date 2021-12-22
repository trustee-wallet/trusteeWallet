/**
 * @version 0.43
 * @author Vadym
 */

import React, { useState } from 'react'
import {
    View,
    StyleSheet,
    Dimensions
} from 'react-native'
import { BlurView } from "@react-native-community/blur";

import { strings } from '@app/services/i18n'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import { useTheme } from '@app/theme/ThemeProvider'
import Message from '@app/components/elements/new/Message'
import { TouchableOpacity } from 'react-native-gesture-handler';

const {width: WINDOW_WIDTH} = Dimensions.get('window')

const MnemonicQrCode = (props) => {

    const {
        walletMnemonic,
        withBlur
    } = props

    const [show, setShow] = useState(!withBlur)

    const {
        GRID_SIZE
    } = useTheme()

    const showQr = () => {
        setShow(!show)
    }

    return(
        <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
            <Message
                name={'warningM'}
                text={strings('walletBackup.step0Screen.infoQR')}
            />
            <TouchableOpacity 
                style={styles.wrapperQR}
                onPressIn={showQr}
                onPressOut={showQr}
                activeOpacity={1}
            >
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
                    {show && 
                        <BlurView
                          style={styles.blur}
                          blurType="light"
                          blurAmount={10}
                          blurRadius={8}
                          overlayColor='transparent'
                        />
                    }
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default MnemonicQrCode

const styles = StyleSheet.create({
    wrapperQR: {
        alignItems: 'center',
        marginTop: WINDOW_WIDTH * 0.225,
    },
    qr: {
        position: 'relative',
        backgroundColor: '#F5F5F5',
        padding: 20,
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
    },
    blur: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: WINDOW_WIDTH * 0.525,
        height: WINDOW_WIDTH * 0.525,
        
    }
})
