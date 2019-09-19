/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    Image,
    Animated, Dimensions
} from 'react-native'
import LottieView from 'lottie-react-native'

import ButtonIcon from '../../../components/elements/ButtonIcon'
import NavStore from '../../../components/navigation/NavStore'

import { setQRConfig, setQRValue } from '../../../appstores/Actions/QRCodeScannerActions'
import { strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'

const { width: WINDOW_WIDTH } = Dimensions.get("window")

class WalletInfo extends Component {

    constructor(props) {
        super(props)
        this.state = {
            totalBalance: '0.0',
            minus: 0,
            progress: new Animated.Value(0),
        }
    }

    async componentWillMount() {
        const { currencies } = this.props.main

        const tmpCurrencies = currencies.filter(item => item.is_hidden == 0 )

        const totalBalance = tmpCurrencies.reduce((sum, item) => sum + item.currencyBalanceAmount * item.currency_rate_usd, 0)

        this.setState({
            totalBalance
        })
    }

    componentWillReceiveProps(nextProps) {

        const { currencies } = nextProps.main

        const tmpCurrencies = currencies.filter(item => item.is_hidden == 0 )

        const totalBalance = tmpCurrencies.reduce((sum, item) => sum + item.currencyBalanceAmount * item.currency_rate_usd, 0)

        this.setState({
            totalBalance
        })

        this.handleStartAnimation(nextProps)
    }

    handleStartAnimation = (nextProps) => {

        const { updated: oldUpdate } = this.props.daemonStore.accountBalanceDaemonData

        const { updated: newUpdate } = nextProps.daemonStore.accountBalanceDaemonData

        if(oldUpdate && newUpdate > oldUpdate){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(this.state.progress, {
                        toValue: 1,
                        duration: 5000
                    }),
                    Animated.timing(this.state.progress, {
                        toValue: 0,
                        duration: 5000
                    })
                ]),
                {
                    iterations: 1
                }
            ).start()
        }

    }

    handleScanQr = () => {

        Log.log('WalletInfo handleScanQr started')

        setQRConfig({
            name: strings('components.elements.input.qrName'),
            successMessage: strings('components.elements.input.qrSuccess'),
            type: 'MAIN_SCANNER'
        })

        setQRValue('')

        NavStore.goNext('QRCodeScannerScreen')
    }



    render() {
        const { selectedWallet } = this.props.main
        const { localCurrencySymbol } = this.props.fiatRatesStore
        let { totalBalance } = this.state

        totalBalance = FiatRatesActions.toLocalCurrency(totalBalance)
        totalBalance = totalBalance.toString()

        return (
            <View style={styles.wrapper}>
                <View style={{ backgroundColor: '#fff' }}>
                    <View style={styles.imgBackgroundWrap}>
                        <Image
                            style={styles.imgBackground}
                            resizeMode='stretch'
                            source={require('../../../assets/images/walletCard2.png')}/>
                    </View>
                    <View style={styles.container}>

                        <View style={styles.top}>
                            <Text style={styles.walletInfo__title}>
                                { selectedWallet.wallet_name }
                            </Text>
                        </View>
                        <View style={{ ...styles.containerRow, alignItems: 'center', marginTop: -10, paddingRight: 5 }}>
                            <LottieView style={{
                                width: 80,
                                height: 80,
                                marginRight: 20
                            }} source={require('../../../assets/jsons/animations/dotsLeft.json')} progress={this.state.progress}/>

                            <View style={styles.walletInfo__content}>
                                <Text style={styles.walletInfo__text_small}>{ localCurrencySymbol } </Text>
                                <Text style={styles.walletInfo__text_middle}>{typeof totalBalance.split('.')[1] != 'undefined' ? totalBalance.split('.')[0] + '.' : totalBalance.split('.')[0]}</Text>
                                <Text style={styles.walletInfo__text_small}>{typeof totalBalance.split('.')[1] != 'undefined' ? totalBalance.split('.')[1].substr(0, 5) : ''}</Text>
                            </View>

                            <LottieView style={{
                                width: 80,
                                height: 80,
                                marginLeft: 10,
                                marginRight: 10
                            }} source={require('../../../assets/jsons/animations/dotsRight.json')} progress={this.state.progress}/>

                        </View>
                        {
                            /*
                                <View style={{...styles.containerRow, marginTop: -20}}>
                                    <Text style={styles.bottomText}>- $ { +this.state.minus } ({ ((this.state.minus * 100) / totalBalance).toFixed(3) }%)</Text>
                                    <View style={styles.iconArrow}>
                                        <Icon name="ios-arrow-round-down" size={18} color="#fc5088" />
                                    </View>
                                </View>
                            */
                        }
                        <View style={styles.btn}>
                            <ButtonIcon
                                icon="QR_CODE_BTN"
                                callback={() => this.handleScanQr()}/>
                        </View>
                    </View>
                </View>
                <View>

                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore,
        daemonStore: state.daemonStore,
        account: state.mainStore.selectedAccount,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)


const styles = {
    wrapper: {
        position: 'relative',
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 50,
        marginBottom: 6,
        paddingLeft: 17,
        paddingRight: 17
    },
    walletInfo__title: {
        marginTop: 7,
        color: '#f4f4f4',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold'
    },
    imgBackgroundWrap: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'

    },
    imgBackground: {
        width: WINDOW_WIDTH+1,
        height: 200,
        // marginTop: -90,
        backgroundColor: '#fff'
    },
    container: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 220,
        paddingTop: 30,
    },
    containerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    walletInfo__content: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: 45
    },
    walletInfo__text_small: {
        height: 22,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#f4f4f4',
        lineHeight: 25
    },
    walletInfo__text_middle: {
        height: 29,
        fontSize: 36,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#f4f4f4',
        lineHeight: 36
    },
    mainBg: {
        flex: 1
    },
    bottomText: {
        marginTop: -10,
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#f4f4f4'
    },
    iconArrow: {
        marginLeft: 4
    },
    btn: {
        position: 'absolute',
        left: WINDOW_WIDTH/2 - 23,
        bottom: 8
    }
}
