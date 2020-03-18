import React, { Component } from "react"
import { connect } from 'react-redux'
import {
    View,
    Dimensions,
    Text,
    Clipboard
} from 'react-native'

import QRCodeScanner from "react-native-qrcode-scanner";

import Navigation from '../../components/navigation/Navigation';
import NavStore from '../../components/navigation/NavStore';

import { showModal } from "../../appstores/Actions/ModalActions";
import { strings } from '../../services/i18n';
import { setSendData } from "../../appstores/Actions/SendActions";
import _ from "lodash";
import { decodeTransactionQrCode } from '../../services/Qr/QrScan'
import accountDS from "../../appstores/DataSource/Account/Account";
import firebase from "react-native-firebase"

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

console.disableYellowBox = true;


class QRCodeScannerScreen extends Component {

    componentDidMount() {
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.setState({});
            this.scanner.reactivate();
        });
    }

    async onSuccess(param) {


        const {
            account: oldAccount,
            currency: oldCurrency,
            currencyCode,
            type
        } = this.props.qrCodeScanner.config;

        const res = await decodeTransactionQrCode(param, currencyCode);

        const { currencies, selectedWallet } = this.props.main;
        const currency = _.find(currencies, { currencyCode: res.data.currencyCode });
        const accounts = await accountDS.getAccountData({wallet_hash : selectedWallet.wallet_hash, currency_code : res.data.currencyCode});

        if(type === 'MAIN_SCANNER'){
            if(res.status === 'success'){
                setSendData({
                    disabled: false,
                    address: res.data.address,
                    value: res.data.amount.toString(),

                    account: accounts[0],
                    cryptocurrency: currency,

                    description: strings('send.description'),
                    useAllFunds: false
                });

                NavStore.goNext('SendScreen');
            } else {
                Clipboard.setString(res.data.parsedUrl);

                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.qrScanner.success.title'),
                    description: strings('modal.qrScanner.success.description')
                }, () => {
                    NavStore.goBack(null);
                });
            }
        } else if(type === 'SEND_SCANNER') {
            if (res.status == 'success' && res.data.currencyCode == currencyCode) {

                setSendData({
                    disabled: false,
                    address: res.data.address,
                    value: res.data.amount.toString(),

                    account: oldAccount,
                    cryptocurrency: oldCurrency,

                    description: strings('send.description'),
                    useAllFunds: false
                });

                NavStore.goNext('SendScreen');
            } else if (res.status == 'success' && res.data.currencyCode != currencyCode) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.qrScanner.error.title'),
                    description: strings('modal.qrScanner.error.description')
                }, () => {
                    this.scanner.reactivate();
                });
            } else {
                setSendData({
                    disabled: false,
                    address: res.data.parsedUrl,
                    value: '',

                    account: oldAccount,
                    cryptocurrency: oldCurrency,

                    description: strings('send.description'),
                    useAllFunds: false
                });

                NavStore.goNext('SendScreen');
            }
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('QRCodeScannerScreen.index')
        return (
            <View style={{flex: 1, backgroundColor: 'transparent'}}>
                <Navigation />
                <QRCodeScanner
                    ref={(node) => { this.scanner = node }}
                    showMarker
                    onRead={this.onSuccess.bind(this)}
                    cameraStyle={{ height: SCREEN_HEIGHT }}
                    customMarker={
                        <View style={styles.rectangleContainer}>
                            <View style={styles.topOverlay}>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <View style={styles.leftAndRightOverlay} />

                                <View style={styles.rectangle}>
                                    <View style={styles.rectangle__topLeft}>
                                        <View style={styles.vertical}></View>
                                        <View style={{...styles.horizontal, ...styles.rectangle__top_fix}}></View>
                                    </View>
                                    <View style={styles.rectangle__topRight}>
                                        <View style={styles.vertical}></View>
                                        <View style={{...styles.horizontal, ...styles.rectangle__top_fix}}></View>
                                    </View>
                                    <View style={styles.rectangle__bottomLeft}>
                                        <View style={{...styles.horizontal, ...styles.rectangle__bottom_fix}}></View>
                                        <View style={styles.vertical}></View>
                                    </View>
                                    <View style={styles.rectangle__bottomRight}>
                                        <View style={{...styles.horizontal, ...styles.rectangle__bottom_fix}}></View>
                                        <View style={styles.vertical}></View>
                                    </View>
                                </View>

                                <View style={styles.leftAndRightOverlay} />
                            </View>

                            <View style={styles.bottomOverlay}>
                                <Text style={styles.text}>
                                    { strings('qrScanner.line1') }
                                </Text>
                                <Text style={styles.text}>
                                    { strings('qrScanner.line2') }
                                </Text>
                            </View>
                        </View>
                    }
                />
            </View>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore,
        qrCodeScanner: state.qrCodeScannerStore,
        sendStore: state.sendStore
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(QRCodeScannerScreen);

const overlayColor = "transparent"; // this gives us a black color with a 50% transparency

const rectDimensions = SCREEN_WIDTH * 0.65; // this is equivalent to 255 from a 393 device width
const rectBorderWidth = 0; // this is equivalent to 2 from a 393 device width
const rectBorderColor = "#b995d8";

const scanBarWidth = SCREEN_WIDTH * 0.46; // this is equivalent to 180 from a 393 device width
const scanBarHeight = SCREEN_WIDTH * 0.0025; //this is equivalent to 1 from a 393 device width
const scanBarColor = "#22ff00";

const styles = {
    rectangleContainer: {
        flex: 1,
        width: '100%',
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent"
    },
    gradient: {
        flex: 1,
        width: '100%',
    },
    rectangle: {
        position: 'relative',
        height: rectDimensions,
        width: rectDimensions,
        borderWidth: rectBorderWidth,
        borderColor: rectBorderColor,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        zIndex: 1
    },
    vertical:{
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
        justifyContent: "center",
        alignItems: "center"
    },

    bottomOverlay: {
        flex: 1,
        width: '100%',
        marginTop: 20,
        backgroundColor: overlayColor,
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
};
