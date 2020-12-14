/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Linking, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'

import firebase from 'react-native-firebase'
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
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import { setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'

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


let CACHE_ASKED = false

class Account extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            amountToView: 5,
            transactionsToView: [],
            transactionsTotalLength: 0,
            transactionsShownLength: 0,

            ordersWithoutTransactions : [],

            show: true,
            mode: 'TRANSACTIONS',
            openTransactionList: [],
            dash: true,

            firstCall: true,
            fioMemo: {},
            scrollOffset: 0,
            isBalanceVisible: false,
            originalVisibility: false
        }
        this.getBalanceVisibility()
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        UpdateOneByOneDaemon._canUpdate = false
        try {

            setTimeout(() => {
                this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
                    if (this.state.firstCall) {
                        this.setState({ firstCall: false })
                    }
                })
            }, 1000)

            // await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({force : true, source : 'ACCOUNT_OPEN'})

        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err('AccountScreen.componentDidMount ' + e.message)
        }
        UpdateOneByOneDaemon._canUpdate = true
        CACHE_ASKED = await AsyncStorage.getItem('asked')

        this.transactionInfinity()
        this.ordersWithoutTransactions()
    }

    async componentDidMount() {
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
        this.transactionInfinity()
        this.ordersWithoutTransactions()
    }

    getBalanceVisibility = async () => {
        try {
            const res = await AsyncStorage.getItem('isBalanceVisible')
            const originalVisibility = res !== null ? JSON.parse(res) : true

            this.setState(() => ({ originalVisibility, isBalanceVisible: originalVisibility }))
        } catch (e) {
            Log.err(`AccountScreen getBalanceVisibility error ${e.message}`)
        }
    }

    triggerBalanceVisibility = () => {
        console.log('hsfj sdljf ls')
        if (this.state.originalVisibility) return
        this.setState(state => ({ isBalanceVisible: !state.isBalanceVisible }))
    }

    updateOffset = (offset) => {
        const newOffset = Math.round(offset)
        if (this.state.scrollOffset !== newOffset) this.setState(() => ({ scrollOffset: newOffset }))
    }

    handleRegisterFIOAddress = async () => {
        const { address } = this.props.account
        const { apiEndpoints } = config.fio
        await Linking.openURL(`${apiEndpoints.registrationSiteURL}${address}`)
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

            await SendActions.startSend({
                uiType: 'ACCOUNT_SCREEN',
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
        const isNewInterfaceBuy = await AsyncStorage.getItem('isNewInterfaceBuy')

        ExchangeActions.handleSetTradeType({ tradeType: 'BUY' })

        if (isNewInterfaceBuy === 'true') {
            ExchangeActions.handleSetNewInterface(true, 'BUY')
            NavStore.goNext('TradeV3ScreenStack')
        } else {
            await this._showModalNoOldConfigs()
            ExchangeActions.handleSetNewInterface(false, 'BUY')
            NavStore.goNext('TradeScreenStack')
        }
    }

    handleRefresh = async () => {
        const { account } = this.props

        this.setState({
            refreshing: true
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

        this.setState({
            refreshing: false
        })
    }

    diffTimeScan = (timeScan) => {
        const lastScan = new Date(timeScan).getTime()
        const timeNow = new Date().getTime()

        let diffTime = (timeNow - lastScan) / 1000

        diffTime /= 60

        return Math.abs(Math.round(diffTime));
    }

    renderTooltip = (props) => {

        const { cryptoCurrency, account, allTransactionsToView } = props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        const { colors, GRID_SIZE } = this.context

        return (
            <View style={{ flexDirection: 'column', marginHorizontal: GRID_SIZE }}>
                <View style={{ marginTop: 24, flexDirection: 'row', position: 'relative', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row' }} >
                        <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                        <View style={styles.scan}>
                            {isSynchronized ?
                                <Text style={styles.scan__text} numberOfLines={1} >{this.diffTimeScan(this.props.account.balanceScanTime * 1000) < 1 ? 
                                    strings('account.justScan') : strings('account.scan', { time: this.diffTimeScan(this.props.account.balanceScanTime * 1000) })} </Text>
                                :
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginRight: 10,
                                    marginTop: -12
                                }}><Text style={{
                                    ...styles.transaction__empty_text, ...{
                                        marginLeft: 10,
                                        marginRight: 10,
                                        marginTop: 0
                                    }
                                }}>{strings('homeScreen.synchronizing')}</Text>
                                    <Loader size={14} color={'#999999'} />
                                </View>
                            }
                        </View>
                    </View>
                    <TouchableOpacity style={{ justifyContent: 'center', marginRight: 16}} onPress={() => this.handleRefresh()} >
                        <CustomIcon name={'reloadTx'} size={20} color={colors.accountScreen.showMoreColor} />
                    </TouchableOpacity>
                </View>
                {
                    !props.allTransactionsToView.length ?
                        <View>
                            {isSynchronized && <Text
                                style={styles.transaction__empty_text}>
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
        const { account } = this.props
        let transactionsTotalLength = 0
        if (from === 0) {
            transactionsTotalLength = await transactionDS.getTransactionsCount({
                walletHash: account.walletHash,
                currencyCode: account.currencyCode,
                minAmount : 0,
            }, 'AccountScreen.transactionInfinity count')
        }

        const tmp = await transactionDS.getTransactions({
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            minAmount: 0,
            limitFrom: from,
            limitPerPage: perPage
        }, 'AccountScreen.transactionInfinity list')
        const transactionsToView = []
        if (tmp && tmp.length > 0) {
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData)
                transactionsToView.push(transaction)
            }
        }

        if (transactionsTotalLength > 0) {
            this.setState({ transactionsToView, transactionsTotalLength, transactionsShownLength: perPage })
        } else {
            this.setState({ transactionsToView })
        }
    }

    // @yura HERE YOU CAN ADD ANY LOGIC FOR NOT RECHECK ALL ELEMENTS INSIDE TXS
    // plus you can use it as transactionActions.preformatOrder in ONE place
    async ordersWithoutTransactions() {
        const { account, exchangeOrdersStore } = this.props
        const preformatOrders = []
        // it there is no wallet hash in store - just update code IN STORE if its bug or show me how you done it - not comment out logic
        if (account.walletHash === exchangeOrdersStore.walletHash && exchangeOrdersStore.exchangeOrders[account.currencyCode]) {
            for (const exchangeOrder of exchangeOrdersStore.exchangeOrders[account.currencyCode] ) {
                const preformatOrder = transactionActions.preformatWithBSEforShow(false, exchangeOrder, account.currencyCode)
                preformatOrders.push(preformatOrder)
            }
         }
        this.setState({
            ordersWithoutTransactions: preformatOrders
        })
    }

    getPrettyCurrenceName = (currencyCode, currencyName) => {
        switch(currencyCode){
            case 'USDT':
                return 'Tether Bitcoin'
            case 'ETH_USDT':
                return 'Tether Etherium'
            case 'TRX_USDT':
                return 'Tether Tron'
            default:
                return currencyName
        }
    }

    render() {
        // noinspection ES6MissingAwait
        firebase.analytics().setCurrentScreen('Account.AccountScreen')

        UpdateAccountListDaemon.pause()

        const { colors, isLight } = this.context
        const { mode, openTransactionList } = this.state
        const { mainStore, account, cryptoCurrency, settingsStore } = this.props
        const { amountToView, show, transactionsToView, transactionsTotalLength, transactionsShownLength, isBalanceVisible } = this.state

        const allTransactionsToView = this.state.ordersWithoutTransactions.slice(0,3).concat(transactionsToView)

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
                    // title={strings('account.title').toUpperCase()}
                    title={this.getPrettyCurrenceName(cryptoCurrency.currencyCode, cryptoCurrency.currencyName)}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={() => { return (
                        <BalanceHeader 
                            account={account}
                            cryptoCurrency={cryptoCurrency}
                            actionReceive={this.handleReceive}
                            actionBuy={this.handleBuy}
                            actionSend={this.handleSend}
                            isBalanceVisible={isBalanceVisible}
                            visibleAction={this.triggerBalanceVisibility}
                        />
                    ) }}
                    scrollOffset={this.state.scrollOffset}
                />
                <ScrollView
                    style={styles.wrapper__scrollView}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={(event) => this.updateOffset(event.nativeEvent.contentOffset.y)}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                        />
                    }>
                    <View style={styles.wrapper__content}>
                        <HeaderBlocks
                            mainStore={mainStore}
                            account={account}
                            cryptoCurrency={cryptoCurrency}
                            settingsStore={settingsStore}
                            cacheAsked={CACHE_ASKED}
                            isBalanceVisible={isBalanceVisible}
                            visibleAction={this.triggerBalanceVisibility}
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
                                <ToolTips type={'ACCOUNT_SCREEN_TRANSACTION_TIP'}
                                    height={100}
                                    MainComponent={this.renderTooltip}
                                    nextCallback={this.nextCallback}
                                    mainComponentProps={{
                                        transactionsToView,
                                        cryptoCurrency,
                                        account,
                                        allTransactionsToView
                                    }} />
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
                                                dash={(allTransactionsToView - 1 === index) ? this.renderDash : !this.renderDash}
                                            />
                                        }) : null
                                    }
                                </View>
                            </View>
                            {
                                transactionsTotalLength > transactionsShownLength ?
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore} hitSlop={HIT_SLOP} >
                                            <Text style={{ ...styles.showMore__btn, color: colors.accountScreen.showMoreColor }}>
                                                {strings('account.showMore')}
                                            </Text>
                                            <Ionicons name='ios-arrow-down' size={12} color={colors.accountScreen.showMoreColor} />
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
        exchangeOrdersStore: state.exchangeOrdersStore,
        settingsStore: state.settingsStore,
        cashBackStore: state.cashBackStore
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
        flex: 1,

        marginTop: 60
    },
    wrapper__content: {
        flex: 1,

        paddingTop: 20
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
        marginLeft: 10,
        marginTop: 3,
        flexDirection: 'row'
    },
    scan__text: {
        color: '#999999',
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
        marginBottom: 10,
        color: '#404040',
        fontSize: 17,
        fontFamily: 'Montserrat-Bold'
    },
    transaction__new: {
        color: '#EA751D'
    },
    transaction__empty_text: {
        marginTop: -5,
        marginLeft: 16,
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
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
    },
}