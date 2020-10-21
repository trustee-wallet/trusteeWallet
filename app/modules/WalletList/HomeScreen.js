/**
 * @version 0.9
 */
import React, { Component } from 'react'
import {Text, SafeAreaView, View, Animated, ScrollView, RefreshControl, Platform, TouchableOpacity} from 'react-native'
import { connect } from 'react-redux'

import firebase from 'react-native-firebase'

import GradientView from '../../components/elements/GradientView'

import CryptoCurrency from './elements/CryptoCurrency'
import BottomNavigation from './elements/BottomNavigation'
import WalletInfo from './elements/WalletInfo'

import Log from '../../services/Log/Log'
import { strings } from '../../services/i18n'

import SendActions from '../../appstores/Stores/Send/SendActions'

import Theme from '../../themes/Themes'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateCurrencyRateDaemon from '../../daemons/back/UpdateCurrencyRateDaemon'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '../../daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'
import cryptoWalletActions from '../../appstores/Actions/CryptoWalletActions'

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

            this.setState({
                refreshing: true
            })

            try {
                await UpdateCurrencyRateDaemon.updateCurrencyRate({force : true, source: 'HomeScreen.handleRefresh'})
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateCurrencyRateDaemon ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({force : true})
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountBalanceAndTransactionsDaemon ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({force : true})
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountBalanceAndTransactionsHDDaemon ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountListDaemon ' + e.message)
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

    // handleSend = () => {
    //     const cryptoCurrency = this.props.cryptoCurrenciesStore.cryptoCurrencies[0]
    //     const walletHash = this.props.mainStore.selectedWallet.walletHash
    //     const account = this.props.accountStore.accountList[walletHash][0]
    //     console.log(account)
    //
    //     const isSynchronized = currencyActions.checkIsCurrencySynchronized({ cryptoCurrency, account })
    //
    //     if (isSynchronized) {
    //
    //         clearSendData()
    //
    //         NavStore.goNext('SendScreen')
    //
    //     } else {
    //         showModal({
    //             type: 'INFO_MODAL',
    //             icon: 'INFO',
    //             title: strings('modal.cryptocurrencySynchronizing.title'),
    //             description: strings('modal.cryptocurrencySynchronizing.description')
    //         })
    //     }
    // }
    // винести методи в компоненту та передавати атрибути через пропси - і буде тобі щастя!!!
    // handleReceive = (cryptoCurrency, address) => {
    //     const cryptoCurrency = this.props.cryptoCurrency
    //     const { address } = this.props.account
    //     noinspection ES6MissingAwait
    //     checkTransferHasError({ currencyCode: cryptoCurrency.currencyCode, currencySymbol: cryptoCurrency.currencySymbol, address })
    //     NavStore.goNext('ReceiveScreen')
    // }

    // renderItem = ({item, index, drag, isActive}) => {
    //     const walletHash = this.props.mainStore.selectedWallet.walletHash
    //     const accountListByWallet = this.props.accountStore.accountList[walletHash] || {}
    //     return (
    //         !item.isHidden ? <CryptoCurrency key={index} cryptoCurrency={item}
    //                                          accountListByWallet={accountListByWallet}
    //                                          drag={drag}
    //                                          isActive={isActive}/> : <></>
    //                                          // /> : <></>
    //     )
    // }

    render() {
        // console.log(new Date().toISOString() + ' render')

        firebase.analytics().setCurrentScreen('WalletList.HomeScreen')

        const data = this.props.cryptoCurrenciesStore.cryptoCurrencies
        let walletHash = this.props.mainStore.selectedWallet.walletHash
        if (!walletHash || typeof walletHash === 'undefined') {
            walletHash = cryptoWalletActions.setFirstWallet()
            Log.log('HomeScreen empty wallet hash changed to ' + walletHash)
            cryptoWalletActions.setSelectedWallet(walletHash, 'WalletList.HomeScreen', false)
        }
        const accountListByWallet = this.props.accountStore.accountList[walletHash] || {}

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
                            <WalletInfo accountListByWallet={accountListByWallet}/>

                            <View style={{flex: 1, paddingBottom: 30, backgroundColor: '#f5f5f5'}}>
                                <Text style={{
                                    marginLeft: 31,
                                    fontFamily: 'Montserrat-Bold',
                                    color: '#404040',
                                    fontSize: 14
                                }}>{strings('homeScreen.assets')}</Text>
                                {/* <DraggableFlatList */}
                                {/*    // style={styles.cryptoList} */}
                                {/*    data={cryptoCurrencies} */}
                                {/*    renderItem={this.renderItem} */}
                                {/*    keyExtractor={(item, index) => `draggable-item-${item.accountId}`} */}
                                {/*    onDragEnd={({data}) => this.setState({...this.state, data})} */}
                                {/* /> */}
                                {/* <SwipeListView */}
                                {/*    style={styles.cryptoList} */}
                                {/*    data={cryptoCurrencies} */}
                                {/*    renderItem={({item, index}) => ( */}
                                {/*        !item.isHidden ? <CryptoCurrency key={index} cryptoCurrency={item} */}
                                {/*                                         accountListByWallet={accountListByWallet}/> : <></> */}
                                {/*    )} */}
                                {/*    renderHiddenItem={({item, index}) => ( */}
                                {/*        !item.isHidden ? <> */}
                                {/*            <View style={styles.cryptoList__item__hidden}> */}
                                {/*                <View style={stl.left__btn}> */}
                                {/*                    <TouchableOpacity> */}
                                {/*                        <CustomIcon style={{...styles.block__icon, marginBottom: 2}} */}
                                {/*                                    size={30} name='exchange'/> */}
                                {/*                    </TouchableOpacity> */}
                                {/*                    <TouchableOpacity> */}
                                {/*                        <CustomIcon style={{...styles.block__icon, marginBottom: 2}} */}
                                {/*                                    size={30} name='buy'/> */}
                                {/*                    </TouchableOpacity> */}
                                {/*                    <TouchableOpacity> */}
                                {/*                        <CustomIcon style={{...styles.block__icon, marginBottom: 2}} */}
                                {/*                                    size={30} name='sell'/> */}
                                {/*                    </TouchableOpacity> */}
                                {/*                </View> */}
                                {/*                <View style={stl.right__btn}> */}
                                {/*                    <TouchableOpacity onPress={this.handleReceive}> */}
                                {/*                        <CustomIcon style={{...styles.block__icon, marginBottom: 2}} */}
                                {/*                                    size={30} name='receive'/> */}
                                {/*                    </TouchableOpacity> */}
                                {/*                    <TouchableOpacity onPress={this.handleSend}> */}
                                {/*                        <CustomIcon style={{...styles.block__icon, marginBottom: 2}} */}
                                {/*                                    size={30} name='send'/> */}
                                {/*                    </TouchableOpacity> */}
                                {/*                </View> */}
                                {/*            </View> */}
                                {/*        </> : <></> */}
                                {/*    )} */}
                                {/*    leftOpenValue={200} */}
                                {/*    rightOpenValue={-150} */}
                                {/*    previewRowKey={'0'} */}
                                {/*    previewOpenValue={-40} */}
                                {/*    previewOpenDelay={3000} */}
                                {/* /> */}
                                <View style={styles.cryptoList}>
                                    {
                                        data.map((item, index) => {
                                            return !item.isHidden ? <CryptoCurrency key={index} cryptoCurrency={item} accountListByWallet={accountListByWallet}/> : null
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
        mainStore: state.mainStore,
        toolTipsStore: state.toolTipsStore,
        cryptoCurrenciesStore : state.currencyStore,
        accountStore : state.accountStore
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

const stl = {
    left__btn: {
        flexDirection: 'row',
        width: '60%',
        paddingRight: 30,
        justifyContent: 'space-around',
    },
    right__btn: {
        flexDirection: 'row-reverse',
        width: '40%',
        paddingRight: 30,
        justifyContent: 'space-around',
    }
}
