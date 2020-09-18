/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableOpacity, ScrollView, Linking, RefreshControl, Platform } from 'react-native'

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
import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'

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
import CustomIcon from "../../components/elements/CustomIcon"
import UIDict from "../../services/UIDict/UIDict"
import AsyncStorage from '@react-native-community/async-storage'


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
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        UpdateOneByOneDaemon._canUpdate = false
        try {
            styles = Theme.getStyles().accountScreenStyles

            setTimeout(() => {
                this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
                    if(this.state.firstCall) {
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

    handleReceive = async () => {
        const cryptoCurrency = this.props.cryptoCurrency
        const { address } = this.props.account
        // noinspection ES6MissingAwait
        checkTransferHasError({ currencyCode: cryptoCurrency.currencyCode, currencySymbol: cryptoCurrency.currencySymbol, address })
        NavStore.goNext('ReceiveScreen')
    }

    handleSetMode = () => {
        this.setState({
            mode: this.state.mode === 'TRANSACTIONS' ? 'SETTINGS' : 'TRANSACTIONS'
        })
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
            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({force : true, currencyCode : account.currencyCode, source: 'ACCOUNT_REFRESH'})
        } catch (e) {
            Log.errDaemon('AccountScreen handleRefresh error updateAccountBalanceAndTransactions ' + e.message)
        }

        try {
            await UpdateAccountListDaemon.updateAccountListDaemon({force : true, currencyCode : account.currencyCode, source: 'ACCOUNT_REFRESH'})
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
        const diff = now - CACHE_ASKED*1
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
            description: text
        })
    }

    renderTooltip = (props) => {

        const { cryptoCurrency, account } = props

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        return (
            <View>
                <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                {
                    !props.transactionsToView.length ?
                        <View>
                            {isSynchronized ? <Text style={styles.transaction__empty_text}>{strings('account.noTransactions')}</Text> : <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginLeft: 30 }}><Loader size={14} color={'#999999'}/><Text style={{ ...styles.transaction__empty_text, ...{ marginLeft: 10, marginTop: 0 } }}>{strings('homeScreen.synchronizing')}</Text></View>}
                        </View>
                        : null
                }
                <View style={stl.scan}>
                    <Text style={stl.scan__text}>{strings('account.scan')}</Text>
                    <Text style={{...stl.scan__text, color: '#404040'}}>{new Date(this.props.account.balanceScanTime*1000).toLocaleTimeString().slice(0,8)}</Text>
                </View>
            </View>
        )

    }

    renderDash = () => {
        this.setState({dash: this.state.dash})
    }

    prepareTransactions = (transactions, exchangeOrders) => {

        const { mainStore } = this.props
        const walletCashBackToken = CashBackUtils.getWalletToken()


        let transactionsTmp = []
        const unique = {}
        const uniqueOrderId = {}
        const byIds = {}
        let byIdsLength = 0

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

                if (transactions) {
                    let added = false

                    const hash2 = item.outTxHash
                    if (hash2 && typeof transactions[hash2] !== 'undefined') {
                        if (typeof unique[hash2] === 'undefined') {
                            if (typeof uniqueOrderId[item.orderId] === 'undefined') {
                                uniqueOrderId[item.orderId] = 1
                                transactionsTmp.push({ ...transactions[hash2], ...order })
                                unique[hash2] = 1
                                added = true
                            }
                        }
                    }

                    const hash = item.inTxHash
                    if (hash && typeof transactions[hash] !== 'undefined') {
                        if (typeof unique[hash] === 'undefined') {
                            if (typeof uniqueOrderId[item.orderId] === 'undefined') {
                                uniqueOrderId[item.orderId] = 1
                                transactionsTmp.push({ ...transactions[hash], ...order })
                                unique[hash] = 1
                                added = true
                            }

                        }
                    }

                    if (!added) {
                        byIds[item.orderId + ''] = order
                        byIdsLength++
                    }
                } else {
                    order.blockConfirmations = 0
                    if (typeof uniqueOrderId[item.orderId] === 'undefined') {
                        uniqueOrderId[item.orderId] = 1
                        transactionsTmp.push(order)
                    }
                }
            }
        }

        if (transactions) {
            let hash
            for (hash in transactions) {
                if (typeof unique[hash] !== 'undefined') continue
                const tx = transactions[hash]
                let added = false
                if (byIdsLength > 0) {
                    if (typeof tx.transactionJson !== 'undefined' && tx.transactionJson && typeof tx.transactionJson.bseOrderID !== 'undefined') {
                        const tmpKey = tx.transactionJson.bseOrderID + ''
                        if (typeof byIds[tmpKey] !== 'undefined') {
                            const item = byIds[tmpKey]
                            if (typeof uniqueOrderId[item.orderId] === 'undefined') {
                                uniqueOrderId[item.orderId] = 1
                                transactionsTmp.push({ ...tx, ...item})
                                added = true
                                delete byIds[tmpKey]
                                byIdsLength--
                            }
                        }
                    }
                }
                if (!added) {
                    if (mainStore.selectedWallet.walletIsHideTransactionForFee !== null && +mainStore.selectedWallet.walletIsHideTransactionForFee === 1) {
                        if (tx.addressAmount === 0) {
                            continue
                        }
                    }
                    if (typeof tx.id === 'undefined') {
                        tx.id = hash
                    }
                    transactionsTmp.push(tx)
                }
            }
        }

        if (byIdsLength > 0) {
            let orderId
            for (orderId in byIds) {
                const order = byIds[orderId]
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
        // @misha could be unified
        const addressPrep = address.slice(0, 10) + '...' + address.slice(address.length - 8, address.length)
        return (
            <View style={styles.topContent__address}>
                <LetterSpacing text={addressPrep} textStyle={styles.topContent__address} letterSpacing={1}/>
            </View>
        )
    }

    handleSetState = (key, value) => this.setState({ [key]: value })

    renderBalance = (cryptoCurrency, account) => {
        const isSyncronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        const tmps = BlocksoftPrettyNumbers.makeCut(account.balancePretty, 7, 'AccountScreen/renderBalance').separated.split('.')
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
                        <Text style={styles.topContent__title_first}>
                            {
                                balancePrettyPrep1
                            }
                        </Text>
                        <Text style={styles.topContent__title_last}>
                            {
                                balancePrettyPrep2 + ' ' + cryptoCurrency.currencySymbol
                            }
                        </Text>
                    </View>
                    <LetterSpacing text={account.basicCurrencySymbol + ' ' + account.basicCurrencyBalance} textStyle={styles.topContent__subtitle} letterSpacing={.5}/>
                </View>
            )
        } else {
            return (
                <View style={styles.topContent__top}>
                    <View style={styles.topContent__title}>
                        <View style={{ height: Platform.OS === 'ios' ? 46 : 51, alignItems: 'center' }}>
                            <Loader size={30} color={'#999'}/>
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
        const cryptoCurrency = this.props.cryptoCurrency
        checkTransferHasError({ currencyCode: cryptoCurrency.currencyCode, currencySymbol: cryptoCurrency.currencySymbol, address })

        copyToClipboard(address)
        Toast.setMessage(strings('toast.copied')).show()
    }

    renderBTCBlock = () => {
        const { account } = this.props
        let segwitPrep = ''
        let legacyPrep = ''
        if (typeof account.segwitAddress !== 'undefined' && account.segwitAddress) {
            segwitPrep = account.segwitAddress.substr(0, 5) + '...' + account.segwitAddress.substr(- 5)
        }
        if (typeof account.legacyAddress !== 'undefined' && account.legacyAddress) {
            legacyPrep = account.legacyAddress.substr(0, 5) + '...' + account.legacyAddress.substr(-5)
        }
        return (
            <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop:20 }}>
                <TouchableOpacity style={{ flex: 1, marginHorizontal: 20, marginRight: 10, justifyContent: 'center', height: 60 }} onPress={() => this.handleBtcAddressCopy(account.segwitAddress)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15, position: 'relative', zIndex: 2 }}>
                        <View style={{ paddingRight: 10 }}>
                            <Text style={{
                                marginRight: 8,

                                fontFamily: 'Montserrat-Bold',
                                fontSize: 12,
                                color: '#404040'
                            }}>
                                SegWit
                            </Text>
                            <LetterSpacing text={segwitPrep} textStyle={styles.topContent__address} letterSpacing={1}/>
                        </View>
                        <Copy name="content-copy" size={15} color={'#939393'}/>
                    </View>
                    <View style={[stl.topContent__bg, { height: 45 }]}>
                        <View style={styles.shadow}/>
                    </View>
                    <GradientView style={[stl.bg, { height: 60 }]} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}/>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, marginHorizontal: 20, marginLeft: 10, justifyContent: 'center', height: 60 }} onPress={() => this.handleBtcAddressCopy(account.legacyAddress)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15, position: 'relative', zIndex: 2 }}>
                        <View style={{ paddingRight: 10 }}>
                            <Text style={{
                                marginRight: 8,

                                fontFamily: 'Montserrat-Bold',
                                fontSize: 12,
                                color: '#404040'
                            }}>
                                Legacy
                            </Text>
                            <LetterSpacing text={legacyPrep} textStyle={styles.topContent__address} letterSpacing={1}/>
                        </View>
                        <Copy name="content-copy" size={15} color={'#939393'}/>
                    </View>
                    <View style={[stl.topContent__bg, { height: 45 }]}>
                        <View style={styles.shadow}/>
                    </View>
                    <GradientView style={[stl.bg, { height: 60 }]} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}/>
                </TouchableOpacity>
            </View>
        )
    }

    render() {
        // noinspection ES6MissingAwait
        firebase.analytics().setCurrentScreen('Account.AccountScreen')

        UpdateAccountListDaemon.pause()

        const { mode, openTransactionList } = this.state
        const { mainStore, account, cryptoCurrency, exchangeStore, settingsStore } = this.props
        const { btcShowTwoAddress = 0 } = settingsStore.data
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
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }} onPress={this.handleSetMode}><View style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear" color={`#404040`}/></View></TouchableOpacity>
            settingsComponent = <SettingsBTC containerStyle={{ height: mode === 'SETTINGS' ? 'auto' : 0, overflow: 'hidden' }} wallet={mainStore.selectedWallet}/>
        } else if (account.currencyCode === 'USDT') {
            leftComponent = () => <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }} onPress={this.handleSetMode}><View style={{ paddingVertical: 12 }}><IconAwesome size={20} name="gear" color={`#404040`}/></View></TouchableOpacity>
            settingsComponent = <SettingsUSDT containerStyle={{ height: mode === 'SETTINGS' ? 'auto' : 0, overflow: 'hidden' }} wallet={mainStore.selectedWallet} account={account}/>
        }
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={`${strings('account.title')} ${cryptoCurrency.currencySymbol}`}
                    isBack={false}
                    navigation={this.props.navigation}
                    closeAction={this.closeAction}
                    LeftComponent={leftComponent}
                />
                <ScrollView
                    style={styles.wrapper__scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                        />
                    }>
                    <View style={styles.wrapper__content}>
                        <View style={[styles.topContent, cryptoCurrency.currencyCode === 'BTC' && +btcShowTwoAddress ? { height: 190 } : null]}>
                            <View style={stl.topContent__content}>
                                {this.renderBalance(cryptoCurrency, mainStore.selectedAccount)}
                                {
                                    account.currencyCode !== 'BTC' || (account.currencyCode === 'BTC' && !(+btcShowTwoAddress))  ?
                                        <TouchableOpacity style={styles.topContent__middle} onPress={() => this.handleBtcAddressCopy(shownAddress)}>
                                            <ToolTips showAfterRender={true} height={150} type={'ACCOUNT_SCREEN_ADDRESS_TIP'} cryptoCurrency={cryptoCurrency} mainComponentProps={{ address: shownAddress }} MainComponent={this.renderAddressTooltip}/>
                                            <View onPress={() => this.handleBtcAddressCopy(shownAddress)} style={styles.copyBtn}>
                                                <Copy name="content-copy" size={15} color={'#939393'}/>
                                            </View>
                                        </TouchableOpacity> : null
                                }
                                <View style={[styles.topContent__bottom, cryptoCurrency.currencyCode === 'BTC' && +btcShowTwoAddress ? { marginTop: 30 } : null]}>
                                    <TouchableOpacity style={{ position: 'relative', padding: 20, paddingTop: 0, alignItems: 'center' }} onPress={() => this.handleOpenLink(shownAddress)} onLongPress={() => this.handleOpenLinkLongPress()} delayLongPress={5000}>
                                        <View style={{ position: 'relative', width: 50, height: 50 }}>
                                             <GradientView style={stl.topContent__icon} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}/>
                                             <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, bottom: 0, right: 0, zIndex: 3 }}>
                                                 <CurrencyIcon currencyCode={cryptoCurrency.currencyCode}
                                                              containerStyle={{ borderWidth: 0 }}
                                                              markStyle={{ top: 30 }}
                                                              textContainerStyle={{ bottom: -19 }}
                                                              textStyle={{ backgroundColor: 'transparent' }}/>
                                             </View>
                                             <View style={{ ...stl.topContent__bottom__btn__shadow }}>
                                                <View style={stl.topContent__bottom__btn__shadow__item}/>
                                             </View>
                                        </View>
                                    </TouchableOpacity>
                                {/* </View> */}
                                {/* <View style={{...styles.topContent__bottom, marginTop: -70, paddingLeft: 100}}> */}
                                    <TouchableOpacity style={{ position: 'relative', padding: 20, paddingTop: 0, alignItems: 'center' }} onPress={() => this.handleRefresh()}>
                                        <View style={{ position: 'relative', width: 50, height: 50 }}>
                                             <GradientView style={stl.topContent__icon} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}/>
                                             <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, bottom: 0, right: 0, zIndex: 3 }}>
                                                 <CustomIcon style={{...styles.block__icon, marginBottom: 2, color: color}} size={25} name='reload'/>
                                             </View>
                                             <View style={{ ...stl.topContent__bottom__btn__shadow }}>
                                                <View style={stl.topContent__bottom__btn__shadow__item}/>
                                             </View>
                                        </View>
                                    </TouchableOpacity>
                                 </View>
                            </View>
                            <GradientView style={[stl.bg, cryptoCurrency.currencyCode === 'BTC' && +btcShowTwoAddress ? { height: 160 } : null]} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}/>
                            <View style={[stl.topContent__bg, cryptoCurrency.currencyCode === 'BTC' && +btcShowTwoAddress ? { height: 150 } : null]}>
                                <View style={styles.shadow}/>
                            </View>
                        </View>
                        { cryptoCurrency.currencyCode === 'BTC' && +btcShowTwoAddress ? this.renderBTCBlock() : null}
                        <View style={{ flex: 1, alignItems: 'flex-start', height: mode === 'TRANSACTIONS' ? 'auto' : 0, overflow: 'hidden' }}>
                            <View>
                                 <ToolTips type={'ACCOUNT_SCREEN_TRANSACTION_TIP'}
                                          height={100}
                                          MainComponent={this.renderTooltip}
                                          nextCallback={this.nextCallback}
                                          mainComponentProps={{
                                                        transactionsToView,
                                                        cryptoCurrency,
                                                        account
                                          }}/>
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
                                                                handleSetState={this.handleSetState}
                                                                openTransactionList={openTransactionList}
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
                                        <TouchableOpacity style={{...styles.showMore, marginBottom: Platform.OS === 'ios' ? 100 : 70}} onPress={this.handleShowMore}>
                                            <Text style={[styles.showMore__btn, { color: '#404040' }]}>
                                                {strings('account.showMore')}
                                            </Text>
                                            <Ionicons name='ios-arrow-down' size={12} color='#404040'/>
                                        </TouchableOpacity>
                                    </View> : <View style={{ marginBottom: Platform.OS === 'ios' ? 100 : 60 }}/>
                            }
                        </View>
                        {settingsComponent}
                    </View>
                </ScrollView>
                <GradientView style={stl.bottomButtons} array={['#ffffff00', '#d7d7d7']} start={styles.containerBG.start} end={styles.containerBG.end}>
                    <View style={[stl.bottomButtons__content, { paddingLeft: transactionsToView.length ? 48 : 15 }]}>
                        <View style={stl.bottomButton}>
                            <TouchableOpacity style={stl.bottomButton__wrap} onPress={this.handleSend}>
                                <View style={stl.bottomButton__item}>
                                    <View style={[stl.bottomButton__content, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#404040' }]}>
                                        <Text style={{ fontFamily: 'SFUIDisplay-Semibold', color: '#fff' }}>{strings('account.send')}</Text>
                                        <View style={{ alignItems: 'center' }}>
                                            <View style={{ marginTop: -4 }}>
                                                <Feather name={'arrow-up-right'} style={{ color: '#fff', fontSize: 20 }}/>
                                            </View>
                                            <View style={{ width: 12, marginTop: -1, height: 1.4, backgroundColor: '#fff' }}/>
                                        </View>
                                    </View>
                                    <View style={stl.bottomButtons__shadow}>
                                        <View style={stl.bottomButtons__shadow__item}/>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ width: 15 }}/>
                        <View style={stl.bottomButton}>
                            <TouchableOpacity style={stl.bottomButton__wrap} onPress={this.handleReceive}>
                                <View style={stl.bottomButton__item}>
                                    <View style={[stl.bottomButton__content, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#404040' }]}>
                                        <Text style={{ fontFamily: 'SFUIDisplay-Semibold', color: '#fff' }}>{strings('account.receive', { receive: strings('repeat.receive') })}</Text>
                                        <View style={{ alignItems: 'center' }}>
                                            <View style={{ marginTop: -4 }}>
                                                <Feather name={'arrow-down-left'} style={{ color: '#fff', fontSize: 20 }}/>
                                            </View>
                                            <View style={{ width: 12, marginTop: -1, height: 1.4, backgroundColor: '#fff' }}/>
                                        </View>
                                    </View>
                                    <View style={stl.bottomButtons__shadow}>
                                        <View style={stl.bottomButtons__shadow__item}/>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </GradientView>
            </GradientView>
        )
    }
}

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
        height: 195,

        zIndex: 1,

        borderRadius: 16
    },
    topContent__content: {
        position: 'relative',
        zIndex: 2,
        borderRadius: 16
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
        height: 185,
        borderRadius: 16,

        zIndex: 0
    },
    topContent__icon: {
        position: 'relative',

        width: 50,
        height: 50,

        backgroundColor: '#fff',
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
        top: 9,
        left: 3,

        width: 44,
        height: 44,

        zIndex: 0,

        borderRadius: 30
    },
    topContent__bottom__btn__shadow__item: {
        width: 44,
        height: 40,

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
    scan:{
        marginLeft: 31,
        marginBottom: 10,
        flexDirection: 'row'
    },
    scan__text:{
        color: '#999999',
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 12,
        lineHeight: 14,
    }
}
