/**
 * @version 0.30
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
    TouchableOpacity,
    StatusBar,
    Vibration,
    FlatList
} from 'react-native'
import { connect } from 'react-redux'
import _sortBy from 'lodash/sortBy'
import _orderBy from 'lodash/orderBy'
import _isEqual from 'lodash/isEqual'
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

import { setLoaderStatus, setSelectedAccount, setSelectedCryptoCurrency } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateCurrencyRateDaemon from '../../daemons/back/UpdateCurrencyRateDaemon'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '../../daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import DaemonCache from '../../daemons/DaemonCache'
import cryptoWalletActions from '../../appstores/Actions/CryptoWalletActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import { SIZE } from './helpers'
import { SendDeepLinking } from '../../appstores/Stores/Send/SendDeepLinking'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { SendActions } from '../../appstores/Stores/Send/SendActions'


import NavStore from '../../components/navigation/NavStore'
import checkTransferHasError from '../../services/UI/CheckTransferHasError/CheckTransferHasError'
import UpdateAppNewsDaemon from '../../daemons/back/UpdateAppNewsDaemon'
import UpdateAppNewsListDaemon from '../../daemons/view/UpdateAppNewsListDaemon'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

let CACHE_SET_WALLET_HASH = false


async function storeCurrenciesOrder(walletHash, data) {
    AsyncStorage.setItem(`${walletHash}:currenciesOrder`, JSON.stringify(data))
}

class HomeScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            isBalanceVisible: true,
            originalVisibility: true,
            originalData: [],
            data: [],
            currenciesOrder: [],
            isCurrentlyDraggable: false,
            scrollOffset: 0,
            hasStickyHeader: false,
            test: 0
        }
        this.getBalanceVisibility()
        this.getCurrenciesOrder()
        SendDeepLinking.init()
    }

    componentDidMount() {
        setLoaderStatus(false)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        let newState = null

        if (!_isEqual(nextProps.currencies, prevState.originalData)) {
            newState = {}
            const currenciesOrder = prevState.currenciesOrder
            const currenciesLength = nextProps.currencies.length
            const data = _orderBy(nextProps.currencies, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)
            newState.data = data
            newState.originalData = nextProps.currencies
            const newOrder = data.map(c => c.currencyCode)
            if (currenciesOrder.length && !_isEqual(currenciesOrder, newOrder)) {
                newState.currenciesOrder = newOrder
                storeCurrenciesOrder(nextProps.mainStore.selectedWallet.walletHash, newOrder)
            }
        }

        return newState
    }

    getBalanceVisibility = async () => {
        try {
            const res = await AsyncStorage.getItem('isBalanceVisible')
            const isBalanceVisible = res !== null ? JSON.parse(res) : true

            this.setState(() => ({ isBalanceVisible, originalVisibility: isBalanceVisible }))
        } catch (e) {
            Log.err(`HomeScreen getBalanceVisibility error ${e.message}`)
        }
    }

    getCurrenciesOrder = async () => {
        const { selectedWallet } = this.props.mainStore
        const walletToken = selectedWallet.walletHash || ''
        try {
            const res = await AsyncStorage.getItem(`${walletToken}:currenciesOrder`)
            const currenciesOrder = res !== null ? JSON.parse(res) : []
            const currenciesLength = this.state.data.length

            this.setState(state => ({
                currenciesOrder,
                data: _orderBy(state.data, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)
            }))
        } catch (e) {
            Log.err(`HomeScreen getCurrenciesOrder error ${e.message}`)
        }
    }

    handleRefresh = async () => {
        try {
            this.setState({ refreshing: true })

            try {
                await UpdateCurrencyRateDaemon.updateCurrencyRate({ force: true, source: 'HomeScreen.handleRefresh' })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateCurrencyRateDaemon ' + e.message)
            }

            try {
                await UpdateAppNewsDaemon.updateAppNewsDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
                await UpdateAppNewsListDaemon.updateAppNewsListDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAppNewsDaemon both fromServer and forView ' + e.message)
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

    // linked to stores
    handleHide = async (cryptoCurrency) => {
        await currencyActions.toggleCurrencyVisibility({
            currencyCode: cryptoCurrency.currencyCode,
            isHidden: 0
        })
        // this is for store reload
        await currencyActions.setCryptoCurrencies()
    }

    // separated from stores not to be updated from outside
    handleSend = async (cryptoCurrency) => {
        await SendActions.startSend({
            uiType: 'HOME_SCREEN',
            currencyCode: cryptoCurrency.currencyCode
        })
    }

    // linked to stores as rates / addresses could be changed outside
    handleReceive = async (cryptoCurrency, account) => {
        let status = ''
        try {
            if (typeof account !== 'undefined' && account) {
                status = 'checkTransferHasError started'
                await checkTransferHasError({
                    walletHash: account.walletHash,
                    currencyCode: cryptoCurrency.currencyCode,
                    currencySymbol: cryptoCurrency.currencySymbol,
                    addressFrom: account.address,
                    addressTo: account.address
                })
            }

            status = 'setSelectedCryptoCurrency started'

            await setSelectedCryptoCurrency(cryptoCurrency)

            status = 'setSelectedAccount started'

            await setSelectedAccount()

            NavStore.goNext('ReceiveScreen')
        } catch (e) {
            Log.err('HomeScreen.handleReceive error ' + status + ' ' + e.message, cryptoCurrency)
        }
    }

    // ????? @todo remove it or use in upper functions
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
        const newVisibilityValue = !this.state.isBalanceVisible
        await AsyncStorage.setItem('isBalanceVisible', JSON.stringify(newVisibilityValue))
        this.setState(() => ({ isBalanceVisible: newVisibilityValue, originalVisibility: newVisibilityValue }))
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    onDragBegin = () => {
        Vibration.vibrate(100)
        this.setState(() => ({ isCurrentlyDraggable: true }))
    }

    onDragEnd = ({ data }) => {
        const { selectedWallet } = this.props.mainStore
        const walletToken = selectedWallet.walletHash
        const currenciesOrder = data.map(c => c.currencyCode)
        storeCurrenciesOrder(walletToken, currenciesOrder)
        this.setState(() => ({ currenciesOrder, data, isCurrentlyDraggable: false }))
    }

    getBalanceData = () => {
        const { selectedBasicCurrency, selectedWallet } = this.props.mainStore
        let currencySymbol = selectedBasicCurrency.symbol
        if (!currencySymbol) {
            currencySymbol = selectedBasicCurrency.currencyCode
        }

        const CACHE_SUM = DaemonCache.getCache(selectedWallet.walletHash)

        let totalBalance = 0
        if (CACHE_SUM) {
            totalBalance = CACHE_SUM.balance
            if (currencySymbol !== CACHE_SUM.basicCurrencySymbol) {
                currencySymbol = CACHE_SUM.basicCurrencySymbol
            }
        }

        let tmp = totalBalance.toString().split('.')
        let beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
        let afterDecimal = ''
        if (typeof tmp[1] !== 'undefined') {
            afterDecimal = '.' + tmp[1].substr(0, 2)
        }

        return { currencySymbol, beforeDecimal, afterDecimal }
    }

    updateOffset = (offset) => {
        const newOffset = Math.round(offset)
        if (!this.state.hasStickyHeader && newOffset > 110) this.setState(() => ({ hasStickyHeader: true }))
        if (this.state.hasStickyHeader && newOffset < 110) this.setState(() => ({ hasStickyHeader: false }))
    }

    render() {
        const { colors, isLight } = this.context

        firebase.analytics().setCurrentScreen('WalletList.HomeScreen')

        let walletHash = this.props.mainStore.selectedWallet.walletHash
        if (!walletHash || typeof walletHash === 'undefined') {
            if (!CACHE_SET_WALLET_HASH) {
                CACHE_SET_WALLET_HASH = true
                walletHash = cryptoWalletActions.setFirstWallet()
                Log.log('HomeScreen empty wallet hash changed to ' + walletHash)
                cryptoWalletActions.setSelectedWallet(walletHash, 'WalletList.HomeScreen', false)
            }
        }
        const accountListByWallet = this.props.accountStore.accountList[walletHash] || {}
        const balanceData = this.getBalanceData()

        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.background }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.homeScreen.tabBarBackground }}>
                    <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                        <Header
                            scrollOffset={this.state.scrollOffset}
                            hasStickyHeader={this.state.hasStickyHeader}
                            isBalanceVisible={this.state.isBalanceVisible}
                            originalVisibility={this.state.originalVisibility}
                            triggerBalanceVisibility={this.triggerBalanceVisibility}
                            balanceData={balanceData}
                        />
                        <View style={{ marginBottom: Platform.OS === 'android' ? 65 : 50 }} />
                        <DraggableFlatList
                            data={this.state.data}
                            extraData={this.state.data}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 25 : 10 }}
                            onScrollOffsetChange={this.updateOffset}
                            autoscrollSpeed={300}
                            refreshControl={
                                <RefreshControl
                                    style={{ marginTop: 0 }}
                                    enabled={!this.state.isCurrentlyDraggable}
                                    tintColor={colors.common.text1}
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.handleRefresh}
                                />
                            }
                            ListHeaderComponent={(
                                <WalletInfo
                                    accountListByWallet={accountListByWallet}
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    originalVisibility={this.state.originalVisibility}
                                    changeBalanceVisibility={this.changeBalanceVisibility}
                                    triggerBalanceVisibility={this.triggerBalanceVisibility}
                                    balanceData={balanceData}
                                />
                            )}
                            renderItem={({ item, drag, isActive }) => (
                                <CryptoCurrency
                                    cryptoCurrency={item}
                                    accountListByWallet={accountListByWallet}
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    onDrag={drag}
                                    isActive={isActive}
                                    handleReceive={() => this.handleReceive(item, accountListByWallet[item.currencyCode])}
                                    handleSend={() => this.handleSend(item)}
                                    handleHide={() => this.handleHide(item)}
                                />
                            )}
                            keyExtractor={item => item.currencyCode}
                            activationDistance={15}
                            onDragEnd={this.onDragEnd}
                            onDragBegin={this.onDragBegin}
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
        currencies: state.currencyStore.cryptoCurrencies.filter(c => !c.isHidden),
        accountStore: state.accountStore
    }
}

HomeScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(HomeScreen)
