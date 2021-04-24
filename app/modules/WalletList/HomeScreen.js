/**
 * @version 0.30
 */
import React from 'react'
import {
    SafeAreaView,
    View,
    RefreshControl,
    Vibration,
    FlatList,
    StyleSheet
} from 'react-native'
import { connect } from 'react-redux'
import _orderBy from 'lodash/orderBy'
import _isEqual from 'lodash/isEqual'

import AsyncStorage from '@react-native-community/async-storage'

import CryptoCurrency from './elements/CryptoCurrency'
import BottomNavigation from './elements/BottomNavigation'
import WalletInfo from './elements/WalletInfo'
import Header from './elements/Header'

import Log from '@app/services/Log/Log'

import UpdateCurrencyRateDaemon from '@app/daemons/back/UpdateCurrencyRateDaemon'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import DaemonCache from '@app/daemons/DaemonCache'
import cryptoWalletActions from '@app/appstores/Actions/CryptoWalletActions'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { SendDeepLinking } from '@app/appstores/Stores/Send/SendDeepLinking'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { setLoaderStatus, setSelectedAccount, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'


import NavStore from '@app/components/navigation/NavStore'
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'
import UpdateAppNewsDaemon from '@app/daemons/back/UpdateAppNewsDaemon'
import UpdateAppNewsListDaemon from '@app/daemons/view/UpdateAppNewsListDaemon'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import AppLockBlur from '@app/components/AppLockBlur'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { getIsBlurVisible } from '@app/appstores/Stores/Main/selectors'


let CACHE_SET_WALLET_HASH = false
let CACHE_IS_SCANNING = false

async function storeCurrenciesOrder(walletHash, data) {
    AsyncStorage.setItem(`${walletHash}:currenciesOrder`, JSON.stringify(data))
}

class HomeScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            isBalanceVisible: true,
            originalVisibility: false,
            originalData: [],
            data: [],
            currenciesOrder: [],
            isCurrentlyDraggable: false,
            hasStickyHeader: false,
            enableVerticalScroll: true
        }
        this.getCurrenciesOrder()
        SendDeepLinking.initDeepLinking()
    }

    componentDidMount() {
        setLoaderStatus(false)
        this.getBalanceVisibility()

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

    getBalanceVisibility = () => {
        const isBalanceVisible = this.props.isBalanceVisible
        this.setState(() => ({ isBalanceVisible, originalVisibility: isBalanceVisible }))
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
                await UpdateAccountListDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountListDaemon ' + e.message)
            }

            this.setState({ refreshing: false })
        } catch (e) {
            Log.err('WalletList.HomeScreen handleRefresh error ' + e.message)
        }

        this.handleLateRefresh()
    }

    handleLateRefresh = async () => {
        if (CACHE_IS_SCANNING) return false
        CACHE_IS_SCANNING = true
        try {

            try {
                await UpdateAppNewsDaemon.updateAppNewsDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
                await UpdateAppNewsListDaemon.updateAppNewsListDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAppNewsDaemon both fromServer and forView ' + e.message)
            }


            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountBalanceAndTransactionsDaemon ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({ force: true })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountBalanceAndTransactionsHDDaemon ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountListDaemon ' + e.message)
            }
        } catch (e) {
            Log.err('WalletList.HomeScreen handleLateRefresh error ' + e.message)
        }
        CACHE_IS_SCANNING = false
    }

    // linked to stores
    handleHide = async (cryptoCurrency) => {
        MarketingEvent.logEvent('gx_currency_hide', { currencyCode: cryptoCurrency.currencyCode , source : 'HomeScreen'}, 'GX')
        await currencyActions.toggleCurrencyVisibility({
            currencyCode: cryptoCurrency.currencyCode,
            newIsHidden: 1,
            currentIsHidden : cryptoCurrency.isHidden
        })
    }

    // separated from stores not to be updated from outside
    handleSend = async (cryptoCurrency, account) => {
        await SendActionsStart.startFromHomeScreen(cryptoCurrency, account)
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

            NavStore.goNext('AccountReceiveScreen')
        } catch (e) {
            Log.err('HomeScreen.handleReceive error ' + status + ' ' + e.message, cryptoCurrency)
        }
    }

    changeBalanceVisibility = async () => {
        const newVisibilityValue = !this.state.isBalanceVisible
        await AsyncStorage.setItem('isBalanceVisible', JSON.stringify(newVisibilityValue))
        await settingsActions.getSettings()
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

        const tmp = totalBalance.toString().split('.')
        const beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
        let afterDecimal = ''
        if (typeof tmp[1] !== 'undefined') {
            afterDecimal = '.' + tmp[1].substr(0, 2)
        }

        return { currencySymbol, beforeDecimal, afterDecimal }
    }

    updateOffset = (offset) => {
        // const newOffset = Math.round(offset)
        const newOffset = Math.round(offset.nativeEvent.contentOffset.y)
        if (!this.state.hasStickyHeader && newOffset > 110) this.setState(() => ({ hasStickyHeader: true }))
        if (this.state.hasStickyHeader && newOffset < 110) this.setState(() => ({ hasStickyHeader: false }))
    }

    setScrollEnabled = (value) => {
        if (this._listRef && this._listRef.setNativeProps) {
            this._listRef.setNativeProps({ scrollEnabled: value });
        } else if (this._listRef && this._listRef.getScrollResponder) {
            const scrollResponder = this._listView.getScrollResponder();
            if (scrollResponder.setNativeProps) scrollResponder.setNativeProps({ scrollEnabled: value });
        } else {
            this.setState(() => ({ enableVerticalScroll: value }))
        }
    };

    render() {
        if (this.props.isBlurVisible) {
            return  <AppLockBlur/>
        }
        const { colors } = this.context

        MarketingAnalytics.setCurrentScreen('WalletList.HomeScreen')

        let {walletHash, walletNumber} = this.props.mainStore.selectedWallet
        if (!walletHash || typeof walletHash === 'undefined') {
            if (!CACHE_SET_WALLET_HASH) {
                CACHE_SET_WALLET_HASH = true
                walletHash = cryptoWalletActions.setFirstWallet()
                Log.log('HomeScreen empty wallet hash changed to ' + walletHash)
                cryptoWalletActions.setSelectedWalletFromHome(walletHash, 'WalletList.HomeScreen', false)
            }
        }
        const balanceData = this.getBalanceData()

        return (
            <View style={styles.container}>
                <Header
                    hasStickyHeader={this.state.hasStickyHeader}
                    isBalanceVisible={this.state.isBalanceVisible}
                    originalVisibility={this.state.originalVisibility}
                    triggerBalanceVisibility={this.triggerBalanceVisibility}
                    balanceData={balanceData}
                />
                <SafeAreaView style={[styles.safeAreaContent, { backgroundColor: colors.homeScreen.tabBarBackground }]}>
                    <View style={[styles.content, { backgroundColor: colors.common.background }]}>
                        <View style={styles.stub} />
                        <FlatList
                            ref={ref => { this._listRef = ref; }}
                            data={this.state.data}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            onScroll={this.updateOffset}
                            scrollEnabled={this.state.enableVerticalScroll}
                            refreshControl={
                                <RefreshControl
                                    style={styles.refreshControl}
                                    enabled={!this.state.isCurrentlyDraggable}
                                    tintColor={colors.common.text1}
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.handleRefresh}
                                />
                            }
                            ListHeaderComponent={(
                                <WalletInfo
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    originalVisibility={this.state.originalVisibility}
                                    changeBalanceVisibility={this.changeBalanceVisibility}
                                    triggerBalanceVisibility={this.triggerBalanceVisibility}
                                    balanceData={balanceData}
                                    walletNumber={walletNumber}
                                />
                            )}
                            renderItem={({ item, drag, isActive }) => (
                                <CryptoCurrency
                                    cryptoCurrency={item}
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    onDrag={drag}
                                    isActive={isActive}
                                    handleReceive={account => this.handleReceive(item, account)}
                                    handleSend={account => this.handleSend(item, account)}
                                    handleHide={() => this.handleHide(item)}
                                    setScrollEnabled={this.setScrollEnabled}
                                />
                            )}
                            keyExtractor={item => item.currencyCode}
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
        isBlurVisible: getIsBlurVisible(state),
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore)
    }
}

HomeScreen.contextType = ThemeContext

export default connect(mapStateToProps)(HomeScreen)


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeAreaContent: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    stub: {
        marginBottom: 50
    },
    list: {
        paddingBottom: 20,
        paddingTop: 10
    },
    refreshControl: {
        marginTop: 0
    }
})
