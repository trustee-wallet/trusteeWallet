/**
 * @version 0.30
 */
import React from 'react'
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
    FlatList,
    StyleSheet
} from 'react-native'
import { connect } from 'react-redux'
import _sortBy from 'lodash/sortBy'
import _orderBy from 'lodash/orderBy'
import _isEqual from 'lodash/isEqual'
// import DraggableFlatList from 'react-native-draggable-flatlist'

import AsyncStorage from '@react-native-community/async-storage'

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

import { SendDeepLinking } from '../../appstores/Stores/Send/SendDeepLinking'
import { getVisibleCurrencies } from '../../appstores/Stores/Currency/selectors'
import { getIsBalanceVisible } from '../../appstores/Stores/Settings/selectors'


import NavStore from '../../components/navigation/NavStore'
import checkTransferHasError from '../../services/UI/CheckTransferHasError/CheckTransferHasError'
import UpdateAppNewsDaemon from '../../daemons/back/UpdateAppNewsDaemon'
import UpdateAppNewsListDaemon from '../../daemons/view/UpdateAppNewsListDaemon'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'
import AppLockBlur from "../../components/AppLockBlur";

import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import { SendStartActions } from '@app/appstores/Stores/Send/SendStartActions'

let CACHE_SET_WALLET_HASH = false


async function storeCurrenciesOrder(walletHash, data) {
    AsyncStorage.setItem(`${walletHash}:currenciesOrder`, JSON.stringify(data))
}

class HomeScreen extends React.Component {

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
            scrollOffset: 0,
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

            /*
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

            */

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
    handleSend = async (cryptoCurrency, account) => {
        await SendStartActions.startFromHomeScreen(cryptoCurrency, account)
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

        let tmp = totalBalance.toString().split('.')
        let beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
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
        if (this.state.enableVerticalScroll !== value) this.setState(() => ({ enableVerticalScroll: value }))
    };

    render() {
        if (this.props.mainStore.blurVisibility) {
            return  <AppLockBlur/>
        }
        const { colors, isLight } = this.context

        MarketingAnalytics.setCurrentScreen('WalletList.HomeScreen')

        let walletHash = this.props.mainStore.selectedWallet.walletHash
        if (!walletHash || typeof walletHash === 'undefined') {
            if (!CACHE_SET_WALLET_HASH) {
                CACHE_SET_WALLET_HASH = true
                walletHash = cryptoWalletActions.setFirstWallet()
                Log.log('HomeScreen empty wallet hash changed to ' + walletHash)
                cryptoWalletActions.setSelectedWallet(walletHash, 'WalletList.HomeScreen', false)
            }
        }
        const balanceData = this.getBalanceData()

        return (
            <View style={styles.container}>
                <Header
                    scrollOffset={this.state.scrollOffset}
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
                        {/* <DraggableFlatList
                            data={this.state.data}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            onScrollOffsetChange={this.updateOffset}
                            autoscrollSpeed={300}
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
                                />
                            )}
                            renderItem={({ item, drag, isActive }) => (
                                <CryptoCurrency
                                    cryptoCurrency={item}
                                    isBalanceVisible={this.state.isBalanceVisible}
                                    onDrag={drag}
                                    isActive={isActive}
                                    handleReceive={account => this.handleReceive(item, account)}
                                    handleSend={() => this.handleSend(item)}
                                    handleHide={() => this.handleHide(item)}
                                />
                            )}
                            keyExtractor={item => item.currencyCode}
                            activationDistance={15}
                            onDragEnd={this.onDragEnd}
                            onDragBegin={this.onDragBegin}
                        /> */}
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
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
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
