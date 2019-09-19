import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native'

import QRCode from 'react-native-qrcode'

import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'
import ButtonLine from '../../components/elements/ButtonLine'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'

import Toast from '../../services/Toast/Toast'
import { strings } from '../../services/i18n'
import { copyToClipboard } from '../../services/utils'
import { showModal } from '../../appstores/Actions/ModalActions'
import api from '../../services/api'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import { set } from 'react-native-reanimated'
import Netinfo from '../../services/Netinfo/Netinfo'
import Log from '../../services/Log/Log'
import ExchangeActions from '../../appstores/Actions/ExchangeActions'
import { setExchangeType } from '../../appstores/Actions/ExchangeStorage'
import firebase from 'react-native-firebase'


class ReceiveScreen extends Component {

    constructor(){
        super()
        this.state = {}
    }

    copyToClip = () => {
        const { address } = this.props.account

        copyToClipboard(address)

        Toast.setMessage(strings('toast.copied')).show()
    }

    getAddressForQR = () => {
        const { address, currency_code } = this.props.account

        switch (currency_code) {
            case 'BTC':
                return 'bitcoin:' + address
            case 'ETH':
                return 'ethereum:' + address
            default:
                return address
        }

    }

    handleBuy = async () => {
        const { currencyCode, currencySymbol, network } = this.props.currency

        try {
            if(network === 'testnet' || network === 'ropsten'){
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.infoBuyModal.notAvailable'),
                })
                return
            }

            await Netinfo.isInternetReachable(-120)

            setLoaderStatus(true)

            const res = await api.getExchangeData()

            if(res.status === 'success'){
                const isExist = res.data.buy.supportedCrypto.find(item => item === currencyCode)

                if(typeof isExist != 'undefined'){
                    //TODO: refactor to one request

                    ExchangeActions.getExchangeStatusWithoutRequest(res, (res) => {
                        setExchangeType({ exchangeType: 'BUY' })
                        NavStore.goNext('MainDataScreen', {
                            currencyCode,
                            exchangeApiConfig: res
                        })
                    })

                } else {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: false,
                        title: strings('modal.exchange.sorry'),
                        description: strings('modal.infoBuyModal.currencyNotAvailable', { currencySymbol }),
                    })
                }
            } else {
                throw new Error(res)
            }

            setLoaderStatus(false)

        } catch (e) {
            Log.err('ReceiveScreen/handleBut error', e.message)
        }

        setLoaderStatus(false)
    }

    handleCustomReceiveAmount = () => {

        const { currencyCode, currencySymbol } = this.props.currency
        const { address } = this.props.account

        const ifExist = currencyCode === 'ETH' || currencyCode === 'BTC'

        if(ifExist){
            showModal({
                type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
                data: {
                    title: strings('account.receiveScreen.receiveAmount'),
                    address,
                    currencySymbol,
                    currencyCode
                }
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.settings.soon'),
                description: strings('modal.settings.soonDescription')
            })
        }
    }

    render(){

        const { address } = this.props.account
        const { currencyName, currencySymbol } = this.props.currency

        firebase.analytics().setCurrentScreen('Account.ReceiveScreen')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={ strings('account.receiveScreen.title', { receive: strings('repeat.receive') + ' ' + currencySymbol }) }
                />
                <View style={styles.wrapper__content}>
                    <TouchableOpacity onPress={() => this.copyToClip()}>
                        <QRCode
                            value={this.getAddressForQR()}
                            size={220}
                            bgColor='#5e2092'
                            fgColor='white'/>
                        <Text style={{
                            marginTop: 10,
                            color: '#999999',
                            fontSize: 14,
                            fontFamily: 'SFUIDisplay-Regular',
                            textAlign: 'center'
                        }}>{ strings('account.receiveScreen.clickToCopy') }</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        { strings('account.receiveScreen.description', { currency: currencyName }) }
                    </Text>
                    <TouchableOpacity onPress={this.copyToClip} style={{ position: 'relative' }}>
                        <Text style={styles.text}>
                            { address }
                        </Text>
                        <GradientView style={styles.line} array={lineStyles_.array} start={lineStyles_.start} end={lineStyles_.end} />
                    </TouchableOpacity>
                </View>
                <View style={styles.buttons}>
                    <View style={styles.btn}>
                        <ButtonLine press={this.handleBuy}
                                    styleText={{ fontSize: 15 }}
                                    innerStyle={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                            { strings('exchange.buy') }
                        </ButtonLine>
                    </View>
                    <View style={styles.btn}>
                        <Button press={this.handleCustomReceiveAmount}
                                styleText={{ fontSize: 15 }}
                                innerStyle={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                btnWrapStyle={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                           { strings('account.receiveScreen.receiveAmount') }
                        </Button>
                    </View>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        currency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReceiveScreen)

const lineStyles_ = {
    array: ["#7127ac","#864dd9"],
    arrayError: ['#e77ca3','#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles_ = {
    array: ["#fff","#F8FCFF"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    wrapper: {
        flex: 1,
    },
    wrapper__content: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingTop: 60,
        paddingLeft: 30,
        paddingRight: 30
    },
    title: {
        marginTop: 20,
        color: '#999999',
        fontSize: 22,
        fontFamily: 'SFUIDisplay-Regular'
    },
    text: {
        color: '#404040',
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold'
    },
    line: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2
    },
    buttons: {
        flexDirection: 'row',
        width: '100%',
        minHeight: 50,
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 30,

        backgroundColor: '#fff',

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.43,
        shadowRadius: 9.51,

        elevation: 10,
    },
    btn: {
        flex: 1,
        marginBottom: 20
    },
}
