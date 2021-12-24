/**
 * @version 0.43
 * @author Vadym
 */

import React, { useState } from 'react'
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    LayoutAnimation
} from 'react-native'
import { BlurView } from "@react-native-community/blur";

import { strings } from '@app/services/i18n'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import { useTheme } from '@app/theme/ThemeProvider'
import Message from '@app/components/elements/new/Message'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Button from '@app/components/elements/new/buttons/Button';

const {width: WINDOW_WIDTH} = Dimensions.get('window')

const VISIBILITY_TIMEOUT = 4000

const MnemonicQrCode = (props) => {

    const {
        walletMnemonic,
        withBlur
    } = props

    const [animationProgress, setAnimationProgress] = useState(new Animated.Value(0))
    const [show, setShow] = useState(withBlur)

    const {
        GRID_SIZE
    } = useTheme()

    const showQr = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setShow(true)
        setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
            setShow(false)
            setAnimationProgress(new Animated.Value(0))
        }, VISIBILITY_TIMEOUT)
        Animated.timing(animationProgress, {
            toValue: 1,
            duration: VISIBILITY_TIMEOUT
        }).start(() => {
            Animated.timing(animationProgress, { toValue: 0, duration: 0 }).start()
        })
    }

    return(
        <>
            <View style={{ paddingHorizontal: GRID_SIZE , paddingTop: GRID_SIZE * 1.5 }}>
                <Message
                    name='warningM'
                    text={strings('walletBackup.step0Screen.infoQR')}
                    progress={animationProgress}
                    timer={show}
                />
                <TouchableOpacity 
                    style={styles.wrapperQR}
                    onPress={showQr}
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
                        {!show ? 
                            <BlurView
                              style={styles.blur}
                              blurType="light"
                              blurAmount={10}
                              blurRadius={8}
                              overlayColor='transparent'
                            />
                            : null
                        }
                    </View>
                </TouchableOpacity>
                    
            </View>
            <View style={[styles.mainButton, { bottom: GRID_SIZE, paddingHorizontal: GRID_SIZE }]}>
                <Button
                    title={strings('walletBackup.step0Screen.show')}
                    onPress={showQr}
                />
            </View>
        </>
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
        height: WINDOW_WIDTH * 0.525
    },
    mainButton: {
        position: 'absolute',
        zIndex: 2,
        width: '100%'
    }
})
