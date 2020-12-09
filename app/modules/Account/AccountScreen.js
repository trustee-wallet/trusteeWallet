/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Linking, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View, SafeAreaView } from 'react-native'

import firebase from 'react-native-firebase'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Feather from 'react-native-vector-icons/Feather'
import IconAwesome from 'react-native-vector-icons/FontAwesome'

import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'
import ToolTips from '../../components/elements/ToolTips'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LetterSpacing from '../../components/elements/LetterSpacing'
import Loader from '../../components/elements/LoaderItem'

import Transaction from './elements/Transaction'
import SettingsBTC from './AccountSettings/elements/SettingsBTC'
import SettingsUSDT from './AccountSettings/elements/SettingsUSDT'
import SettingsXMR from './AccountSettings/elements/SettingsXMR'
import SettingsTRX from './AccountSettings/elements/SettingsTRX'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { clearSendData } from '../../appstores/Stores/Send/SendActions'
import { setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'


import Log from '../../services/Log/Log'
import Toast from '../../services/UI/Toast/Toast'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'
import checkTransferHasError from '../../services/UI/CheckTransferHasError/CheckTransferHasError'

import MarketingEvent from '../../services/Marketing/MarketingEvent'

import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '../../daemons/view/UpdateAccountListDaemon'

import { strings } from '../../services/i18n'

import Theme from '../../themes/Themes'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import CustomIcon from '../../components/elements/CustomIcon'
import UIDict from '../../services/UIDict/UIDict'
import AsyncStorage from '@react-native-community/async-storage'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'
import { getAccountFioName } from '../../../crypto/blockchains/fio/FioUtils'
import config from '../../config/config'
import DaemonCache from '../../daemons/DaemonCache'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'

import Header from '../../modules/Send/elements/Header'
import TransactionButton from './elements/TransactionButton'


let CACHE_ASKED = false

let styles

class Account extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            amountToView: 5,
            transactions: [],
            transactionsToView: [],
            show: true,
            mode: 'TRANSACTIONS',
            openTransactionList: [],
            dash: true,

            firstCall: true,
            fioMemo: {},
            scrollOffset: 0
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        UpdateOneByOneDaemon._canUpdate = false
        try {
            styles = Theme.getStyles().accountScreenStyles

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
    }

    updateOffset = (offset) => {
        const newOffset = Math.round(offset)
        if (this.state.scrollOffset !== newOffset) this.setState(() => ({ scrollOffset: newOffset }))
    }

    componentDidUpdate(prevProps) {
        if (prevProps.account.transactions.length !== this.props.account.transactions.length) {
            this.setState({
                show: false
            }, () => {
                this.setState({
                    show: true
                })
            })
        }
    }

    handleRegisterFIOAddress = async () => {
        const { address } = this.props.account
        const { apiEndpoints } = config.fio
        await Linking.openURL(`${apiEndpoints.registrationSiteURL}${address}`)
    }

    handleReceive = async () => {
        const { cryptoCurrency, account } = this.props
        // noinspection ES6MissingAwait
        checkTransferHasError({
            walletHash: account.walletHash,
            currencyCode: cryptoCurrency.currencyCode,
            currencySymbol: cryptoCurrency.currencySymbol,
            addressFrom: account.address,
            addressTo: account.address
        })
        NavStore.goNext('ReceiveScreen')
    }

    accountSetting = (account) => {
        NavStore.goNext('AccountSettings', { account })
        // this.setState({
        //     mode: this.state.mode === 'TRANSACTIONS' ? 'SETTINGS' : 'TRANSACTIONS'
        // })
    }

    handleSend = () => {
        const { cryptoCurrency, account } = this.props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ cryptoCurrency, account })

        if (isSynchronized) {

            clearSendData()

            NavStore.goNext('SendScreen')

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

    handleOpenLink = async (address) => {
        const now = new Date().getTime()
        const diff = now - CACHE_ASKED * 1
        if (!CACHE_ASKED || diff > 10000) {
            showModal({
                type: 'YES_NO_MODAL',
                title: strings('account.externalLink.title'),
                icon: 'WARNING',
                description: strings('account.externalLink.description')
            }, () => {
                AsyncStorage.setItem('asked', now + '')
                CACHE_ASKED = now
                this.actualOpen(address)
            })
        } else {
            this.actualOpen(address)
        }
    }

    actualOpen = (address) => {
        const { currencyExplorerLink } = this.props.cryptoCurrency

        Linking.canOpenURL(`${currencyExplorerLink}${address}`).then(supported => {
            if (supported) {
                let linkUrl = `${currencyExplorerLink}${address}`
                if (linkUrl.indexOf('?') === -1) {
                    linkUrl += '?from=trustee'
                }
                Linking.openURL(linkUrl)
            } else {
                Log.err('Account.AccountScreen Dont know how to open URI', `${currencyExplorerLink}${address}`)
            }
        })
    }

    handleOpenLinkLongPress = () => {
        const { account } = this.props

        let text = account.id + ' ' + account.address + ' ' + account.balanceProvider + ' current ' + account.balance + ', scan log ' + account.balanceScanLog
        if (typeof account.legacyData !== 'undefined' && account.legacyData) {
            text += `
            
            
            ` + account.legacyData.id + ' ' + account.legacyData.address + ' ' + account.legacyData.balanceProvider + ' current ' + account.legacyData.balance + ', scan log ' + account.legacyData.balanceScanLog
        }

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: 'SYSTEM_LOG',
            description: text.slice(0, 500)
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

        const { cryptoCurrency, account } = props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        return (
            <View style={{ flexDirection: 'column' }}>
                <View style={{ marginTop: 24, flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                    </View>
                    <View style={stl.scan}>
                        {isSynchronized ?
                            <Text style={stl.scan__text}>{this.diffTimeScan(this.props.account.balanceScanTime * 1000) < 1 ? strings('account.justScan') : strings('account.scan', { time: this.diffTimeScan(this.props.account.balanceScanTime * 1000) })} </Text>
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
                {
                    !props.transactionsToView.length ?
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

    prepareTransactions = (transactions, exchangeOrders) => {

        const { mainStore } = this.props
        const walletCashBackToken = CashBackUtils.getWalletToken()


        let transactionsTmp = []

        const indexedOrders = {}
        if (exchangeOrders && exchangeOrders.length > 0) {
            let item
            for (item of exchangeOrders) {
                if (item.cashbackToken !== walletCashBackToken) {
                    continue
                }
                if (item.requestedOutAmount.currencyCode !== this.props.cryptoCurrency.currencyCode && item.requestedInAmount.currencyCode !== this.props.cryptoCurrency.currencyCode) {
                    continue
                }

                const direction = item.requestedOutAmount.currencyCode === this.props.cryptoCurrency.currencyCode ? 'income' : 'outcome'
                const amount = direction === 'income' ? item.requestedOutAmount.amount : item.requestedInAmount.amount
                let subtitle = ''
                if (item.exchangeWayType === 'EXCHANGE') {
                    subtitle = item.requestedInAmount.currencyCode + '-' + item.requestedOutAmount.currencyCode
                } else if (item.exchangeWayType === 'BUY') {
                    // do nothing
                } else {
                    subtitle = item.outDestination
                }


                const order = {
                    orderId: item.orderId,
                    exchangeWayType: item.exchangeWayType,
                    status: item.status,
                    transactionDirection: direction,
                    createdAt: item.createdAt,
                    addressAmountPretty: amount,
                    outDestination: item.outDestination,
                    depositAddress: item.depositAddress,
                    subtitle
                }

                order.addressAmountPretty = BlocksoftPrettyNumbers.makeCut(order.addressAmountPretty).separated

                if (typeof order.id === 'undefined') {
                    order.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                }

                if (typeof item.orderJSON !== 'undefined' && item.orderJSON !== null) {
                    order.orderJSON = JSON.parse(item.orderJSON)
                }

                if (typeof item.payinUrl !== 'undefined' && item.payinUrl !== null) {
                    order.payinUrl = item.payinUrl
                }

                if (typeof item.payUpdateTime !== 'undefined') {
                    order.payUpdateTime = item.payUpdateTime
                }

                indexedOrders[order.orderId] = order
            }
        }

        if (transactions) {
            let hash
            for (hash in transactions) {
                const tx = transactions[hash]

                let added = false
                const bseOrderID = tx.bseOrderID
                const bseOrderID2 = tx.bseOrderInID
                const bseOrderID3 = tx.bseOrderInID
                if (bseOrderID && typeof indexedOrders[bseOrderID] !== 'undefined') {
                    added = indexedOrders[bseOrderID]
                }
                if (!added && bseOrderID2 && typeof indexedOrders[bseOrderID2] !== 'undefined') {
                    added = indexedOrders[bseOrderID2]
                }
                if (!added && bseOrderID3 && typeof indexedOrders[bseOrderID3] !== 'undefined') {
                    added = indexedOrders[bseOrderID3]
                }
                if (added) {
                    transactionsTmp.push({ ...tx, ...added })
                    delete indexedOrders[added.orderId]
                } else {
                    if (mainStore.selectedWallet.walletIsHideTransactionForFee !== null && +mainStore.selectedWallet.walletIsHideTransactionForFee === 1) {
                        if (tx.addressAmount === 0) {
                            if (tx.transactionOfTrusteeWallet === 1 && tx.transactionsOtherHashes !== '') {
                                // do nothing as its removed ones
                            } else {
                                continue
                            }
                        }
                    }
                    if (typeof tx.id === 'undefined') {
                        tx.id = hash
                    }
                    transactionsTmp.push(tx)
                }
            }
        }

        if (indexedOrders) {
            let orderId
            for (orderId in indexedOrders) {
                const order = indexedOrders[orderId]
                if (order) {
                    transactionsTmp.push(order)
                }
            }
        }

        transactionsTmp = transactionsTmp.sort((a, b) => {
            if (a.createdAt === b.createdAt) {
                if (a.transactionDirection === b.transactionDirection) {
                    return b.id - a.id
                }
                const sortingB = b.transactionDirection === 'outcome' ? 2 : b.transactionDirection === 'self' ? 1 : 0
                const sortingA = a.transactionDirection === 'outcome' ? 2 : a.transactionDirection === 'self' ? 1 : 0
                if (sortingA === sortingB) {
                    return b.id - a.id
                } else {
                    return sortingB - sortingA
                }
            }
            return new Date(b.createdAt) - new Date(a.createdAt)
        })


        return transactionsTmp
    }

    handleShowMore = () => {
        this.setState({ amountToView: this.state.amountToView + 5 })
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

    handleSetState = (key, value) => this.setState({ [key]: value })

    renderBalance = (cryptoCurrency, account) => {

        const { colors, isLight } = this.context

        const isSyncronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        const tmp = BlocksoftPrettyNumbers.makeCut(account.balancePretty, 7, 'AccountScreen/renderBalance').separated
        if (typeof tmp.split === 'undefined') {
            throw new Error('AccountScreen.renderBalance split is undefined')
        }
        const tmps = tmp.split('.')
        let balancePrettyPrep1 = tmps[0]
        let balancePrettyPrep2 = ''
        if (typeof tmps[1] !== 'undefined' && tmps[1]) {
            balancePrettyPrep1 = tmps[0] + '.'
            balancePrettyPrep2 = tmps[1]
        }

        if (isSyncronized) {
            return (
                <View style={styles.topContent__top}>
                    <View style={styles.topContent__title}>
                        <Text style={{ ...styles.topContent__title_first, color: colors.accountScreen.balanceColor }}>
                            {
                                balancePrettyPrep1
                            }
                        </Text>
                        <Text style={{ ...styles.topContent__title_last, color: colors.accountScreen.balanceColor }}>
                            {
                                balancePrettyPrep2 + ' ' + cryptoCurrency.currencySymbol
                            }
                        </Text>
                    </View>
                    <LetterSpacing text={account.basicCurrencySymbol + ' ' + account.basicCurrencyBalance}
                        textStyle={{ ...styles.topContent__subtitle, color: colors.accountScreen.balanceNotEquivalent }} letterSpacing={.5} />
                </View>
            )
        } else {
            return (
                <View style={styles.topContent__top}>
                    <View style={styles.topContent__title}>
                        <View style={{ height: Platform.OS === 'ios' ? 46 : 51, alignItems: 'center' }}>
                            <Loader size={30} color={colors.accountScreen.loaderColor} />
                        </View>
                    </View>
                </View>
            )
        }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    handleBtcAddressCopy = (address) => {
        const { cryptoCurrency, account } = this.props
        checkTransferHasError({
            walletHash: account.walletHash,
            currencyCode: cryptoCurrency.currencyCode,
            currencySymbol: cryptoCurrency.currencySymbol,
            addressFrom: address,
            addressTo: address
        })
        copyToClipboard(address)
        Toast.setMessage(strings('toast.copied')).show()
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    // renderBalanceHeader = (account, cryptoCurrency) => {

    //     const { colors, isLight } = this.context

    //     const tmp = BlocksoftPrettyNumbers.makeCut(account.balancePretty, 7, 'AccountScreen/renderBalance').separated

    //     if (typeof tmp.split === 'undefined') {
    //         throw new Error('AccountScreen.renderBalance split is undefined')
    //     }
    //     const tmps = tmp.split('.')
    //     let balancePrettyPrep1 = tmps[0]
    //     let balancePrettyPrep2 = ''
    //     if (typeof tmps[1] !== 'undefined' && tmps[1]) {
    //         balancePrettyPrep1 = tmps[0] + '.'
    //         balancePrettyPrep2 = tmps[1]
    //     }

    //     return (
    //         <>
    //             <View style={stl.topContent__top}>
    //                 <View style={stl.topContent__title}>
    //                     <Text style={{ ...stl.topContent__title_first, color: colors.accountScreen.balanceColor }}>
    //                         {
    //                             balancePrettyPrep1
    //                         }
    //                     </Text>
    //                     <Text style={{ ...stl.topContent__title_last, color: colors.accountScreen.balanceColor }}>
    //                         {
    //                             balancePrettyPrep2 + ' ' + cryptoCurrency.currencySymbol
    //                         }
    //                     </Text>
    //                 </View>
    //                 <LetterSpacing text={account.basicCurrencySymbol + ' ' + account.basicCurrencyBalance}
    //                     textStyle={{ ...stl.topContent__subtitle, color: colors.accountScreen.balanceNotEquivalent }} letterSpacing={.5} />
    //             </View>
    //             <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 24 }}>
    //                 <TransactionButton
    //                     action={this.handleReceive}
    //                     type={'receive'}
    //                     style={{ ...stl.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
    //                 />
    //                 <TransactionButton
    //                     action={this.handleBuy}
    //                     type={'buy'}
    //                     style={{ ...stl.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
    //                 />
    //                 <TransactionButton
    //                     action={this.handleSend}
    //                     type={'send'}
    //                     style={{ ...stl.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
    //                 />
    //             </View>
    //         </>
    //     )
    // }

    render() {
        // noinspection ES6MissingAwait
        firebase.analytics().setCurrentScreen('Account.AccountScreen')

        UpdateAccountListDaemon.pause()

        const { colors, isLight } = this.context
        const { mode, openTransactionList } = this.state
        const { mainStore, account, cryptoCurrency, exchangeStore, settingsStore } = this.props
        const { btcShowTwoAddress = 1 } = settingsStore.data
        const { amountToView, show } = this.state
        const transactions = account.transactions
        const address = account.address

        let transactionsToView = this.prepareTransactions(transactions, exchangeStore.exchangeOrders)
        let transactionsToViewLength = 0
        if (transactionsToView) {
            transactionsToViewLength = transactionsToView.length
            transactionsToView = transactionsToView.slice(0, this.state.amountToView)
        } else {
            transactionsToView = []
        }

        const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

        Log.log('AccountScreen.render amountToView ' + this.state.amountToView + ' transactionsToViewLength ' + transactionsToViewLength)
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

        let leftComponent
        let settingsComponent = null
        if (account.currencyCode === 'BTC') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }}
                onPress={() => this.accountSetting(account.currencyCode)}><View
                    style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear"
                        color={`#404040`} /></View></TouchableOpacity>
        } else if (account.currencyCode === 'USDT') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }}
                onPress={() => this.accountSetting(account.currencyCode)}><View
                    style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear"
                        color={`#404040`} /></View></TouchableOpacity>
        } else if (account.currencyCode === 'FIO') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }} onPress={() => NavStore.goNext('FioMainSettings')}>
                <View style={{ paddingVertical: 12 }}>
                    <IconAwesome size={20} name="gear" color={`#404040`} /></View></TouchableOpacity>
        } else if (account.currencyCode === 'XMR') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }}
                onPress={() => this.accountSetting(account.currencyCode)}><View
                    style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear"
                        color={`#404040`} /></View></TouchableOpacity>
        } else if (account.currencyCode === 'TRX') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }}
                onPress={() => this.accountSetting(account.currencyCode)}><View
                    style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear"
                        color={`#404040`} /></View></TouchableOpacity>
        }
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    rightType="close"
                    rightAction={this.closeAction}
                    title={strings('account.title').toUpperCase()}
                    setHeaderHeight={this.setHeaderHeight}
                    // ExtraView={() => this.renderBalanceHeader(mainStore.selectedAccount, cryptoCurrency)}
                    // scrollOffset={this.state.scrollOffset}
                />
                {/* <Navigation
                    title={strings('account.title').toUpperCase()}
                    isBack={false}
                    navigation={this.props.navigation}
                    closeAction={this.closeAction}
                /> */}
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
                        <View style={styles.topContent}>
                            <View style={stl.topContent__content}>
                                <View style={{ flexDirection: 'row' }} >
                                    <View style={{ marginTop: 16 }}>
                                        <TouchableOpacity style={{
                                            position: 'relative',
                                            padding: 20,
                                            paddingTop: 0,
                                            alignItems: 'center'
                                        }} onPress={() => this.handleOpenLink(shownAddress)}
                                            onLongPress={() => this.handleOpenLinkLongPress()}
                                            delayLongPress={5000}>
                                            <View style={{ position: 'relative', width: 50, height: 50 }}>
                                                <GradientView style={stl.topContent__icon} array={colors.accountScreen.containerBG}
                                                    start={styles.containerBG.start}
                                                    end={styles.containerBG.end} />
                                                <View style={stl.icon}>
                                                    <CurrencyIcon currencyCode={cryptoCurrency.currencyCode}
                                                        containerStyle={{ borderWidth: 0 }}
                                                        markStyle={{ top: 30 }}
                                                        textContainerStyle={{ bottom: -19 }}
                                                        textStyle={{ backgroundColor: 'transparent' }} />
                                                </View>
                                                <View style={{ ...stl.topContent__bottom__btn__shadow }}>
                                                    <View style={stl.topContent__bottom__btn__shadow__item} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ marginTop: 22 }}>
                                        <Text style={styles.currencyName}>{cryptoCurrency.currencyName}</Text>
                                        <TouchableOpacity style={styles.topContent__middle}
                                            onPress={() => this.handleBtcAddressCopy(shownAddress)}>
                                            <ToolTips showAfterRender={true} height={150}
                                                type={'ACCOUNT_SCREEN_ADDRESS_TIP'}
                                                cryptoCurrency={cryptoCurrency}
                                                mainComponentProps={{ address: shownAddress }}
                                                MainComponent={this.renderAddressTooltip} />
                                            <View onPress={() => this.handleBtcAddressCopy(shownAddress)}
                                                style={styles.copyBtn}>
                                                <Copy name="content-copy" size={15} color={'#939393'} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{...stl.settings, right: 0, position: 'absolute'}}>
                                        {typeof leftComponent !== 'undefined' ? leftComponent() : null}
                                    </View>
                                </View>
                                {this.renderBalance(cryptoCurrency, mainStore.selectedAccount)}
                            </View>
                            <GradientView style={stl.bg}
                                array={colors.accountScreen.containerBG} start={styles.containerBG.start}
                                end={styles.containerBG.end} />
                            <View style={stl.topContent__bg}>
                                <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
                            </View>
                        </View>
                        <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TransactionButton
                                text={strings('account.receive', { receive: strings('repeat.receive') })}
                                action={this.handleReceive}
                                type={'receive'}
                                style={{ ...stl.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
                            />
                            <TransactionButton
                                text={strings('dashboardStack.buy')}
                                action={this.handleBuy}
                                type={'buy'}
                                style={{ ...stl.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
                            />
                            <TransactionButton
                                text={strings('account.send')}
                                action={this.handleSend}
                                type={'send'}
                                style={{ ...stl.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
                            />
                        </View>
                        <View style={{
                            flex: 1,
                            alignItems: 'flex-start',
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
                                        account
                                    }} />
                            </View>
                            <View style={{ position: 'relative', width: '100%' }}>
                                <View style={{ position: 'relative', width: '100%', zIndex: 1 }}>
                                    {
                                        show ? transactionsToView.map((item, index) => {
                                            return <Transaction key={item.id} index={item.id}
                                                count={index}
                                                cards={mainStore.cards}
                                                transactions={transactionsToView}
                                                amountToView={amountToView}
                                                transaction={item}
                                                fioMemo={fioMemo[item.transactionHash]}
                                                account={account}
                                                cryptoCurrency={cryptoCurrency}
                                                dash={(transactionsToViewLength - 1 === index) ? this.renderDash : !this.renderDash}

                                            />
                                        }) : null
                                    }
                                </View>
                            </View>
                            {
                                this.state.amountToView < transactionsToViewLength ?
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore}>
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
                <GradientView style={stl.bottomButtons} array={colors.accountScreen.bottomGradient} start={styles.containerBG.start} end={styles.containerBG.end} />
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
        exchangeStore: state.exchangeStore,
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

const styles_ = {
    array: ['#f5f5f5', '#f5f5f5'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const stl = {
    bg: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 216,

        zIndex: 1,

        borderRadius: 16
    },
    topContent__content: {
        position: 'relative',
        zIndex: 2,
    },
    topContent__tag: {
        position: 'absolute',
        top: 0,
        right: 0,

        paddingLeft: 30,
        paddingBottom: 30,
        zIndex: 1
    },
    topContent__content__tag: {
        alignItems: 'center',

        width: 70,
        paddingVertical: 5,

        backgroundColor: '#8D51E4',
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    topContent__tag__text: {
        fontFamily: 'Montserrat-Semibold',
        fontSize: 12,
        color: '#f4f4f4'
    },
    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 206,
        borderRadius: 16,

        zIndex: 0
    },
    topContent__icon: {
        position: 'relative',

        width: 50,
        height: 50,

        borderRadius: 30,

        zIndex: 1
    },
    topContent__bottom__btn: {

        justifyContent: 'center',
        alignItems: 'center',

        width: 50,
        height: 50,

        borderRadius: 50
    },
    topContent__bottom__btn__white: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: 50,
        height: 50,

        backgroundColor: '#fff',
        borderRadius: 50,

        zIndex: 1
    },
    topContent__bottom__btn__wrap: {
        position: 'relative',

        width: 50,
        height: 50,

        borderRadius: 50,

        zIndex: 2
    },
    topContent__bottom__btn__line: {
        width: 16,
        height: 1.5,

        marginTop: 2,

        backgroundColor: '#864DD9'
    },
    topContent__bottom__btn__shadow: {
        position: 'absolute',
        top: 2,
        // left: 3,

        width: 40,
        height: 40,

        zIndex: 0,

        borderRadius: 30
    },
    topContent__bottom__btn__shadow__item: {
        width: 50,
        height: 46,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,

        backgroundColor: '#fff',
        borderRadius: 100,

        zIndex: 0
    },
    topContent__bottom__btn__text: {
        marginTop: 5,

        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular'
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 72,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    bottomButton: {
        flex: 1
    },
    bottomButtons__content: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        paddingTop: 20,
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 15
    },
    bottomButton__wrap: {},
    bottomButton__item: {
        position: 'relative',


        height: 44,

        backgroundColor: '#fff',

        borderRadius: 14
    },
    bottomButton__content: {
        position: 'relative',

        flex: 1,

        alignItems: 'center',
        justifyContent: 'center',

        borderRadius: 14,

        zIndex: 2
    },
    bottomButtons__shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    bottomButtons__shadow__item: {
        height: 34,

        marginHorizontal: 0,
        marginTop: 5,

        backgroundColor: '#fff',

        borderRadius: 14,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
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
    button: {
        borderRadius: 10,
        borderWidth: 2,
        width: '30%',
        height: 60,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonHeader: {
        borderRadius: 10,
        borderWidth: 2,
        width: '30%',
        height: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    settings: {
        marginRight: 20,
        marginTop: 10
    },
    icon: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 3
    },

    topContent__top: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 6
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 16,
    },
    topContent__title_first: {
        height: 34,
        fontSize: 30,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 30
    },
    topContent__title_last: {
        height: 32,
        fontSize: 24,
        fontFamily: 'Montserrat-Medium',
        lineHeight: 28,
        opacity: 1,
    },
    topContent__subtitle: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        textAlign: 'center'
    },
}