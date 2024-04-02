/**
 * @version 0.77
 */
import React, { useEffect, useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { Camera, useCodeScanner, useCameraDevice } from 'react-native-vision-camera'

import NavStore from '@app/components/navigation/NavStore'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import { getQrCodeScannerConfig } from '@app/appstores/Stores/QRCodeScanner/selectors'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { openQrGallery } from '@app/services/UI/Qr/QrGallery'
import { finishProcess } from '@app/modules/QRCodeScanner/helpers'

const QRCodeScannerScreen = (props) => {
    const qrConfig = useSelector(getQrCodeScannerConfig)

    MarketingAnalytics.setCurrentScreen('QRCodeScannerScreen.index')

    const backCamera = useCameraDevice('back')

    const { width, height } = useWindowDimensions()

    const [barCodes, setBarCodes] = useState([])
    const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)

    useEffect(() => {
        const content = barCodes?.[0]
        if (!content?.value) return
        const finish = async () => {
            if (shouldFreezeCamera) return
            setShouldFreezeCamera(true)
            await onSuccess(content)
        }

        finish()
    }, [barCodes, shouldFreezeCamera])

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            runOnJS(setBarCodes)(codes)
        }
    })

    const onSuccess = useCallback(
        async (param) => {
            try {
                UpdateOneByOneDaemon.unpause()
                UpdateOneByOneDaemon.unstop()
                await finishProcess(param, qrConfig)
            } catch (e) {
                Log.log('QRCodeScanner.onSuccess error')
                showModal(
                    {
                        type: 'INFO_MODAL',
                        icon: 'INFO',
                        title: strings('modal.exchange.sorry'),
                        description: strings('tradeScreen.modalError.serviceUnavailable')
                    },
                    () => {
                        NavStore.goBack()
                    }
                )
            }
        },
        [qrConfig]
    )

    const handleOpenGallery = async () => {
        try {
            const res = await openQrGallery()
            if (res) {
                await onSuccess(res)
            }
        } catch (e) {
            let message = strings('tradeScreen.modalError.serviceUnavailable')
            let goBack = true
            if (e.message === 'NOT_FOUND') {
                message = strings('tradeScreen.modalError.qrNotFoundInFile')
                goBack = false
            } else {
                Log.log('QRCodeScanner.onOpenGallery error')
            }
            showModal(
                {
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: message
                },
                () => {
                    if (goBack) {
                        NavStore.goBack()
                    }
                }
            )
        }
    }

    if (!backCamera) {
        return (
            <ScreenWrapper
                leftType='back'
                leftAction={NavStore.goBack}
                rightType='gallery'
                rightAction={handleOpenGallery}
                title={strings('qrScanner.title')}
                withoutSafeArea
            />
        )
    }

    return (
        <ScreenWrapper
            leftType='back'
            leftAction={NavStore.goBack}
            rightType='gallery'
            rightAction={handleOpenGallery}
            title={strings('qrScanner.title')}
            withoutSafeArea>
            <View style={{ flexGrow: 1 }}>
                <Camera device={backCamera} codeScanner={codeScanner} isActive={!shouldFreezeCamera} style={StyleSheet.absoluteFill} />
                <View style={[styles.rectangleContainer, StyleSheet.absoluteFill, { flex: 1 }]}>
                    <View style={styles.topOverlay} />
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.leftAndRightOverlay} />
                        <View width={width * 0.65} height={width * 0.65} style={styles.rectangle}>
                            <View style={styles.rectangleTopLeft}>
                                <View style={styles.vertical} />
                                <View style={[styles.horizontal, styles.rectangleTopFix]} />
                            </View>
                            <View style={styles.rectangleTopRight}>
                                <View style={styles.vertical} />
                                <View style={[styles.horizontal, styles.rectangleTopFix]} />
                            </View>
                            <View style={styles.rectangleBottomLeft}>
                                <View style={[styles.horizontal, styles.rectangleBottomFix]} />
                                <View style={styles.vertical} />
                            </View>
                            <View style={styles.rectangleBottomRight}>
                                <View style={[styles.horizontal, styles.rectangleBottomFix]} />
                                <View style={styles.vertical} />
                            </View>
                        </View>
                        <View style={styles.leftAndRightOverlay} />
                    </View>
                    <View style={styles.bottomOverlay} />
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default QRCodeScannerScreen

const overlayColor = '#0000008A' // this gives us a black color with a 50% transparency

// const rectDimensions = windowWidth * 0.65 // this is equivalent to 255 from a 393 device width
const rectBorderWidth = 0 // this is equivalent to 2 from a 393 device width
const rectBorderColor = '#b995d8'

// const scanBarWidth = windowWidth * 0.65 // this is equivalent to 180 from a 393 device width
// const scanBarHeight = windowWidth * 0.0025 // this is equivalent to 1 from a 393 device width
// const scanBarColor = '#fff'

const styles = StyleSheet.create({
    rectangleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    rectangle: {
        position: 'relative',
        // height: rectDimensions,
        // width: rectDimensions,
        borderWidth: rectBorderWidth,
        borderColor: rectBorderColor,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
    },
    vertical: {
        width: 30,
        height: 7,
        borderRadius: 3,
        backgroundColor: '#fff'
    },
    horizontal: {
        height: 30,
        width: 7,
        borderRadius: 3,
        backgroundColor: '#fff'
    },
    rectangleTopLeft: {
        position: 'absolute',
        top: -5,
        left: -5
    },
    rectangleTopFix: {
        position: 'relative',
        top: -5
    },
    rectangleBottomFix: {
        position: 'relative',
        bottom: -5
    },
    rectangleTopRight: {
        alignItems: 'flex-end',
        position: 'absolute',
        top: -5,
        right: -6
    },
    rectangleBottomLeft: {
        position: 'absolute',
        bottom: -5,
        left: -5
    },
    rectangleBottomRight: {
        alignItems: 'flex-end',
        position: 'absolute',
        bottom: -3,
        right: -6
    },

    bottomOverlay: {
        flex: 1.5,
        width: '100%',
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: overlayColor,
        zIndex: -1
    },
    topOverlay: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        backgroundColor: overlayColor,
        zIndex: -1
    },

    leftAndRightOverlay: {
        flex: 1,
        height: '100%',
        backgroundColor: overlayColor
    }
})
