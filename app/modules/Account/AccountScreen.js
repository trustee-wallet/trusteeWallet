/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'

import {
    Platform,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native'

import LottieView from 'lottie-react-native'

import GradientView from '@app/components/elements/GradientView'
import NavStore from '@app/components/navigation/NavStore'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import Loader from '@app/components/elements/LoaderItem'
import AppLockBlur from '@app/components/AppLockBlur'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'

import Log from '@app/services/Log/Log'
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import { strings } from '@app/services/i18n'

import { HIT_SLOP } from '@app/themes/Themes'
import CustomIcon from '@app/components/elements/CustomIcon'
import AsyncStorage from '@react-native-community/async-storage'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import { getAccountFioName } from '@crypto/blockchains/fio/FioUtils'
import config from '@app/config/config'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import Header from './elements/Header'
import HeaderBlocks from './elements/HeaderBlocks'
import AccountButtons from './elements/AccountButtons'
import Transaction from './elements/Transaction'
import BalanceHeader from './elements/AccountData'

import blackLoader from '@app/assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@app/assets/jsons/animations/refreshWhite.json'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import Netinfo from '@app/services/Netinfo/Netinfo'

import { diffTimeScan } from './helpers'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { getIsBlurVisible } from '@app/appstores/Stores/Main/selectors'

let CACHE_ASKED = false
const TX_PER_PAGE = 20

class Account extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            clickRefresh: false,

            transactionsToView: [],

            mode: 'TRANSACTIONS',

            fioMemo: {},
            isBalanceVisible: false,
            originalVisibility: false,

            hasStickyHeader: false,
        }
    }

    async componentDidMount() {
        CACHE_ASKED = await AsyncStorage.getItem('asked')
        this.loadTransactions()
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
    }

    getBalanceVisibility = () => {
        const isBalanceVisible = this.props.settingsStore.data.isBalanceVisible
        this.setState(() => ({ isBalanceVisible, originalVisibility: isBalanceVisible }))
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    updateOffset = (event) => {
        const offset = event.nativeEvent.contentOffset.y
        const newOffset = Math.round(offset)
        if (!this.state.hasStickyHeader && newOffset > 260) this.setState(() => ({ hasStickyHeader: true }))
        if (this.state.hasStickyHeader && newOffset < 260) this.setState(() => ({ hasStickyHeader: false }))
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
        NavStore.goNext('AccountReceiveScreen')
    }

    handleSend = async () => {
        const { cryptoCurrency, account } = this.props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ cryptoCurrency, account })

        if (isSynchronized) {
            await SendActionsStart.startFromAccountScreen(cryptoCurrency, account)
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

            let showMsg = await AsyncStorage.getItem('smartSwapMsg')
            showMsg = showMsg ? JSON.parse(showMsg) : false

            if (typeof showMsg === 'undefined' || !showMsg) {
                showModal({
                    type: 'MARKET_MODAL',
                    icon: 'INFO',
                    title: strings('modal.marketModal.title'),
                    description: strings('modal.marketModal.description'),
                }, () => {
                    NavStore.goNext('MarketScreen', { side: 'OUT', currencyCode: this.props.account.currencyCode })
                })
            } else {
                NavStore.goNext('MarketScreen', { side: 'OUT', currencyCode: this.props.account.currencyCode })
            }

            // }
        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            }
        }
    }

    handleRefresh = async (click = false) => {
        const { account, selectedWallet } = this.props

        this.setState({
            refreshing: !click,
            clickRefresh: click,
        })

        UpdateOneByOneDaemon._canUpdate = false

        if (account.currencyCode !== 'ETH_ROPSTEN') {
            try {
                await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true, source: 'ACCOUNT_REFRESH' })
            } catch (e) {
                Log.errDaemon('AccountScreen handleRefresh error updateTradeOrdersDaemon ' + e.message)
            }
        }

        try {
            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({
                force: true,
                currencyCode: account.currencyCode,
                source: 'ACCOUNT_REFRESH'
            })
            if (account.currencyCode === 'BTC' && selectedWallet.walletIsHd === 1) {
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

        this.loadTransactions()

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    renderSynchronized = (cryptoCurrency, account, allTransactionsToView) => {
        let { transactionsToView } = this.state
        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = account.transactionsToView
        }

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        const { colors, GRID_SIZE, isLight } = this.context


        const diff = diffTimeScan(this.props.account.balanceScanTime)
        let diffTimeText = ''
        if (diff > 60) {
            diffTimeText = strings('account.soLong')
        } else {
            if (diff < 1) {
                diffTimeText = strings('account.justScan')
            } else {
                diffTimeText = strings('account.scan', { time: diff })
            }
            if (this.props.account.balanceScanError && this.props.account.balanceScanError !== '' && this.props.account.balanceScanError !== 'null') {
                diffTimeText += '\n' + strings(this.props.account.balanceScanError)
            }
        }

        return (
            <View style={{ flexDirection: 'column', marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }}>
                <View style={{ marginTop: 24, flexDirection: 'row', position: 'relative', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'column' }} >
                        <Text style={{ ...styles.transaction_title, color: colors.common.text1 }}>{strings('account.history')}</Text>
                        <View style={{ ...styles.scan, marginLeft: 16 }}>
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
                    <TouchableOpacity style={{ ...styles.scan, alignItems: 'center', marginRight: GRID_SIZE }} onPress={() => this.handleRefresh(true)} hitSlop={HIT_SLOP} >
                        {this.state.clickRefresh ?
                            <LottieView style={{ width: 20, height: 20, }}
                                source={isLight ? blackLoader : whiteLoader}
                                autoPlay loop /> :
                            <CustomIcon name={'reloadTx'} size={20} color={colors.common.text1} />}
                    </TouchableOpacity>
                </View>
                {
                    // account.transactionsTotalLength === 0 && (!transactionsToView || transactionsToView.length === 0) ? //@ksu fail order not working
                    allTransactionsToView.length === 0 && (!transactionsToView || transactionsToView.length === 0) ?
                        <View style={{ marginRight: GRID_SIZE }} >
                            {isSynchronized && <Text
                                style={{ ...styles.transaction__empty_text, marginTop: GRID_SIZE, color: colors.common.text3 }}>
                                {strings('account.noTransactions')}
                            </Text>}
                        </View>
                        : null
                }
            </View>
        )

    }

    closeAction = () => {
        NavStore.goBack()
    }

    handleShowMore = () => {
        if (this.state.clickRefresh) return
        this.loadTransactions(this.state.transactionsToView.length)
    }

    async loadTransactions(from = 0, perPage = TX_PER_PAGE) {
        const { account, selectedWallet } = this.props

        const params = {
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            limitFrom: from,
            limitPerPage: perPage
        }
        if (selectedWallet.walletIsHideTransactionForFee !== null && +selectedWallet.walletIsHideTransactionForFee === 1) {
            params.minAmount = 0
        }
        const tmp = await transactionDS.getTransactions(params, 'AccountScreen.loadTransactions list')
        const transactionsToView = []

        if (tmp && tmp.length > 0) {
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData, account.currencyCode)
                transactionsToView.push(transaction)
            }
        }

        this.setState((state) => ({ transactionsToView: state.transactionsToView.concat(transactionsToView) }))
    }

    getPrettyCurrenceName = (currencyCode, currencyName) => {
        switch (currencyCode) {
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
        if (this.props.isBlurVisible) {
            return  <AppLockBlur/>
        }

        MarketingAnalytics.setCurrentScreen('Account.AccountScreen')

        UpdateAccountListDaemon.pause()

        const { colors } = this.context
        const { account, cryptoCurrency, settingsStore } = this.props
        const isSegwit = settingsStore.data.btc_legacy_or_segwit === 'segwit'
        let { transactionsToView } = this.state
        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = account.transactionsToView
        }

        const allTransactionsToView = transactionsToView // was concat before

        let shownAddress = account.address
        if (account.segwitAddress) {
            shownAddress = isSegwit ? account.segwitAddress : account.legacyAddress
        }

        if (account && account.balanceProvider) {
            const logData = {
                currency: cryptoCurrency.currencyCode,
                address: shownAddress,
                amount: account.balancePretty + '',
                unconfirmed: account.unconfirmedPretty + '',
                balanceScanTime: account.balanceScanTime + '',
                balanceScanError: account.balanceScanError + '',
                balanceProvider: account.balanceProvider + '',
                balanceScanLog: account.balanceScanLog + '',
                balanceAddingLog: account.balanceAddingLog + '',
                basicCurrencyCode: account.basicCurrencyCode + '',
                basicCurrencyBalance: account.basicCurrencyBalance + '',
                basicCurrencyRate: account.basicCurrencyRate + ''
            }

            if (account.segwitAddress) {
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
                    ExtraView={() => (
                        <BalanceHeader
                            account={account}
                            cryptoCurrency={cryptoCurrency}
                            actionReceive={this.handleReceive}
                            actionBuy={this.handleBuy}
                            actionSend={this.handleSend}
                            isBalanceVisible={this.state.isBalanceVisible}
                            originalVisibility={this.state.originalVisibility}
                        />
                    )}
                    hasStickyHeader={this.state.hasStickyHeader}
                />
                <View style={styles.stub} />
                <FlatList
                    data={allTransactionsToView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wrapper__scrollView}
                    initialNumToRender={10}
                    onScroll={this.updateOffset}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.text1}
                        />
                    }
                    ListHeaderComponent={() => (
                        <React.Fragment>
                            <HeaderBlocks
                                account={account}
                                cryptoCurrency={cryptoCurrency}
                                isSegwit={isSegwit}
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
                            <View>
                                {this.renderSynchronized(cryptoCurrency, account, allTransactionsToView)}
                            </View>
                        </React.Fragment>
                    )}
                    renderItem={({ item, index }) => (
                        <Transaction
                            isFirst={index === 0}
                            transaction={item}
                            cryptoCurrency={{ currencyCode: cryptoCurrency.currencyCode, currencySymbol: cryptoCurrency.currencySymbol }}
                            dashHeight={allTransactionsToView.length === 1 ? 0 : (allTransactionsToView.length - 1 === index) ? 50 : 150}
                        />
                    )
                    }
                    onEndReachedThreshold={0.5}
                    onEndReached={this.handleShowMore}
                    keyExtractor={item => item.id || item.bseOrderData.orderId}
                />
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient} start={styles.containerBG.start} end={styles.containerBG.end} />
            </View>

        )
    }
}

Account.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        settingsStore: state.settingsStore,
        cashBackStore: state.cashBackStore,
        isBlurVisible: getIsBlurVisible(state)
    }
}

export default connect(mapStateToProps)(Account)

const styles = {
    wrapper__scrollView: {
        paddingBottom: 20,
    },
    stub: {
        marginBottom: Platform.OS === 'android' ? 50 : 84,
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
