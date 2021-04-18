/**
 * @version 0.9
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, Dimensions, Text, StyleSheet } from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'



import NavStore from '@app/components/navigation/NavStore'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import _ from 'lodash'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import { decodeTransactionQrCode } from '@app/services/UI/Qr/QrScan'
import Log from '@app/services/Log/Log'
import { openQrGallery } from '@app/services/UI/Qr/QrGallery'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import lockScreenAction from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'

import Header from '@app/components/elements/new/Header'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { getQrCodeScannerConfig } from '@app/appstores/Stores/QRCodeScanner/selectors'
import store from '@app/store'


const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

console.disableYellowBox = true


class QRCodeScannerScreen extends React.PureComponent {

    componentDidMount() {
        this.scanner.reactivate()
    }

    async onSuccess(param) {
        UpdateOneByOneDaemon.unpause()
        try {
            const { currencyCode, type } = this.props.config

            if (type === 'CASHBACK_LINK' || (
                type === 'MAIN_SCANNER' &&
                (
                    param.data.indexOf('https://trusteeglobal.com/link/') === 0
                    || param.data.indexOf('https://trustee.deals/link/') === 0
                )
            )) {
                let link = param.data
                link = link.split('/')
                link = link[link.length - 1]
                await Log.log('QRCodeScanner.onSuccess ' + type + ' link ' + link + ' from ' + param.data)
                NavStore.goNext('CashbackScreen', {
                    qrData: {
                        isCashbackLink: true,
                        qrCashbackLink: link
                    }
                })
                return
            }


            const res = await decodeTransactionQrCode(param, currencyCode)

            if (typeof res.data.isWalletConnect !== 'undefined' && res.data.isWalletConnect) {
                if (this.props.lockScreenStatus * 1 > 0) {
                    lockScreenAction.setFlowType({
                        flowType: 'WALLET_CONNECT'
                    })
                    lockScreenAction.setBackData({
                        backData: { walletConnect: res.data.walletConnect }
                    })
                    NavStore.goNext('LockScreen')
                } else {
                    NavStore.goNext('WalletConnectScreen', { walletConnect: res.data.walletConnect })
                }
                return
            } else if (type === 'MAIN_SCANNER') {
                const { cryptoCurrencies } = store.getState().currencyStore.cryptoCurrencies

                let cryptoCurrency
                if (typeof res.data.currencyCode !== 'undefined' && res.data.currencyCode) {
                    try {
                        cryptoCurrency = _.find(cryptoCurrencies, { currencyCode: res.data.currencyCode })
                    } catch (e) {
                        e.message += ' on _.find by cryptoCurrencies '
                        throw e
                    }
                }

                if (res.status !== 'success') {
                    const tmp = res.data.parsedUrl || res.data.address
                    copyToClipboard(tmp)

                    showModal({
                        type: 'INFO_MODAL',
                        icon: true,
                        title: strings('modal.qrScanner.success.title'),
                        description: strings('modal.qrScanner.success.description') + ' ' + tmp
                    }, () => {
                        NavStore.goBack(null)
                    })
                    return
                }

                if (typeof cryptoCurrency === 'undefined') {
                    showModal({
                        type: 'YES_NO_MODAL',
                        icon: 'INFO',
                        title: strings('modal.exchange.sorry'),
                        description: strings('modal.tokenNotAdded.description'),
                        noCallback: () => {
                            this.setState({})
                            try {
                                this.scanner.reactivate()
                            } catch {
                            }
                        }
                    }, () => {
                        NavStore.goNext('AddAssetScreen')
                    })
                    return
                }

                if (+cryptoCurrency.isHidden) {
                    showModal({
                        type: 'YES_NO_MODAL',
                        icon: 'INFO',
                        title: strings('modal.exchange.sorry'),
                        description: strings('modal.tokenHidden.description'),
                        noCallback: () => {
                            this.setState({})
                            try {
                                this.scanner.reactivate()
                            } catch {
                            }
                        }
                    }, () => {
                        NavStore.goNext('AddAssetScreen')
                    })
                    return
                }

                const parsed = res.data
                parsed.currencyCode = cryptoCurrency.currencyCode
                await SendActionsStart.startFromQRCodeScanner(parsed, 'MAIN_SCANNER')
            } else if (type === 'ADD_CUSTOM_TOKEN_SCANNER') {
                NavStore.goNext('AddAssetScreen', {
                    tokenData: {
                        address: res.data.address || res.data.parsedUrl
                    }
                })
            } else if (type === 'SEND_SCANNER') {
                if (res.status === 'success' && typeof res.data.currencyCode !== 'undefined' && res.data.currencyCode && res.data.currencyCode !== currencyCode) {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: false,
                        title: strings('modal.qrScanner.error.title'),
                        description: strings('modal.qrScanner.error.description')
                    }, () => {
                        try {
                            this.scanner.reactivate()
                        } catch {
                        }
                    })
                } else {
                    let parsed
                    if (res.status === 'success' && res.data.currencyCode === currencyCode) {
                        parsed = res.data
                        parsed.currencyCode = currencyCode
                    } else {
                        parsed = {
                            address: res.data.parsedUrl
                        }
                    }
                    const newValue = {}
                    if (typeof parsed.address !== 'undefined') {
                        newValue.addressTo = parsed.address
                    }
                    if (typeof parsed.amount !== 'undefined' && parsed.amount && parsed.amount * 1 > 0) {
                        newValue.cryptoValue = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(parsed.amount)
                    }
                    if (typeof parsed.label !== 'undefined' && parsed.label && parsed.label !== '') {
                        newValue.memo = parsed.label
                    }
                    Log.log('QRCodeScanner.onSuccess from ' + type + ' parsed ' + JSON.stringify(parsed))
                    SendActionsUpdateValues.setStepOne(newValue)
                    NavStore.goNext('SendScreen')
                }
            }
        } catch (e) {
            Log.err('QRCodeScanner.onSuccess error ' + e.message)
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
                this.onSuccess(res)
            }
        } catch (e) {
            let message = strings('tradeScreen.modalError.serviceUnavailable')
            let goBack = true
            if (e.message === 'NOT_FOUND') {
                message = strings('tradeScreen.modalError.qrNotFoundInFile')
                goBack = false
            } else {
                Log.err('QRCodeScanner.onOpenGallery error ' + e.message)
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

    handleBack = () => {
        NavStore.goBack()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('QRCodeScannerScreen.index')
        const { colors } = this.context
        return (
            <View style={[styles.wrapper, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType='back'
                    leftAction={this.handleBack}
                    rightType='gallery'
                    rightAction={this.handleOpenGallery}
                    title={strings('qrScanner.title')}
                />
                <QRCodeScanner
                    ref={(node) => {
                        this.scanner = node
                    }}
                    showMarker
                    onRead={this.onSuccess.bind(this)}
                    cameraStyle={{ height: SCREEN_HEIGHT }}
                    topViewStyle={{ height: 0, flex: 0 }} bottomViewStyle={{ height: 0, flex: 0 }}
                    customMarker={
                        <View style={styles.rectangleContainer}>
                            <View style={styles.topOverlay}>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={styles.leftAndRightOverlay} />

                                <View style={styles.rectangle}>
                                    <View style={styles.rectangle__topLeft}>
                                        <View style={styles.vertical}></View>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__top_fix }}></View>
                                    </View>
                                    <View style={styles.rectangle__topRight}>
                                        <View style={styles.vertical}></View>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__top_fix }}></View>
                                    </View>
                                    <View style={styles.rectangle__bottomLeft}>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__bottom_fix }}></View>
                                        <View style={styles.vertical}></View>
                                    </View>
                                    <View style={styles.rectangle__bottomRight}>
                                        <View style={{ ...styles.horizontal, ...styles.rectangle__bottom_fix }}></View>
                                        <View style={styles.vertical}></View>
                                    </View>
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
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus : getLockScreenStatus(state),
        config: getQrCodeScannerConfig(state)
    }
}

QRCodeScannerScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(QRCodeScannerScreen)

const overlayColor = 'transparent' // this gives us a black color with a 50% transparency

const rectDimensions = SCREEN_WIDTH * 0.65 // this is equivalent to 255 from a 393 device width
const rectBorderWidth = 0 // this is equivalent to 2 from a 393 device width
const rectBorderColor = '#b995d8'

const scanBarWidth = SCREEN_WIDTH * 0.46 // this is equivalent to 180 from a 393 device width
const scanBarHeight = SCREEN_WIDTH * 0.0025 // this is equivalent to 1 from a 393 device width
const scanBarColor = '#22ff00'

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
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
        marginTop: 20,
        backgroundColor: overlayColor
    },

    leftAndRightOverlay: {
        flex: 1,
        height: '100%',
        backgroundColor: overlayColor
    },

    scanBar: {
        width: scanBarWidth,
        height: scanBarHeight,
        backgroundColor: scanBarColor
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
