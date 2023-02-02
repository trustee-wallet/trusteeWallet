/**
 * @version 0.77
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Dimensions, Text, StyleSheet, Animated, Easing } from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'

import NavStore from '@app/components/navigation/NavStore'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'


import { ThemeContext } from '@app/theme/ThemeProvider'
import { getQrCodeScannerConfig } from '@app/appstores/Stores/QRCodeScanner/selectors'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { openQrGallery } from '@app/services/UI/Qr/QrGallery'
import { finishProcess } from '@app/modules/QRCodeScanner/helpers'


const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

let windowHeight, windowWidth
if (SCREEN_HEIGHT < SCREEN_WIDTH) {
    windowHeight = SCREEN_WIDTH
    windowWidth = SCREEN_HEIGHT
} else {
    windowHeight = SCREEN_HEIGHT
    windowWidth = SCREEN_WIDTH
}

console.disableYellowBox = true

class QRCodeScannerScreen extends PureComponent {

    constructor() {
        super()
        this.value = new Animated.Value(0)
        this.translateY = this.value.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [windowWidth * 0.32, windowWidth * -0.32, windowWidth * 0.32]
        })
    }

    componentDidMount() {
        this.scanner.reactivate()
    }

    async onSuccess(param) {
        try {
            UpdateOneByOneDaemon.unpause()
            UpdateOneByOneDaemon.unstop()
            await finishProcess(param, this.props.qrCodeScannerConfig)
        } catch (e) {
            Log.log('QRCodeScanner.onSuccess error')
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            }, () => {
                NavStore.goBack()
            })
        }
    }

    async handleOpenGallery() {
        try {
            const res = await openQrGallery()
            if (res) {
                await this.onSuccess(res)
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
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: message
            }, () => {
                if (goBack) {
                    NavStore.goBack()
                }
            })
        }
    }

    handleBack = async () => {
        NavStore.goBack()
    }

    makeSlideOutTranslation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(this.value, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                    easing: Easing.linear()
                }),
                Animated.timing(this.value, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                    easing: Easing.linear()
                })
            ])
        ).start()
    }

    render() {

        MarketingAnalytics.setCurrentScreen('QRCodeScannerScreen.index')
        this.makeSlideOutTranslation()
        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='gallery'
                rightAction={this.handleOpenGallery.bind(this)}
                title={strings('qrScanner.title')}
                withoutSafeArea={true}
            >
                <QRCodeScanner
                    ref={(node) => {
                        this.scanner = node
                    }}
                    showMarker
                    onRead={this.onSuccess.bind(this)}
                    cameraStyle={{ height: windowHeight, width: windowWidth }}
                    topViewStyle={{ height: 0, flex: 0 }}
                    bottomViewStyle={{ height: 0, flex: 0 }}
                    customMarker={
                        <View style={styles.rectangleContainer}>
                            <View style={styles.topOverlay} />
                            <View style={{ flexDirection: 'row' }}>
                                <View style={styles.leftAndRightOverlay} />

                                <View style={styles.rectangle}>
                                    <View style={styles.rectangle__topLeft}>
                                        <View style={styles.vertical} />
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__top_fix }} />
                                    </View>
                                    <View style={styles.rectangle__topRight}>
                                        <View style={styles.vertical} />
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__top_fix }} />
                                    </View>
                                    <View style={styles.rectangle__bottomLeft}>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__bottom_fix }} />
                                        <View style={styles.vertical} />
                                    </View>
                                    <View style={styles.rectangle__bottomRight}>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__bottom_fix }} />
                                        <View style={styles.vertical} />
                                    </View>
                                    <Animated.View
                                        style={{ ...styles.scanBar, transform: [{ translateY: this.translateY }] }}
                                    />
                                </View>

                                <View style={styles.leftAndRightOverlay} />
                            </View>

                            <View style={styles.bottomOverlay}>
                                <Text style={styles.text}>
                                    {strings('qrScanner.line1')}
                                </Text>
                                <Text style={styles.text}>
                                    {strings('qrScanner.line2')}
                                </Text>
                            </View>
                        </View>
                    }
                />
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        qrCodeScannerConfig: getQrCodeScannerConfig(state)
    }
}

QRCodeScannerScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(QRCodeScannerScreen)

const overlayColor = '#0000008A' // this gives us a black color with a 50% transparency

const rectDimensions = windowWidth * 0.65 // this is equivalent to 255 from a 393 device width
const rectBorderWidth = 0 // this is equivalent to 2 from a 393 device width
const rectBorderColor = '#b995d8'

const scanBarWidth = windowWidth * 0.65 // this is equivalent to 180 from a 393 device width
const scanBarHeight = windowWidth * 0.0025 // this is equivalent to 1 from a 393 device width
const scanBarColor = '#fff'

const styles = StyleSheet.create({
    rectangleContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    gradient: {
        flex: 1,
        width: '100%'
    },
    rectangle: {
        position: 'relative',
        height: rectDimensions,
        width: rectDimensions,
        borderWidth: rectBorderWidth,
        borderColor: rectBorderColor,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
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
    block__text: {
        flex: 1,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    rectangle__topLeft: {
        position: 'absolute',
        top: -5,
        left: -5
    },
    rectangle__top_fix: {
        position: 'relative',
        top: -5
    },
    rectangle__bottom_fix: {
        position: 'relative',
        bottom: -5
    },
    rectangle__topRight: {
        alignItems: 'flex-end',
        position: 'absolute',
        top: -5,
        right: -6
    },
    rectangle__bottomLeft: {
        position: 'absolute',
        bottom: -5,
        left: -5
    },
    rectangle__bottomRight: {
        alignItems: 'flex-end',
        position: 'absolute',
        bottom: -3,
        right: -6
    },
    topOverlay: {
        flex: 1,
        width: '100%',
        backgroundColor: overlayColor,
        justifyContent: 'center',
        alignItems: 'center'
    },

    bottomOverlay: {
        flex: 1,
        width: '100%',
        paddingTop: 20,
        backgroundColor: overlayColor,
        zIndex: -1
    },

    leftAndRightOverlay: {
        flex: 1,
        height: '100%',
        backgroundColor: overlayColor
    },

    scanBar: {
        width: scanBarWidth,
        height: scanBarHeight,
        backgroundColor: scanBarColor,
        opacity: 0.8,
    },
    text: {
        paddingLeft: 30,
        paddingRight: 30,
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e3e6e9'
    }
})
