/**
 * @version 0.77
 * @author Vadym
 */

import React, { useState } from 'react'
import { View, StyleSheet, Dimensions, Animated, LayoutAnimation, Text } from 'react-native'
import { BlurView } from "@react-native-community/blur";

import { strings } from '@app/services/i18n'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import { useTheme } from '@app/theme/ThemeProvider'
import Message from '@app/components/elements/new/Message'
import { TouchableOpacity } from 'react-native-gesture-handler'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const VISIBILITY_TIMEOUT = 4000

const MnemonicQrCode = (props) => {

    const CustomAnimationConfig = {
        duration: 250,
        create: {
            type: 'linear',
            property: 'opacity'
        },
        update: {
            type: 'linear',
        },
        delete: {
            type: 'linear',
            property: 'opacity'
        }
    }

    const {
        walletMnemonic
    } = props

    const [animationProgress, setAnimationProgress] = useState(new Animated.Value(0))
    const [visibilityTimer, setVisibilityTimer] = useState(null)
    const [show, setShow] = useState(false)

    const {
        GRID_SIZE,
        colors
    } = useTheme()

    const showQr = async () => {
        LayoutAnimation.configureNext(CustomAnimationConfig)
        setShow(true)
        setVisibilityTimer(true)
        setTimeout(() => {
            setShow(false)
            setVisibilityTimer(null)
            setAnimationProgress(new Animated.Value(0))
        }, VISIBILITY_TIMEOUT)
        Animated.timing(animationProgress, {
            toValue: 1,
            duration: VISIBILITY_TIMEOUT
        }).start(() => {
            Animated.timing(animationProgress, { toValue: 0, duration: 0 }).start()
        })
    }

    const triggerQrVisible = (visible) => {
        if (visibilityTimer) return
        setShow(visible)
    }

    return(
        <>
            <View style={{ paddingHorizontal: GRID_SIZE , paddingTop: GRID_SIZE * 1.5 }}>
                <Message
                    name='recoveryPhrase'
                    text={strings('walletBackup.step0Screen.infoQR')}
                    progress={animationProgress}
                    timer={visibilityTimer}
                />
                <TouchableOpacity 
                    style={styles.wrapperQR}
                    onLongPress={showQr}
                    onPressIn={() => triggerQrVisible(true)}
                    onPressOut={() => triggerQrVisible(false)}
                    delayLongPress={2000}
                    delayPressIn={100}
                    activeOpacity={1}
                >
                    <View style={[styles.qr, { marginVertical: GRID_SIZE }]}>
                        <QrCodeBox
                            value={walletMnemonic}
                            size={WINDOW_WIDTH * 0.5}
                            color='#404040'
                            backgroundColor='#F5F5F5'
                            logo={qrLogo}
                            logoSize={WINDOW_WIDTH * 0.175}
                            logoBackgroundColor='transparent'
                            onError={(e) => {
                                Log.log('MnemonicQrCode QRCode error')
                            }}
                        />
                        
                        {!show && 
                            <BlurView
                              style={styles.blur}
                              blurType="light"
                              blurAmount={6}
                              blurRadius={6}
                              overlayColor='transparent'
                            />
                        }
                        
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onLongPress={showQr}
                    onPressIn={() => triggerQrVisible(true)}
                    onPressOut={() => triggerQrVisible(false)}
                    delayLongPress={2000}
                    delayPressIn={100}
                    activeOpacity={0.9}
                >
                    <Text
                        style={[
                            styles.showMnemonicButton,
                            {
                                marginTop: GRID_SIZE * 2,
                                marginHorizontal: GRID_SIZE,
                                color: colors.createWalletScreen.showMnemonic.showButtonText,
                                opacity: show ? 0.5 : 1
                            }
                        ]}
                    >{strings('walletBackup.step0Screen.showQrButton')}</Text>
                </TouchableOpacity>
                    
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
    },
    showMnemonicButton: {
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 15,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
})
