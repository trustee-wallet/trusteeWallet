/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Text, SafeAreaView, View, Animated, ScrollView, RefreshControl, Platform } from 'react-native'
import { connect } from 'react-redux'

import firebase from 'react-native-firebase'

import GradientView from '../../components/elements/GradientView'

import CryptoCurrency from './elements/CryptoCurrency'
import BottomNavigation from './elements/BottomNavigation'
import WalletInfo from './elements/WalletInfo'

import Log from '../../services/Log/Log'
import { strings } from '../../services/i18n'

import updateCurrencyRateDaemon from '../../services/Daemon/elements/UpdateCurrencyRateDaemon'
import updateAccountBalanceAndTransactionsDaemon from '../../services/Daemon/elements/UpdateAccountBalanceAndTransactionsDaemon'
import updateAccountsDaemon from '../../services/Daemon/elements/UpdateAccountsDaemon'

import SendActions from '../../appstores/Stores/Send/SendActions'

import Theme from '../../themes/Themes'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'

let styles


class HomeScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            isHeaderTransparent: false,
            opacity: new Animated.Value(0)
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().homeScreenStyles

        SendActions.init()
    }

    async componentDidMount() {

        setLoaderStatus(false)
    }

    onPress = () => {
        this.props.navigation.navigate('CryptoList')
    }

    handleRefresh = async () => {
        try {
            this.setState({
                isHeaderTransparent: false
            })

            Log.log('WalletList.HomeScreen is refreshing')

            this.setState({
                refreshing: true
            })

            try {
                await updateCurrencyRateDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateCurrencyRateDaemon ' + e.message)
            }

            try {
                await updateAccountBalanceAndTransactionsDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountBalanceAndTransactionsDaemon ' + e.message)
            }

            try {
                await updateAccountsDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountsDaemon ' + e.message)
            }

            this.setState({
                refreshing: false
            })
        } catch (e) {
            Log.err('WalletList.HomeScreen handleRefresh error ' + e.message)
        }
    }

    renderHeaderTransparent = () => {
        return <View/>
    }

    onScroll = (event) => {
        const { isHeaderTransparent, opacity } = this.state

        let isHeaderTransparentTmp = false

        if (event.nativeEvent.contentOffset.y > 150) {

            Animated.timing(
                opacity, {
                    toValue: 1,
                    duration: 200
                }
            ).start()

            isHeaderTransparentTmp = true
        } else {
            Animated.timing(
                opacity, {
                    toValue: 0,
                    duration: 200
                }
            ).start()
        }

        if (isHeaderTransparent !== isHeaderTransparentTmp) {
            this.setState({
                isHeaderTransparent: isHeaderTransparentTmp
            })
        }
    }

    scrollToEnd = () => {
        this.refHomeScreenSV.scrollToEnd({ animated: true })
    }

    render() {
        firebase.analytics().setCurrentScreen('WalletList.HomeScreen')

        Log.log('WalletList.HomeScreen is rendered')

        const cryptoCurrencies = this.props.cryptoCurrencies

        return (
            <View style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#f5f5f5' }}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
                    <GradientView
                        style={{ flex: 1 }}
                        array={styles_.bg.array}
                        start={styles_.bg.start}
                        end={styles_.bg.end}>
                        {Platform.OS === 'android' ? <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 25, backgroundColor: '#f5f5f5', zIndex: 100 }}/> : null}
                        {this.renderHeaderTransparent()}
                        <ScrollView
                            ref={ref => this.refHomeScreenSV = ref}
                            style={{ flex: 1, position: 'relative', marginBottom: -20, zIndex: 2 }}
                            showsVerticalScrollIndicator={false}
                            onScrollBeginDrag={this.onScroll}
                            onScrollEndDrag={this.onScroll}
                            onMomentumScrollStart={this.onScroll}
                            onMomentumScrollEnd={this.onScroll}
                            refreshControl={
                                <RefreshControl
                                    tintColor={'#404040'}
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.handleRefresh}
                                />
                            }>
                            <WalletInfo/>

                            <View style={{ flex: 1, padding: 30, backgroundColor: '#f5f5f5' }}>
                                <Button press={() =>  NavStore.goNext('FIOScreen')}>
                                    go to FIO screen
                                </Button>
                            </View>

                            
                            <View style={{ flex: 1, paddingBottom: 30, backgroundColor: '#f5f5f5' }}>
                                    <Text style={{
                                        marginLeft: 31,
                                        fontFamily: 'Montserrat-Bold',
                                        color: '#404040',
                                        fontSize: 14
                                    }}>{strings('homeScreen.assets')}</Text>
                                <View style={styles.cryptoList}>
                                    {
                                        cryptoCurrencies.map((item, index) => {
                                            return !item.isHidden ? <CryptoCurrency key={index} cryptoCurrency={item}/> : null
                                        })
                                    }
                                </View>
                            </View>
                        </ScrollView>
                        <BottomNavigation/>
                    </GradientView>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        toolTipsStore: state.toolTipsStore,
        cryptoCurrencies: state.currencyStore.cryptoCurrencies
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
        array: ['#f5f5f5', '#f5f5f5'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 0, y: 1 }
    },
    bg_header: {
        array: ['#f2f2f2', '#f2f2f2'],
        start: { x: 0.0, y: 1 },
        end: { x: 1, y: 1 }
    }
}
