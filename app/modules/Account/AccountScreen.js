/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'

import {
    Platform,
    RefreshControl,
    View,
    FlatList, Linking
} from 'react-native'

import _isEqual from 'lodash/isEqual'

import GradientView from '@app/components/elements/GradientView'
import NavStore from '@app/components/navigation/NavStore'

import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setSelectedAccount, setSelectedAccountBalance, setSelectedAccountAddress } from '@app/appstores/Stores/Main/MainStoreActions'
import { getIsBalanceVisible, getIsSegwit } from '@app/appstores/Stores/Settings/selectors'
import { getFilterData, getIsBlurVisible, getSelectedAccountData, getSelectedAccountTransactions, getSelectedCryptoCurrencyData, getSelectedWalletData, getStakingCoins } from '@app/appstores/Stores/Main/selectors'

import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import { strings, sublocale } from '@app/services/i18n'

import { getAccountFioName } from '@crypto/blockchains/fio/FioUtils'

import { ThemeContext } from '@app/theme/ThemeProvider'

import Header from './elements/Header'
import HeaderBlocks from './elements/HeaderBlocks'
import AccountButtons from './elements/AccountButtons'
import Transaction from './elements/Transaction'
import BalanceHeader from './elements/AccountData'

import { getPrettyCurrencyName, handleBuy, handleReceive, handleSend } from './helpers'
import store from '@app/store'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import SynchronizedBlock from './elements/SynchronizedBlock'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import config from '@app/config/config'
import InfoNotification from '@app/components/elements/new/InfoNotification'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

let CACHE_ASKED = false
let CACHE_CLICKED_BACK = false
let CACHE_TX_LOADED = 0
const TX_PER_PAGE = 20

let CACHE_IS_BALANCE_UPDATING = false
let CACHE_BALANCE_TIMEOUT = false
class Account extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            clickRefresh: false,

            transactionsToView: [],

            fioMemo: {},
            isBalanceVisible: false,
            isBalanceVisibleTriggered: false,

            hasStickyHeader: false,

            isSeaching: false,
            isMultisig: false,
            showMultisigMsg : true
        }

        this.refreshBalance()
        // this.handleSearch = this.handleSearch.bind(this)
    }

    async componentDidMount() {
        const { currencyCode } = this.props.selectedCryptoCurrencyData
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

        this._onLoad()
    }

    componentDidUpdate(prevProps) {
        if (!_isEqual(prevProps.filterData, this.props.filterData)) {
            this.loadTransactions(0)
        }
    }

    async _onLoad() {
        CACHE_ASKED = trusteeAsyncStorage.getExternalAsked()
        CACHE_CLICKED_BACK = false
    }

    triggerBalanceVisibility = (value, originalVisibility) => {
        this.setState(() => ({ isBalanceVisible: value || originalVisibility, isBalanceVisibleTriggered: true }))
    }

    updateOffset = (event) => {
        const offset = event.nativeEvent.contentOffset.y
        const newOffset = Math.round(offset)
        if (!this.state.hasStickyHeader && newOffset > 260) this.setState(() => ({ hasStickyHeader: true }))
        if (this.state.hasStickyHeader && newOffset < 260) this.setState(() => ({ hasStickyHeader: false }))
    }

    handleRegisterFIOAddress = async () => {
        const { address } = this.props.selectedAccountData
        const link = BlocksoftExternalSettings.getStatic('FIO_REGISTRATION_URL')
        NavStore.goNext('WebViewScreen', { url: link + address, title: strings('fioMainSettings.registerFioAddress') })
    }

    handleRefresh = async (click = false) => {
        const { walletIsHd } = this.props.selectedWalletData
        const { currencyCode } = this.props.selectedCryptoCurrencyData
        this.setState({
            refreshing: !click,
            clickRefresh: click,
        })

        UpdateOneByOneDaemon._canUpdate = false

        let needRefresh = false
        if (currencyCode !== 'ETH_ROPSTEN' && currencyCode !== 'ETH_RINKEBY') {
            try {
                if (await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true, source: 'ACCOUNT_REFRESH' })) {
                    needRefresh = true
                }
            } catch (e) {
                Log.errDaemon('AccountScreen handleRefresh error updateTradeOrdersDaemon ' + e.message)
            }
        }

        try {
            if (await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({
                force: true,
                currencyCode,
                source: 'ACCOUNT_REFRESH'
            })) {
                needRefresh = true
            }
            if (currencyCode === 'BTC' && walletIsHd) {
                if (await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({
                    force: true,
                    currencyCode,
                    source: 'ACCOUNT_REFRESH'
                })) {
                    needRefresh = true
                }
            }
        } catch (e) {
            Log.errDaemon('AccountScreen handleRefresh error updateAccountBalanceAndTransactions ' + e.message)
        }

        if (needRefresh) {
            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({
                    force: true,
                    currencyCode,
                    source: 'ACCOUNT_REFRESH'
                })
            } catch (e) {
                Log.errDaemon('AccountScreen handleRefresh error updateAccountListDaemon ' + e.message)
            }
            await setSelectedAccount('AccountScreen.handeRefresh')
            this.loadTransactions(0)
        }


        UpdateOneByOneDaemon._canUpdate = true

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    async refreshBalance() {
        if (CACHE_IS_BALANCE_UPDATING) {
            return false
        }
        CACHE_IS_BALANCE_UPDATING = true
        if (CACHE_BALANCE_TIMEOUT) {
            clearTimeout(CACHE_BALANCE_TIMEOUT)
        }
        const { address, basicCurrencyRate, balanceStakedPretty, balanceTotalPretty, walletHash, derivationPath, walletCashback } = this.props.selectedAccountData
        const { currencyCode } = this.props.selectedCryptoCurrencyData

        if (currencyCode === 'BTC' || currencyCode === 'LTC') {
            return false
        }

        if (address === 'invalidRecheck1') {
            try {
                const dbAccount = await currencyActions.recreateCurrency(currencyCode, walletHash, 0, 1)
                if (dbAccount) {
                    const accountNew = {}
                    accountNew.walletHash = walletHash
                    accountNew.address = dbAccount.address
                    accountNew.currencyCode = currencyCode
                    await setSelectedAccountAddress(accountNew)
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('AccountScreen.reload ' + currencyCode + ' ' + address + ' rebuild address error ' + e.message, e)
                }
                Log.log('AccountScreen.reload ' + currencyCode + ' ' + address + ' rebuild address error ' + e.message)
            }
        } else if (config.daemon.scanOnAccount) {
            try {
                const tmp = await (BlocksoftBalances.setCurrencyCode(currencyCode).setWalletHash(walletHash).setAdditional({derivationPath}).setAddress(address)).getBalance('AccountScreen')
                if (tmp && typeof tmp?.balance !== 'undefined') {
                    if (!tmp?.address || tmp?.address !== address || tmp?.currencyCode !== currencyCode) {
                        Log.log('AccountScreen.reload ' + currencyCode + ' ' + address + ' balance will not update as got ' + tmp?.address)
                    } else {
                        const newBalance = tmp?.balance
                        const newBalancePretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(newBalance)
                        const newBasicCurrencyBalance = BlocksoftPrettyNumbers.makeCut(newBalancePretty * basicCurrencyRate, 2).cutted
                        const newBalanceStakedPretty = typeof tmp?.balanceStaked !== 'undefined' ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(tmp?.balanceStaked ) : balanceStakedPretty
                        const newBalanceTotalPretty = typeof tmp?.balanceAvailable !== 'undefined' ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(tmp?.balanceAvailable ) : balanceTotalPretty
                        const accountNew = {
                            balance : newBalance,
                            balancePretty : newBalancePretty,
                            basicCurrencyBalance: newBasicCurrencyBalance,
                            balanceStakedPretty : newBalanceStakedPretty,
                            balanceTotalPretty : newBalanceTotalPretty
                        }
                        let isChanged = false
                        try {
                            for (const key in accountNew) {
                                if (typeof this.props.selectedAccountData[key] === 'undefined' || this.props.selectedAccountData[key].toString() !== accountNew[key].toString()) {
                                    isChanged = true
                                }
                            }
                        } catch (e) {
                            throw new Error(e.message + ' while isChanged check')
                        }
                        try {
                            if (isChanged) {
                                if (typeof tmp?.balanceStaked !== 'undefined') {
                                    accountNew.balanceStaked = tmp?.balanceStaked
                                }
                                accountNew.address = address
                                accountNew.currencyCode = currencyCode
                                await setSelectedAccountBalance(accountNew)
                            }
                        } catch (e) {
                            throw new Error(e.message + ' while isChanged applied')
                        }
                    }
                }
                if (currencyCode === 'TRX' || currencyCode.indexOf('TRX_') === 0) {
                    try {
                        if (!this.state.isMultisig) {
                            const isMultisig = await (BlocksoftBalances.setCurrencyCode(currencyCode).setWalletHash(walletHash).setAdditional({ derivationPath }).setAddress(address)).isMultisig('AccountScreen')
                            if (isMultisig) {
                                MarketingEvent.logEvent('trx_multisig', { address, isMultisig, walletCashback, walletHash })
                                this.setState({ isMultisig })
                            }
                        }
                    } catch (e) {
                        // do nothing
                    }
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('AccountScreen.reload ' + currencyCode + ' ' + address + ' error ' + e.message, e)
                }
                Log.log('AccountScreen.reload ' + currencyCode + ' ' + address + ' error ' + e.message)
            }
            CACHE_BALANCE_TIMEOUT = setTimeout(() => {
                this.refreshBalance()
            },5000)
        }
        CACHE_IS_BALANCE_UPDATING = false
    }

    closeAction = () => {
        if (!CACHE_CLICKED_BACK) {
            CACHE_CLICKED_BACK = true
            // setFilter(null)
            NavStore.goBack()
        }
    }

    handleShowMore = () => {
        if (this.state.clickRefresh) return
        this.loadTransactions(this.state.transactionsToView.length)
    }

    async loadTransactions(from = 6, perPage = TX_PER_PAGE) {
        const { walletHash } = this.props.selectedAccountData
        const { currencyCode } = this.props.selectedCryptoCurrencyData
        const filter = this.props.filterData

        let params = {
            walletHash,
            currencyCode,
            limitFrom: from,
            limitPerPage: perPage
        }

        if (typeof filter !== 'undefined' && Object.keys(filter)) {
            params = {
                ...params,
                ...filter
            }
        }

        const tmp = await transactionDS.getTransactions(params, 'AccountScreen.loadTransactions list')
        const transactionsToView = []

        if (tmp && tmp.length > 0) {
            const account = store.getState().mainStore.selectedAccount
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData, currencyCode)
                transactionsToView.push(transaction)
            }
        }

        CACHE_TX_LOADED = new Date().getTime()

        if (from === 0) {
            this.setState((state) => ({ transactionsToView: transactionsToView })) // from start reload
        } else {
            this.setState((state) => ({ transactionsToView: state.transactionsToView.concat(transactionsToView) }))
        }
    }

    // toggleSearch = () => {
    //     this.setState({
    //         isSeaching: !this.state.isSeaching,
    //     })

    //     if (this.state.isSeaching) {
    //         setFilter({
    //             ...this.props.filterData,
    //             searchQuery: null
    //         }, 'AccountScreen.toggleSearch')
    //     }
    // }

    closeMsg = () => {
        this.setState({ showMultisigMsg : !this.state.showMultisigMsg })
    }


    handleMoreInfo = () => {
        const sub = sublocale()
        const linkUrl = 'https://blog.trusteeglobal.com/' + sub + '/yak-ne-staty-zhertvoyu-shahrayiv-u-kryptovalyutah/'
        try {
            Linking.openURL(linkUrl)
        } catch (e) {

        }
    }

    render() {

        MarketingAnalytics.setCurrentScreen('Account.AccountScreen')

        const { colors, GRID_SIZE } = this.context
        const { isSegwit, selectedAccountData, selectedCryptoCurrencyData } = this.props
        let { transactionsToView } = this.state
        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = this.props.selectedAccountTransactions.transactionsToView
            CACHE_TX_LOADED = this.props.selectedAccountTransactions.transactionsLoaded
        } else if (CACHE_TX_LOADED * 1 <= this.props.selectedAccountTransactions.transactionsLoaded * 1 && !this.state.hasStickyHeader) {
            transactionsToView = this.props.selectedAccountTransactions.transactionsToView
            CACHE_TX_LOADED = this.props.selectedAccountTransactions.transactionsLoaded
            this.loadTransactions(0)
        }

        const allTransactionsToView = transactionsToView // was concat before

        let shownAddress = selectedAccountData.address
        if (selectedAccountData.segwitAddress) {
            shownAddress = isSegwit ? selectedAccountData.segwitAddress : selectedAccountData.legacyAddress
        }

        if (selectedAccountData.balanceProvider) {
            const logData = {
                currency: selectedCryptoCurrencyData.currencyCode,
                address: shownAddress,
                amount: selectedAccountData.balancePretty + '',
                unconfirmed: selectedAccountData.unconfirmedPretty + '',
                balanceScanTime: selectedAccountData.balanceScanTime + '',
                balanceScanError: selectedAccountData.balanceScanError + '',
                balanceProvider: selectedAccountData.balanceProvider + '',
                balanceScanLog: selectedAccountData.balanceScanLog + '',
                balanceAddingLog: selectedAccountData.balanceAddingLog + '',
                basicCurrencyCode: selectedAccountData.basicCurrencyCode + '',
                basicCurrencyBalance: selectedAccountData.basicCurrencyBalance + '',
                basicCurrencyRate: selectedAccountData.basicCurrencyRate + ''
            }

            if (selectedAccountData.segwitAddress) {
                logData.legacyAddress = selectedAccountData.legacyAddress || ''
                logData.segwitAddress = selectedAccountData.segwitAddress || ''
            }
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType='close'
                    rightAction={this.closeAction}
                    title={getPrettyCurrencyName(selectedCryptoCurrencyData.currencyCode, selectedCryptoCurrencyData.currencyName)}
                    ExtraView={() => (
                        <BalanceHeader
                            balancePretty={selectedAccountData.balancePretty}
                            currencySymbol={selectedCryptoCurrencyData.currencySymbol}
                            actionReceive={() => handleReceive(this.props)}
                            actionBuy={() => handleBuy(this.props)}
                            actionSend={() => handleSend(this.props)}
                            isBalanceVisible={this.state.isBalanceVisible}
                            isBalanceVisibleTriggered={this.state.isBalanceVisibleTriggered}
                            originalVisibility={this.props.isBalanceVisible}
                            triggerBalanceVisibility={this.triggerBalanceVisibility}
                        />
                    )}
                    hasStickyHeader={this.state.hasStickyHeader}
                />
                <View style={styles.stub} />
                <FlatList
                    data={allTransactionsToView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wrapper__scrollView}
                    initialNumToRender={20}
                    maxToRenderPerBatch={TX_PER_PAGE}
                    updateCellsBatchingPeriod={100}
                    onScroll={this.updateOffset}
                    getItemLayout={(data, index) => ({ length: 110, offset: 110 * index, index })}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />
                    }
                    ListHeaderComponent={() => (
                        <>
                            <HeaderBlocks
                                account={{
                                    walletHash: selectedAccountData.walletHash,
                                    shownAddress,
                                    balancePretty: selectedAccountData.balancePretty,
                                    balanceStakedPretty: selectedAccountData.balanceStakedPretty,
                                    balanceTotalPretty : selectedAccountData.balanceTotalPretty,
                                    basicCurrencySymbol: selectedAccountData.basicCurrencySymbol,
                                    basicCurrencyBalance: selectedAccountData.basicCurrencyBalance,
                                    isSynchronized: selectedAccountData.isSynchronized,
                                    walletPubs: selectedAccountData.walletPubs
                                }}
                                cryptoCurrency={{
                                    currencyCode: selectedCryptoCurrencyData.currencyCode,
                                    currencySymbol: selectedCryptoCurrencyData.currencySymbol,
                                    currencyName: selectedCryptoCurrencyData.currencyName,
                                    currencyExplorerLink: selectedCryptoCurrencyData.currencyExplorerLink,
                                    decimals: selectedCryptoCurrencyData.decimals
                                }}
                                isSegwit={isSegwit}
                                cacheAsked={CACHE_ASKED}
                                isBalanceVisible={this.state.isBalanceVisible}
                                isBalanceVisibleTriggered={this.state.isBalanceVisibleTriggered}
                                originalVisibility={this.props.isBalanceVisible}
                                triggerBalanceVisibility={this.triggerBalanceVisibility}
                                stakingCoins={this.props.stakingCoins}
                            />
                            <AccountButtons
                                title={true}
                                actionReceive={() => handleReceive(this.props)}
                                actionBuy={() => handleBuy(this.props)}
                                actionSend={() => handleSend(this.props)}
                            />
                            <SynchronizedBlock
                                allTransactionsToView={allTransactionsToView}
                                transactionsToView={transactionsToView}
                                selectedAccountData={selectedAccountData}
                                clickRefresh={this.state.clickRefresh}
                                selectedAccountTransactions={this.props.selectedAccountTransactions}
                                handleRefresh={this.handleRefresh}
                                // toggleSearch={this.toggleSearch}
                                // isSeaching={this.state.isSeaching}
                                filterData={this.props.filterData}
                            />
                            {this.state.isMultisig && this.state.showMultisigMsg ?
                                <View style={{ marginHorizontal: GRID_SIZE }}>
                                    <InfoNotification
                                        title={strings('settings.walletList.multisigWallet')}
                                        subTitle={strings('settings.walletList.multisigWalletDesc')}
                                        closeCallback={this.closeMsg}
                                        onPress={this.handleMoreInfo}
                                        iconType="warning"
                                    />
                                </View> : null }
                        </>
                    )}
                    renderItem={({ item, index }) => (
                        <Transaction
                            isFirst={index === 0}
                            transaction={item}
                            cryptoCurrency={{
                                currencyCode: selectedCryptoCurrencyData.currencyCode,
                                currencySymbol: selectedCryptoCurrencyData.currencySymbol,
                                currencyColor: this.context.isLight ? selectedCryptoCurrencyData.mainColor : selectedCryptoCurrencyData.darkColor
                            }}
                            dashHeight={allTransactionsToView.length === 1 ? 0 : (allTransactionsToView.length - 1 === index) ? 50 : 150}
                            isBalanceVisible={this.state.isBalanceVisible}
                            isBalanceVisibleTriggered={this.state.isBalanceVisibleTriggered}
                            originalVisibility={this.props.isBalanceVisible}
                        />
                    )}
                    onEndReachedThreshold={0.5}
                    onEndReached={this.handleShowMore}
                    keyExtractor={item => (item.id || ('bse_' + item.bseOrderData.orderId)).toString()}
                />
                <GradientView
                    style={styles.bottomButtons}
                    array={colors.accountScreen.bottomGradient}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                />
            </View>
        )
    }
}

Account.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state),
        selectedAccountData: getSelectedAccountData(state),
        selectedAccountTransactions: getSelectedAccountTransactions(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        isSegwit: getIsSegwit(state),
        isBlurVisible: getIsBlurVisible(state),
        stakingCoins: getStakingCoins(state),
        filterData: getFilterData(state)
    }
}

export default connect(mapStateToProps)(Account)

const styles = {
    wrapper__scrollView: {
        paddingBottom: 20,
    },
    stub: {
        marginBottom: Platform.OS === 'android' ? 44 : 84,
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 66,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },

    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    showMore: {
        flexDirection: 'row',
        justifyContent: 'center',

        padding: 10,
        marginBottom: 60
    }
}
