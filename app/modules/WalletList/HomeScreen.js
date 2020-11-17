/**
 * @version 0.9
 */
import React, { Component } from 'react'
import {
    Text,
    SafeAreaView,
    View,
    Animated,
    ScrollView,
    RefreshControl,
    Platform,
    TouchableOpacity
} from 'react-native'
import { connect } from 'react-redux'
import _sortBy from 'lodash/sortBy'
import DraggableFlatList from 'react-native-draggable-flatlist'

import AsyncStorage from '@react-native-community/async-storage'

import firebase from 'react-native-firebase'

import GradientView from '../../components/elements/GradientView'
import CustomIcon from '../../components/elements/CustomIcon'

import CryptoCurrency from './elements/CryptoCurrency'
import BottomNavigation from './elements/BottomNavigation'
import WalletInfo from './elements/WalletInfo'
import Header from './elements/Header'

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

import { SIZE } from './helpers'


let styles

class HomeScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            isBalanceVisible: true,
            data: [],
            currenciesOrder: []
        }
        this.getBalanceVisibility();
        this.getCurrenciesOrder();
        styles = Theme.getStyles().homeScreenStyles
        SendActions.init()
    }

    componentDidMount() {
        setLoaderStatus(false)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        // console.log('getDerivedStateFromProps:', prevState.data)
        const currenciesOrder = prevState.currenciesOrder.length ? prevState.currenciesOrder : nextProps.cryptoCurrenciesStore.cryptoCurrencies.map(c => c.currencyCode);
        const data = _sortBy(nextProps.cryptoCurrenciesStore.cryptoCurrencies, c => currenciesOrder.indexOf(c.currencyCode))
        return {
            ...prevState,
            data,
            currenciesOrder
        };
    }

    getBalanceVisibility = async () => {
        try {
            const res = await AsyncStorage.getItem('isBalanceVisible')
            const isBalanceVisible = res !== null ? JSON.parse(res) : true

            this.setState(() => ({ isBalanceVisible }))
        } catch (e) {
            Log.err(`HomeScreen getBalanceVisibility error ${e.message}`)
        }
    }

    getCurrenciesOrder = async () => {
        try {
            const res = await AsyncStorage.getItem('currenciesOrder')
            const currenciesOrder = res !== null ? JSON.parse(res) : []

            this.setState(state => ({
                currenciesOrder,
                data: _sortBy(state.data, c => currenciesOrder.indexOf(c.currencyCode))
            }))
        } catch (e) {
            Log.err(`HomeScreen getCurrenciesOrder error ${e.message}`)
        }
    };

    handleRefresh = async () => {
        try {
            this.setState({ refreshing: true })

            try {
                await UpdateCurrencyRateDaemon.updateCurrencyRate({ force: true, source: 'HomeScreen.handleRefresh' })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateCurrencyRateDaemon ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountBalanceAndTransactionsDaemon ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({ force: true })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountBalanceAndTransactionsHDDaemon ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountListDaemon ' + e.message)
            }

            this.setState({ refreshing: false })
        } catch (e) {
            Log.err('WalletList.HomeScreen handleRefresh error ' + e.message)
        }
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

    changeBalanceVisibility = async () => {
        const newVisibilityValue = !this.state.isBalanceVisible;
        await AsyncStorage.setItem('isBalanceVisible', JSON.stringify(newVisibilityValue))
        this.setState(() => ({ isBalanceVisible: newVisibilityValue }));
    }

    onDragEnd = ({ data }) => {
        const currenciesOrder = data.map(c => c.currencyCode);
        AsyncStorage.setItem('currenciesOrder', JSON.stringify(currenciesOrder))
        this.setState(() => ({ currenciesOrder }))
    }

    render() {
        // console.log(new Date().toISOString() + ' render')

        firebase.analytics().setCurrentScreen('WalletList.HomeScreen')

        let walletHash = this.props.mainStore.selectedWallet.walletHash
        if (!walletHash || typeof walletHash === 'undefined') {
            walletHash = cryptoWalletActions.setFirstWallet()
            Log.log('HomeScreen empty wallet hash changed to ' + walletHash)
            cryptoWalletActions.setSelectedWallet(walletHash, 'WalletList.HomeScreen', false)
        }
        const accountListByWallet = this.props.accountStore.accountList[walletHash] || {}

        return (
            <View style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#f5f5f5' }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
                    <View style={{ flex: 1 }}>
                        {Platform.OS === 'android' && <View style={styles.statusBar__android} />}
                        <Header />
                        <DraggableFlatList
                            data={this.state.data}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            refreshControl={
                                <RefreshControl
                                    tintColor={'#404040'}
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.handleRefresh}
                                />
                            }
                            ListHeaderComponent={(
                                <WalletInfo
                                    accountListByWallet={accountListByWallet}
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    changeBalanceVisibility={this.changeBalanceVisibility}
                                />
                            )}
                            renderItem={({ item, drag, isActive }) => {
                                return !item.isHidden && (
                                    <CryptoCurrency
                                        cryptoCurrency={item}
                                        accountListByWallet={accountListByWallet}
                                        isBalanceVisible={this.state.isBalanceVisible}
                                        onDrag={drag}
                                        isActive={isActive}
                                    />
                                );
                            }}
                            keyExtractor={item => item.currencyCode}
                            activationDistance={15}
                            onDragEnd={this.onDragEnd}
                        />
                        <BottomNavigation />
                    </View>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        toolTipsStore: state.toolTipsStore,
        cryptoCurrenciesStore: state.currencyStore,
        accountStore: state.accountStore
    }
}

export default connect(mapStateToProps, {})(HomeScreen)


// const stl = {
//     left__btn: {
//         flexDirection: 'row',
//         width: '60%',
//         paddingRight: 30,
//         justifyContent: 'space-around',
//     },
//     right__btn: {
//         flexDirection: 'row-reverse',
//         width: '40%',
//         paddingRight: 30,
//         justifyContent: 'space-around',
//     }
// }
