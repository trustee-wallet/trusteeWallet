/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Linking, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'

import LottieView from 'lottie-react-native'

import Ionicons from 'react-native-vector-icons/Ionicons'

import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'
import ToolTips from '../../components/elements/ToolTips'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LetterSpacing from '../../components/elements/LetterSpacing'
import Loader from '../../components/elements/LoaderItem'
import IconAwesome from 'react-native-vector-icons/FontAwesome'

import Transaction from './elements/Transaction'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'
import { SendActions } from '../../appstores/Stores/Send/SendActions'

import Log from '../../services/Log/Log'
import checkTransferHasError from '../../services/UI/CheckTransferHasError/CheckTransferHasError'

import MarketingEvent from '../../services/Marketing/MarketingEvent'

import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'

import { strings } from '../../services/i18n'

import { HIT_SLOP } from '../../themes/Themes'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import CustomIcon from '../../components/elements/CustomIcon'
import AsyncStorage from '@react-native-community/async-storage'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'
import { getAccountFioName } from '../../../crypto/blockchains/fio/FioUtils'
import config from '../../config/config'
import DaemonCache from '../../daemons/DaemonCache'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'

import Header from '../../modules/Send/elements/Header'
import HeaderBlocks from './elements/HeaderBlocks'
import AccountButtons from './elements/accountButtons'

import transactionDS from '../../appstores/DataSource/Transaction/Transaction'
import transactionActions from '../../appstores/Actions/TransactionActions'
import BalanceHeader from './elements/AccountData'

import blackLoader from '../../assets/jsons/animations/refreshBlack.json'
import whiteLoader from '../../assets/jsons/animations/refreshWhite.json'
import UpdateAccountBalanceAndTransactionsHD from '../../daemons/back/UpdateAccountBalanceAndTransactionsHD'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'
import AppLockBlur from "../../components/AppLockBlur";

import Netinfo from '../../services/Netinfo/Netinfo'

import { diffTimeScan } from './helpers'

let CACHE_ASKED = false

class Account extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            clickRefresh: false,

            amountToView: 5,
            transactionsToView: [],
            transactionsShownLength: 5,

            show: true,
            mode: 'TRANSACTIONS',
            dash: true,

            fioMemo: {},
            scrollOffset: 0,
            isBalanceVisible: false,
            originalVisibility: false,

            headerHeight: 0
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            this.transactionInfinity()
        })

        CACHE_ASKED = await AsyncStorage.getItem('asked')

        //this.transactionInfinity()
        //this.ordersWithoutTransactions()
    }

    async componentDidMount() {
        this.getBalanceVisibility()
        const { currencyCode } = this.props.cryptoCurrency
        if (currencyCode === 'FIO') {
            const fioAccount = await getAccountFioName()
            if (!fioAccount) {
                showModal({
                    type: 'YES_NO_MODAL',
                    title: strings('account.fioAccount.title'),
                    icon: 'INFO',
                    description: strings('account.fioAccount.description')
                }, this.handleRegisterFIOAddress)
            }
        }
        //this.transactionInfinity()
        //this.ordersWithoutTransactions()
    }

    getBalanceVisibility = () => {
        const isBalanceVisible = this.props.settingsStore.data.isBalanceVisible
        this.setState(() => ({ isBalanceVisible, originalVisibility: isBalanceVisible }))
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    updateOffset = (offset) => {
        const newOffset = Math.round(offset)
        if (this.state.scrollOffset !== newOffset) this.setState(() => ({ scrollOffset: newOffset }))
    }

    handleRegisterFIOAddress = async () => {
        const { address } = this.props.account
        const { apiEndpoints } = config.fio
        NavStore.goNext('WebViewScreen', { url: `${apiEndpoints.registrationSiteURL}${address}`, title: strings('fioMainSettings.registerFioAddress') })
    }

    handleReceive = () => {
        const { cryptoCurrency, account } = this.props
        checkTransferHasError({
            walletHash: account.walletHash,
            currencyCode: cryptoCurrency.currencyCode,
            currencySymbol: cryptoCurrency.currencySymbol,
            addressFrom: account.address,
            addressTo: account.address
        })
        NavStore.goNext('ReceiveScreen')
    }

    handleSend = async () => {
        const { cryptoCurrency, account } = this.props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ cryptoCurrency, account })

        if (isSynchronized) {

            await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType: 'ACCOUNT_SCREEN'
                }
            })
            await SendActions.startSend({
                currencyCode : account.currencyCode,
            })

        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.cryptocurrencySynchronizing.title'),
                description: strings('modal.cryptocurrencySynchronizing.description')
            })
        }
    }

    handleBuy = async () => {
        try {
            await Netinfo.isInternetReachable()

            NavStore.goNext('MarketScreen')

        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            }
        }
    }

    _showModalNoOldConfigs = async () => {
        if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
            setLoaderStatus(true)
            await ExchangeActions.init()
            setLoaderStatus(false)
        }
        if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            })
        }
    }

    handleRefresh = async (click= false) => {
        const { account, mainStore } = this.props

        this.setState({
            refreshing: !click,
            clickRefresh: click,
        })

        UpdateOneByOneDaemon._canUpdate = false

        try {
            await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true, source: 'ACCOUNT_REFRESH' })
        } catch (e) {
            Log.errDaemon('AccountScreen handleRefresh error updateTradeOrdersDaemon ' + e.message)
        }

        try {
            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({
                force: true,
                currencyCode: account.currencyCode,
                source: 'ACCOUNT_REFRESH'
            })
            if (mainStore.selectedWallet.walletIsHd === 1) {
                await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({
                    force: true,
                    currencyCode: account.currencyCode,
                    source: 'ACCOUNT_REFRESH'
                })
            }
        } catch (e) {
            Log.errDaemon('AccountScreen handleRefresh error updateAccountBalanceAndTransactions ' + e.message)
        }

        try {
            await UpdateAccountListDaemon.updateAccountListDaemon({
                force: true,
                currencyCode: account.currencyCode,
                source: 'ACCOUNT_REFRESH'
            })
        } catch (e) {
            Log.errDaemon('AccountScreen handleRefresh error updateAccountListDaemon ' + e.message)
        }

        await setSelectedAccount()

        UpdateOneByOneDaemon._canUpdate = true

        this.transactionInfinity(0, this.state.transactionsShownLength)

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    renderSynchronized = (cryptoCurrency, account, allTransactionsToView) => {

        // const { cryptoCurrency, account, allTransactionsToView } = props

        let { transactionsToView } = this.state
        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = account.transactionsToView
        }

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        const { colors, GRID_SIZE, isLight } = this.context


        const diff = diffTimeScan(this.props.account.balanceScanTime)
        let diffTimeText = ''
        if (diff > 60) {
           diffTimeText =  strings('account.soLong')
        } else {
            if (diff < 1) {
                diffTimeText = strings('account.justScan')
            } else {
                diffTimeText = strings('account.scan', { time: diff })
            }
            if (this.props.account.balanceScanError && this.props.account.balanceScanError !== '' && this.props.account.balanceScanError!=='null') {
                diffTimeText += '\n' + strings(this.props.account.balanceScanError)
            }
        }

        return (
            <View style={{ flexDirection: 'column', marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }}>
                <View style={{ marginTop: 24, flexDirection: 'row', position: 'relative', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'column' }} >
                        <Text style={{...styles.transaction_title, color: colors.common.text1}}>{strings('account.history')}</Text>
                        <View style={{...styles.scan, marginLeft: 16 }}>
                            {isSynchronized ?
                                <Text style={{ ...styles.scan__text, color: colors.common.text2 }} numberOfLines={2} >{diffTimeText}</Text>
                                :
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginRight: 10,
                                    marginTop: 2
                                }}><Text style={{
                                    ...styles.transaction__empty_text, ...{
                                        marginLeft: 0,
                                        marginRight: 10,
                                        marginTop: 0,
                                        color: colors.common.text1
                                    }
                                }}>{strings('homeScreen.synchronizing')}</Text>
                                    <Loader size={14} color={'#999999'} />
                                </View>
                            }
                        </View>
                    </View>
                    <TouchableOpacity style={{ ...styles.scan, alignItems: 'center', marginRight: GRID_SIZE}} onPress={() => this.handleRefresh(true)} hitSlop={HIT_SLOP} >
                            {this.state.clickRefresh ?
                                <LottieView style={{ width: 20, height: 20, }}
                                source={isLight ? blackLoader : whiteLoader}
                                autoPlay loop /> :
                            <CustomIcon name={'reloadTx'} size={20} color={colors.common.text1} /> }
                        </TouchableOpacity>
                </View>
                {
                    // account.transactionsTotalLength === 0 && (!transactionsToView || transactionsToView.length === 0) ? //@ksu fail order not working
                    allTransactionsToView.length === 0 && (!transactionsToView || transactionsToView.length === 0) ?
                        <View style={{ marginRight: GRID_SIZE }} >
                            {isSynchronized && <Text
                                style={{...styles.transaction__empty_text, marginTop: GRID_SIZE, color: colors.common.text3}}>
                                {strings('account.noTransactions')}
                            </Text>}
                        </View>
                        : null
                }
            </View>
        )

    }

    renderDash = () => {
        this.setState({ dash: this.state.dash })
    }

    renderAddressTooltip = (props) => {
        const address = props.address || ''
        const addressPrep = BlocksoftPrettyStrings.makeCut(address, 6, 6)
        return (
            <View style={styles.topContent__address}>
                <LetterSpacing text={addressPrep} textStyle={styles.topContent__address} letterSpacing={1} />
            </View>
        )
    }

    closeAction = () => {
        NavStore.goBack()
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleShowMore = () => {
        this.transactionInfinity(0, this.state.transactionsShownLength + 10)
    }

    async transactionInfinity(from = 0, perPage = 10) {
        const { account, mainStore } = this.props

        const params = {
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            limitFrom: from,
            limitPerPage: perPage
        }
        if (mainStore.selectedWallet.walletIsHideTransactionForFee !== null && +mainStore.selectedWallet.walletIsHideTransactionForFee === 1) {
            params.minAmount = 0
        }
        const tmp = await transactionDS.getTransactions(params, 'AccountScreen.transactionInfinity list')
        const transactionsToView = []

        if (tmp && tmp.length > 0) {
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData, account.currencyCode)
                transactionsToView.push(transaction)
            }
        }

        if (account.transactionsTotalLength > 0) {
            this.setState({ transactionsToView, transactionsShownLength: perPage })
        } else {
            this.setState({ transactionsToView })
        }
    }

    getPrettyCurrenceName = (currencyCode, currencyName) => {
        switch(currencyCode){
            case 'USDT':
                return 'Tether Bitcoin'
            case 'ETH_USDT':
                return 'Tether Ethereum'
            case 'TRX_USDT':
                return 'Tether Tron'
            default:
                return currencyName
        }
    }

    render() {
        const blurVisibility = this.props.blurVisibility
        if (blurVisibility) {
            return  <AppLockBlur/>
        }

        MarketingAnalytics.setCurrentScreen('Account.AccountScreen')

        UpdateAccountListDaemon.pause()

        const { colors, isLight } = this.context
        const { mode, headerHeight } = this.state
        const { mainStore, account, cryptoCurrency, settingsStore } = this.props
        let { amountToView, show, transactionsToView, transactionsShownLength, isBalanceVisible } = this.state
        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = account.transactionsToView
        }

        const allTransactionsToView = transactionsToView // was concat before

        const address = account.address

        const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

        const btcAddress = typeof settingsStore.data.btc_legacy_or_segwit !== 'undefined' && settingsStore.data.btc_legacy_or_segwit === 'segwit' ? account.segwitAddress : account.legacyAddress

        const shownAddress = cryptoCurrency.currencyCode === 'BTC' ? btcAddress : address

        if (account && account.balanceProvider) {
            const logData = {
                currency: cryptoCurrency.currencyCode,
                address: shownAddress,
                amount: account.balancePretty + '',
                unconfirmed: account.unconfirmedPretty + '',
                balanceScanTime: account.balanceScanTime + '',
                balanceScanError : account.balanceScanError + '',
                balanceProvider: account.balanceProvider + '',
                balanceScanLog: account.balanceScanLog + '',
                balanceAddingLog: account.balanceAddingLog + '',
                basicCurrencyCode: account.basicCurrencyCode + '',
                basicCurrencyBalance: account.basicCurrencyBalance + '',
                basicCurrencyRate: account.basicCurrencyRate + ''
            }

            if (cryptoCurrency.currencyCode === 'BTC') {
                logData.legacyAddress = account.legacyAddress || ''
                logData.segwitAddress = account.segwitAddress || ''
            }
            MarketingEvent.logEvent('view_account', logData)
        }


        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    rightType="close"
                    rightAction={this.closeAction}
                    title={this.getPrettyCurrenceName(cryptoCurrency.currencyCode, cryptoCurrency.currencyName)}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={() => { return (
                        <BalanceHeader
                            account={account}
                            cryptoCurrency={cryptoCurrency}
                            actionReceive={this.handleReceive}
                            actionBuy={this.handleBuy}
                            actionSend={this.handleSend}
                            isBalanceVisible={this.state.isBalanceVisible}
                            originalVisibility={this.state.originalVisibility}
                        />
                    ) }}
                    scrollOffset={this.state.scrollOffset}
                />
                <ScrollView
                    style={{...styles.wrapper__scrollView, marginTop: Platform.OS === 'android' ? 50 : 84 }}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={(event) => this.updateOffset(event.nativeEvent.contentOffset.y)}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.text1}
                        />
                    }>
                    <View style={{...styles.wrapper__content }}>
                        <HeaderBlocks
                            mainStore={mainStore}
                            account={account}
                            cryptoCurrency={cryptoCurrency}
                            settingsStore={settingsStore}
                            cacheAsked={CACHE_ASKED}
                            isBalanceVisible={this.state.isBalanceVisible}
                            originalVisibility={this.state.originalVisibility}
                            triggerBalanceVisibility={this.triggerBalanceVisibility}
                        />
                        <AccountButtons
                            title={true}
                            actionReceive={this.handleReceive}
                            actionBuy={this.handleBuy}
                            actionSend={this.handleSend}
                        />
                        <View style={{
                            flex: 1,
                            // alignItems: 'flex-start',
                            height: mode === 'TRANSACTIONS' ? 'auto' : 0,
                            overflow: 'hidden'
                        }}>
                            <View>
                                {this.renderSynchronized(cryptoCurrency, account, allTransactionsToView)}
                            </View>
                            <View style={{ position: 'relative', width: '100%' }}>
                                <View style={{ position: 'relative', width: '100%', zIndex: 1 }}>
                                    {
                                        show ? allTransactionsToView.map((item, index) => {
                                            return <Transaction key={item.id} index={item.id}
                                                count={index}
                                                cards={mainStore.cards}
                                                transactions={transactionsToView}
                                                amountToView={amountToView}
                                                transaction={item}
                                                fioMemo={fioMemo[item.transactionHash]}
                                                account={account}
                                                cryptoCurrency={cryptoCurrency}
                                                dash={(allTransactionsToView.length - 1 === index) ? this.renderDash : !this.renderDash}
                                            />
                                        }) : null
                                    }
                                </View>
                            </View>
                            {
                                account.transactionsTotalLength > transactionsShownLength ?
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore} hitSlop={HIT_SLOP} >
                                            <Text style={{ ...styles.showMore__btn, color: colors.common.text1 }}>
                                                {strings('account.showMore')}
                                            </Text>
                                            <Ionicons name='ios-arrow-down' size={12} color={colors.common.text1} />
                                        </TouchableOpacity>
                                    </View> :
                                <View style={{ marginBottom: 60 }} />
                            }
                        </View>
                    </View>
                </ScrollView>
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient} start={styles.containerBG.start} end={styles.containerBG.end} />
            </View>

        )
    }
}

Account.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        settingsStore: state.settingsStore,
        cashBackStore: state.cashBackStore,
        exchangeStore: state.exchangeStore,
        blurVisibility: state.mainStore.blurVisibility
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Account)

const styles = {
    wrapper__scrollView: {
        flex: 1
    },
    wrapper__content: {
        flex: 1
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 66,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    scan: {
        // marginLeft: 10,
        // marginTop: 3,
        flexDirection: 'row'
    },
    scan__text: {
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    transaction_title: {
        marginLeft: 16,
        marginBottom: 4,
        fontSize: 17,
        fontFamily: 'Montserrat-Bold'
    },
    transaction__empty_text: {
        marginTop: -5,
        marginLeft: 16,
        fontSize: 15,
        lineHeight: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1.5
    },
    showMore: {
        flexDirection: 'row',
        justifyContent: 'center',

        padding: 10,
        marginBottom: 60
    },
    showMore__btn: {
        marginRight: 5,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold'
    }
}
