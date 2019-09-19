/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'

import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    Image,
    Platform
} from 'react-native'

import firebase from 'react-native-firebase'

import GradientView from '../../components/elements/GradientView'

import Currency from './elements/Currency'
import BottomNavigation from './elements/BottomNavigation'
import WalletInfo from './elements/WalletInfo'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import { strings } from '../../services/i18n'

import NavStore from '../../components/navigation/NavStore'

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window")

import updateCurrencyRateDaemon from '../../services/Daemon/classes/UpdateCurrencyRate'
import updateAccountBalanceDaemon from '../../services/Daemon/classes/UpdateAccountTransactions'
import SendActions from '../../appstores/Actions/SendActions'


class HomeScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false
        }
    }

    componentDidMount() {
        SendActions.handleInitialURL()
        // this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
        //     setTimeout(() => {
        //         setCurrencies()
        //     }, 10000)
        // })
    }

    onPress = () => {
        this.props.navigation.navigate('CryptoList')
    }

    handleRefresh = async () => {
        Log.log('WalletList.HomeScreen is refreshing')
        MarketingEvent.logEvent('home_refresh')

        this.setState({
            refreshing: true
        })

        await updateCurrencyRateDaemon.forceDaemonUpdate()
        await updateAccountBalanceDaemon.forceDaemonUpdate()

        this.setState({
            refreshing: false
        })
    }

    handleAddCoin = () => {
        NavStore.goNext('AddAssetScreen')
    }

    render() {
        firebase.analytics().setCurrentScreen('WalletList.HomeScreen')
        MarketingEvent.initMarketing()

        Log.log('WalletList.HomeScreen is rendered')

        const currencies = this.props.currencies

        return (
            <GradientView
                style={{ flex: 1 }}
                array={styles_.bg.array}
                start={styles_.bg.start}
                end={styles_.bg.end}>
                {
                    Platform.OS === 'ios' ?
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: WINDOW_HEIGHT,
                            backgroundColor: '#000',
                            zIndex: 1 }}>
                            <Image
                                style={styles.imgBackground}
                                resizeMode='stretch'
                                source={require('../../assets/images/walletCard2.png')}/>
                        </View> : null
                }

                <ScrollView
                    style={{ flex: 1, position: 'relative', marginBottom: -20, zIndex: 2 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            tintColor={'#f4f4f4'}
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                        />
                    }>
                    <WalletInfo/>
                    <View style={{ flex: 1,  backgroundColor: '#fff' }}>
                        <View style={styles.cryptoList}>
                            {
                                currencies.map((item, index) => {
                                    return !item.is_hidden ? <Currency key={index} currency={item}/> : null
                                })
                            }
                        </View>
                        <TouchableOpacity style={styles.topBlock__btn} onPress={this.handleAddCoin}>
                            <Text style={styles.topBlock__btn__text}>
                                { (strings('assets.mainTitle')).toUpperCase() }
                            </Text>
                            {/*<Image*/}
                            {/*    style={ styles.topBlock__btn_icon }*/}
                            {/*    resizeMode='stretch'*/}
                            {/*    source={require('../../assets/images/circles.png')}*/}
                            {/*/>*/}
                        </TouchableOpacity>
                    </View>
                    <View style={{
                        position: 'absolute',
                        bottom: -WINDOW_HEIGHT,
                        left: 0,
                        width: '100%',
                        height: WINDOW_HEIGHT,
                        backgroundColor: '#fff',
                        zIndex: 1 }} />
                </ScrollView>
                <BottomNavigation />
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        account: state.mainStore.selectedAccount,
        selectedWallet: state.mainStore.selectedWallet,
        currencies: state.mainStore.currencies
    }
}

export default connect(mapStateToProps, {})(HomeScreen)

const styles_ = {
    cryptoList__icoWrap_bitcoin: {
        array: ['#8879D9', '#E770B2'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_eth: {
        // array: ["#5b8df1","#a1bef7"],
        array: ['#145de3', '#4ec8f7'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__ico: {
        color: '#FBFFFF',
        size: 24
    },
    cryptoList__item: {
        array: ['#fff', '#fff'],
        start: { x: 0.0, y: 0.5 }
    },
    bg: {
        array: ['#fff', '#fff'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 0, y: 1 }
    }
}


const styles = StyleSheet.create({
    mainBg: {
        flex: 1
    },
    containerRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    container: {
        flex: 1
    },
    topBlock: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        marginBottom: 20,
        marginLeft: 60,
        marginRight: 25
    },
    topBlock__header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    topBlock__title: {
        color: '#404040',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 24
    },
    topBlock__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    topBlock__btn: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',

        // marginRight: 10,
        padding: 15,
    },
    topBlock__btn__text: {
        marginBottom: 50,
        color: '#864dd9',
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold'
    },
    topBlock__btn_icon: {
        width: 12,
        height: 12
    },
    title: {
        fontSize: 19
    },
    activeTitle: {
        color: 'red'
    },
    cryptoList: {
        flex: 1,
        marginTop: 20
    },
    cryptoList__item: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 74,
        marginBottom: 10,
        marginTop: 5,
        marginLeft: 20,
        marginRight: 20,
        paddingLeft: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    cryptoList__title: {
        color: '#404040',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    cryptoList__info: {
        width: 130
    },
    cryptoList__icoWrap: {
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 10
    },
    iconArrow: {
        marginBottom: 1,
        marginLeft: 4
    },
    imgBackground: {
        width: WINDOW_WIDTH+1,
        height: '100%',
    }
})
