/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Dimensions, Text, TouchableOpacity } from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'

import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../services/i18n'
import { setSendData } from '../../appstores/Stores/Send/SendActions'
import _ from 'lodash'

import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'
import { decodeTransactionQrCode } from '../../services/UI/Qr/QrScan'
import Log from '../../services/Log/Log'

import firebase from 'react-native-firebase'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { openQrGallery } from '../../services/UI/Qr/QrGallery'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

console.disableYellowBox = true


class QRCodeScannerScreen extends Component {

    componentDidMount() {
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.setState({})
            try {
                this.scanner.reactivate()
            } catch {
            }
        })
    }

    async onSuccess(param) {
        try {
            const {
                account: oldAccount,
                cryptoCurrency: oldCurrency,
                currencyCode,
                type,
                inputType
            } = this.props.qrCodeScanner.config

            if (type === 'CASHBACK_LINK') {
                setSendData({
                    isCashbackLink: true,
                    qrCashbackLink: param.data
                })
                NavStore.goNext('CashbackScreen')
                return
            }

            const res = await decodeTransactionQrCode(param, currencyCode)

            if (type === 'MAIN_SCANNER') {

                const { selectedWallet } = this.props.main
                const { cryptoCurrencies, accountStore } = this.props

                let cryptoCurrency
                if (typeof res.data.currencyCode !== 'undefined' && res.data.currencyCode) {
                    try {
                        cryptoCurrency = _.find(cryptoCurrencies, { currencyCode: res.data.currencyCode })
                    } catch (e) {
                        e.message += ' on _.find by cryptoCurrencies '
                        throw e
                    }
                }

                let account = JSON.parse(JSON.stringify(accountStore.accountList))
                account = account[selectedWallet.walletHash][res.data.currencyCode]

                if (res.status !== 'success') {
                    let tmp = res.data.parsedUrl || res.data.address
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

                setSendData({
                    disabled: typeof res.data.needToDisable !== 'undefined' && !!(+res.data.needToDisable),
                    address: res.data.address,
                    value: res.data.amount.toString(),

                    account: account,
                    cryptoCurrency: cryptoCurrency,

                    comment: res.data.label,
                    description: strings('send.description'),
                    useAllFunds: false,
                    type
                })

                NavStore.goNext('SendScreen')

            } else if (type === 'ADD_CUSTOM_TOKEN_SCANNER') {
                setSendData({
                    isToken: true,
                    address: res.data.address || res.data.parsedUrl
                })
                NavStore.goNext('AddCustomTokenScreen')
            } else if (type === 'SEND_SCANNER') {
                if (res.status === 'success' && res.data.currencyCode === currencyCode) {

                    setSendData({
                        disabled: typeof res.data.needToDisable !== 'undefined' && !!(+res.data.needToDisable),
                        address: res.data.address,
                        value: res.data.amount.toString(),

                        account: oldAccount,
                        cryptoCurrency: oldCurrency,
                        inputType,

                        comment: res.data.label,
                        description: strings('send.description'),
                        useAllFunds: false,
                        type
                    })

                    NavStore.goNext('SendScreen')
                } else if (res.status === 'success' && res.data.currencyCode !== currencyCode) {
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
                    setSendData({
                        disabled: false,
                        address: res.data.parsedUrl,
                        value: '',

                        account: oldAccount,
                        cryptoCurrency: oldCurrency,
                        inputType,

                        description: strings('send.description'),
                        useAllFunds: false,
                        type
                    })

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

    async onOpenGallery() {
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

    renderOpenGallery() {
        return (
            <TouchableOpacity onPress={this.onOpenGallery.bind(this)}>
                <View style={{ paddingLeft: 23, paddingRight:23 }} >
                    <MaterialCommunityIcons name="file-find" size={24} color="#855eab"/>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        UpdateOneByOneDaemon.pause()
        firebase.analytics().setCurrentScreen('QRCodeScannerScreen.index')
        return (
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Navigation
                    RightComponent={this.renderOpenGallery.bind(this)}
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
                                <View style={styles.leftAndRightOverlay}/>

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

                                <View style={styles.leftAndRightOverlay}/>
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
        main: state.mainStore,
        cryptoCurrencies: state.currencyStore.cryptoCurrencies,
        qrCodeScanner: state.qrCodeScannerStore,
        sendStore: state.sendStore,
        accountStore: state.accountStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QRCodeScannerScreen)

const overlayColor = 'transparent' // this gives us a black color with a 50% transparency

const rectDimensions = SCREEN_WIDTH * 0.65 // this is equivalent to 255 from a 393 device width
const rectBorderWidth = 0 // this is equivalent to 2 from a 393 device width
const rectBorderColor = '#b995d8'

const scanBarWidth = SCREEN_WIDTH * 0.46 // this is equivalent to 180 from a 393 device width
const scanBarHeight = SCREEN_WIDTH * 0.0025 // this is equivalent to 1 from a 393 device width
const scanBarColor = '#22ff00'

const styles = {
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
}
