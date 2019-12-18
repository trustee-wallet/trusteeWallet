import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Linking, RefreshControl, Dimensions, Platform } from 'react-native'

import Swipeable from 'react-native-swipeable'
import { TabView } from 'react-native-tab-view'


import Button from '../../components/elements/Button'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import ButtonIcon from '../../components/elements/ButtonIcon'
import NavStore from '../../components/navigation/NavStore'
import ToolTips from '../../components/elements/ToolTips'

import Orders from './elements/Orders'

import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { capitalize, copyToClipboard, normalizeWithDecimals } from '../../services/utils'

import { clearSendData, setSendData } from '../../appstores/Actions/SendActions'
import { setLoaderStatus, setSelectedAccount } from '../../appstores/Actions/MainStoreActions'

import { strings } from '../../services/i18n'

import { showModal } from '../../appstores/Actions/ModalActions'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

import BlocksoftInvoice from '../../../crypto/actions/BlocksoftInvoice/BlocksoftInvoice'

import firebase from 'react-native-firebase'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

import updateAccountBalanceDaemon from '../../services/Daemon/classes/UpdateAccountTransactions'
import updateAccountTransactionsDaemon from '../../services/Daemon/classes/UpdateAccountBalance'
import updateExchangeOrdersDaemon from '../../services/Daemon/classes/UpdateExchangeOrders'

import Toast from '../../services/Toast/Toast'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'

import Theme from '../../themes/Themes'
import AccountActions from '../../appstores/Actions/AccountActions'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
let styles

class Account extends Component {

    constructor(props) {
        super(props)
        this.state = {
            balance: '0.0',
            transactions: [],
            refreshing: false,
            selectedTransactionHash: null,
            selectedIndex: null,
            selectedHistory: 0,

            showTransaction: false,
            dataLength: 0,
            swipeEnable: true,

            amountToView: 10,
            index: 0,
            routes: [
                { key: 'first', title: 'First' },
                { key: 'second', title: 'Second' },
            ],

            isBalanceChanged: false,
            isTransactionChanged: false
        }

        this.ordersRef = React.createRef()
    }

    async componentWillMount() {
        try {
            styles = Theme.getStyles().accountScreenStyles

            const { balanceProvider } = this.props.account

            this.setState({
                balanceProvider,
            })

            await updateAccountBalanceDaemon.forceDaemonUpdate()
            await updateExchangeOrdersDaemon.forceDaemonUpdate()
            await updateAccountTransactionsDaemon.forceDaemonUpdate()
        } catch (e) {
            Log.err('AccountScreen.componentDidMount' + e.message)
        }
    }

    componentDidMount() {
        try {
            this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {

                setTimeout(() => {
                    const param = this.props.navigation.getParam('accountScreenParam')

                    this.handleOnIndexChanged(typeof param != 'undefined' && param.isOrdersActive ? 1 : 0)
                }, 100)
            })
        } catch (e) {
            Log.err('AccountScreen.componentDidMount' + e.message)
        }
    }

    async componentWillReceiveProps(props) {

        // const { account } = props
        //
        // Log.log(`Account.AccountScreen got props`, account)
        //
        // if (Object.keys(account).length != 0 && typeof account.transactions != 'undefined') {
        //
        //     if(this.props.account.balance !== props.account.balance){
        //         this.setState({
        //             isBalanceChanged: true,
        //         })
        //     }
        //
        //     const isUnconfirmed = props.account.transactions.find(item => typeof item.block_confirmations == 'undefined')
        //
        //     if((this.props.account.transactions.length !== props.account.transactions.length) || typeof isUnconfirmed != 'undefined' ){
        //         this.setState({
        //             isTransactionChanged: true
        //         })
        //     }
        //
        //     if(this.state.isBalanceChanged && this.state.isTransactionChanged){
        //         console.log('balancePretty2', account.balancePretty)
        //         this.setState({
        //             isBalanceChanged: false,
        //             isTransactionChanged: false,
        //             balance: account.balancePretty ? account.balancePretty.toString() : '0.0',
        //             balanceProvider : account.balanceProvider,
        //             transactions: account.transactions
        //         })
        //     }
        //
        //     if(!this.state.isBalanceChanged && !this.state.isTransactionChanged){
        //         this.setState({
        //             transactions: account.transactions
        //         })
        //     }
        //
        // }
    }

    handleLink = (data) => {

        const { currencyExplorerTxLink } = this.props.cryptocurrency
        const { address } = data

        Linking.canOpenURL(`${currencyExplorerTxLink}${address}`).then(supported => {
            if (supported) {
                Linking.openURL(`${currencyExplorerTxLink}${address}`)
            } else {
                Log.err('Account.AccountScreen Dont know how to open URI', `${currencyExplorerTxLink}${address}`)
            }
        })
    }

    handleReceive = async () => {
        if (this.props.account.currency_code === 'BTC_LIGHT') {
            //@misha todo view where will be entered
            BlocksoftInvoice.setCurrencyCode(this.props.account.currency_code).setAddress(this.props.account.address).setAdditional(this.props.account.account_json).setAmount(900).setMemo('ksu is testing6')
            let res = await BlocksoftInvoice.createInvoice()
            //@misha todo view with this hash qr
            console.log('should open view with invoice tx hash and qr', res.hash)
            copyToClipboard(res.hash)
            Toast.setMessage(strings('toast.copied')).show()
        } else {
            NavStore.goNext('ReceiveScreen')
        }
    }

    handleSend = () => {
        clearSendData()
        NavStore.goNext('SendScreen')
    }

    handleRefresh = async () => {

        this.setState({
            refreshing: true
        })

        await updateAccountBalanceDaemon.forceDaemonUpdate()

        await updateExchangeOrdersDaemon.forceDaemonUpdate()
        await updateAccountTransactionsDaemon.forceDaemonUpdate()

        await setSelectedAccount()

        this.handleOnIndexChanged(this.state.index)

        this.setState({
            refreshing: false
        })
    }

    handleModal = () => {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.settings.soon'),
            description: strings('modal.settings.soonDescription')
        })
    }

    handleReplaceTransaction = (transaction) => {

        const { address_amount: value, address_to } = transaction

        setSendData({
            sendType: 'REPLACE_TRANSACTION',

            disabled: false,
            address: address_to,
            value: BlocksoftPrettyNumbers.setCurrencyCode(this.props.cryptocurrency.currencyCode).makePrettie(value),

            account: this.props.account,
            cryptocurrency: this.props.cryptocurrency,

            description: strings('send.description'),
            useAllFunds: false
        })

        NavStore.goNext('SendScreen')
    }

    handleOpenLink = () => {

        const { currencyExplorerLink } = this.props.cryptocurrency
        const { address } = this.props.account

        Linking.canOpenURL(`${currencyExplorerLink}${address}`).then(supported => {
            if (supported) {
                Linking.openURL(`${currencyExplorerLink}${address}`)
            } else {
                Log.err('Account.AccountScreen Dont know how to open URI', `${currencyExplorerLink}${address}`)
            }
        })
    }

    handleOnSwipeStart = (param) => {

        const { selectedIndex } = this.state

        if (param.transaction.transaction_hash != this.state.selectedTransactionHash) {
            selectedIndex != null ? this[`swipeable${this.state.selectedIndex}`].recenter() : null
            this.setState({
                selectedTransactionHash: param.transaction.transaction_hash,
                selectedIndex: param.index
            })
        }
    }

    handleOnRightActionDeactivate = () => {
        if (this.state.selectedTransactionHash != null) {
            this.setState({
                selectedTransactionHash: null,
                selectedIndex: param.index
            })
        }
    }

    handleCopyAddress = () => {
        copyToClipboard(this.props.account.address)

        Toast.setMessage(strings('toast.copied')).show()
    }

    handleScroll = (event) => {
        if(this.state.swipeEnable && event.nativeEvent.contentOffset.y > 200){
            this.setState({
                swipeEnable: false
            })
        } else if(!this.state.swipeEnable && event.nativeEvent.contentOffset.y < 200){
            this.setState({
                swipeEnable: true
            })
        }
    }

    handleOnIndexChanged = (index) => {

        try {
            this.ordersRef.setAmountToView()
        } catch (e) {}

        this.setState({
            amountToView: 10,
            index,
            dataLength: index ? this.ordersRef.getExchangeOrdersLength() : this.state.transactions.length,
        })
    }

    renderScene = ({ route, transactions }) => {

        switch (route.route.key) {
            case 'first':
                return this.renderTransaction(transactions)
            case 'second':
                return <Orders ref={ orders => this.ordersRef = orders } amountToView={this.state.amountToView} currency={this.props.cryptocurrency} />
            default:
                return null
        }
    }

    handleShowMore = () => this.setState({ amountToView: this.state.amountToView + 10 })

    renderTooltip = (props) => {

        return (
            <View>
                <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                { !props.transactions.length ? <Text style={styles.transaction__empty_text}>{ strings('account.noTransactions') }</Text> : null }
            </View>
        )
    }

    nextCallback = () => {
        this.handleOnIndexChanged(1)
    }

    renderTransaction = (transactions) => {

        const { selectedTransactionHash, amountToView } = this.state
        const { localCurrencySymbol } = this.props.fiatRatesStore

        const cryptocurrency = JSON.parse(JSON.stringify(this.props.cryptocurrency))

        return (
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <View>
                    <ToolTips type={'ACCOUNT_SCREEN_TRANSACTION_TIP'}
                              height={100}
                              MainComponent={this.renderTooltip}
                              nextCallback={this.nextCallback}
                              mainComponentProps={{ transactions }}/>
                </View>
                {
                    transactions.length ? transactions.map((item, index) => {
                        let date = new Date(item.created_at)
                        date = date.toString()
                        date = date.split(' ')

                        let address = (item.transaction_direction == 'outcome') ? item.address_to : item.address_from
                        address = address == null ? 'address null!!!' : address
                        let prettieAddress = address.slice(0, 4) + '...' + address.slice(address.length - 4, address.length)
                        let prettieAmount = 0
                        try {
                            prettieAmount = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(item.address_amount)
                        } catch (e) {
                            Log.err('AccountScreen error ' + e.message + ' with item ' + JSON.stringify(item))
                        }
                        prettieAmount = +prettieAmount
                        prettieAmount = parseFloat(prettieAmount.toFixed(5))

                        let blockConfirmations
                        const ifTransactionOfTW = item.transaction_of_trustee_wallet && item.transaction_of_trustee_wallet === 1
                        const transactionStatus = typeof(item.transaction_status) !== 'undefined' ? item.transaction_status : 'new'

                        if (typeof item.block_confirmations != 'undefined' && item.block_confirmations > 0) {
                            if (item.block_confirmations > 20) {
                                blockConfirmations = '20+'
                            } else {
                                blockConfirmations = item.block_confirmations
                            }
                        }

                        typeof blockConfirmations == 'undefined' ? blockConfirmations = 0 : null

                        //@misha todo view improvement

                        //console.log(item)

                        let invoiceMemo = typeof item.transaction_json === 'undefined' || item.transaction_json == null || typeof item.transaction_json.memo === 'undefined' ? 'no title' : item.transaction_json.memo
                        if (item.transaction_direction === 'income' && item.block_hash === 'user_invoice') {
                           if (item.transaction_status === 'pay_waiting' || item.transaction_status === 'new' ) {
                               console.log('could be destination address shown qr liked or passed by messangers etc to anyone to pay', item.transaction_hash)
                           }
                        }


                        return index < amountToView ? (
                            <View style={{ width: '100%', position: 'relative', paddingBottom: Platform.OS === 'ios' ? 5 : 0, overflow: 'visible' }} key={index}>
                                <View style={{ position: 'relative', zIndex: 3 }}>
                                    {
                                        item.transaction_direction == 'outcome' ?
                                            <View
                                                onRef={ref => this[`swipeable${index}`] = ref}
                                                rightButtons={[
                                                    <TouchableOpacity style={{ width: '100%', height: '100%' }}
                                                                      onPress={() => this.handleModal(item)}>
                                                    </TouchableOpacity>
                                                ]}
                                                onSwipeMove={() => this.handleOnSwipeStart({ transaction: item, index })}
                                                onLeftActionDeactivate={() => this.handleOnRightActionDeactivate()}>

                                                <View style={selectedTransactionHash == item.transaction_hash ? { ...styles.transaction__item, ...styles.transaction__item_active } : { ...styles.transaction__item }}>
                                                    <View style={{ minWidth: 65 }}>
                                                        <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                            {date[1] + ' ' + date[2]}
                                                        </Text>
                                                        <Text style={styles.transaction__subtext}>
                                                            { prettieAddress }
                                                        </Text>
                                                    </View>
                                                    <GradientView style={styles.circle} array={blockConfirmations ? circle.array : circle.array_new} start={circle.start} end={circle.end}/>
                                                    <TouchableOpacity style={styles.transaction__content} onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                        <View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={[styles.transaction__expand, !blockConfirmations ? styles.transaction__new : null ]}>{capitalize(item.transaction_direction)}</Text>
                                                                {
                                                                    ifTransactionOfTW ?
                                                                        <Image
                                                                            style={{ width: 9, height: 10, marginTop: 1, marginLeft: 5 }}
                                                                            resizeMode='stretch'
                                                                            source={require('../../assets/images/logo.png')} /> : null
                                                                }

                                                            </View>
                                                            { item.block_hash !== 'paid_invoice' ?
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { strings(`account.transactionStatuses.${!transactionStatus ? 'new' : transactionStatus}`) }
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { ' | '}
                                                                </Text>
                                                                <View style={{ marginRight: 3, marginTop: 1 }}>
                                                                    <MaterialCommunity name="progress-check" size={12} color={"#999999"} />
                                                                </View>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { blockConfirmations }
                                                                </Text>
                                                            </View>
                                                                :
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { invoiceMemo }
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { ' | '}
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { strings(`account.transactionStatuses.${!transactionStatus ? 'new' : transactionStatus}`) }
                                                                </Text>
                                                            </View>
                                                            }
                                                        </View>
                                                        <View>
                                                            <Text style={[styles.transaction__expand, styles.textAlign_right, !blockConfirmations ? styles.transaction__new : null]}>- {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                            <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>{ localCurrencySymbol } { FiatRatesActions.toLocalCurrency(prettieAmount * cryptocurrency.currency_rate_usd) }</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            :
                                            <View style={selectedTransactionHash == item.transaction_hash ? { ...styles.transaction__item, ...styles.transaction__item_active } : { ...styles.transaction__item }}>
                                                <View style={{ minWidth: 65 }}>
                                                    <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                        {date[1] + ' ' + date[2]}
                                                    </Text>
                                                    <Text style={{ ...styles.transaction__subtext }}>{prettieAddress}</Text>
                                                </View>
                                                <GradientView style={styles.circle} array={blockConfirmations ? circle.array_ : circle.array_new} start={circle.start} end={circle.end}/>
                                                <TouchableOpacity style={styles.transaction__content} onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                    <View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={[ styles.transaction__income, !blockConfirmations ? styles.transaction__new : null ]}>{capitalize(item.transaction_direction)}</Text>
                                                            {
                                                                ifTransactionOfTW ?
                                                                    <Image
                                                                        style={{ width: 9, height: 10, marginTop: 1, marginLeft: 5 }}
                                                                        resizeMode='stretch'
                                                                        source={require('../../assets/images/logo.png')} /> : null
                                                            }

                                                        </View>
                                                        {
                                                            item.block_hash !== 'user_invoice' ?
                                                            <View
                                                                style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.transaction__subtext}>
                                                                    {strings(`account.transactionStatuses.${!transactionStatus ? 'new' : transactionStatus}`)}
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    {' | '}
                                                                </Text>
                                                                <View style={{ marginRight: 3, marginTop: 1 }}>
                                                                    <MaterialCommunity name="progress-check" size={12}
                                                                                       color={"#999999"}/>
                                                                </View>
                                                                <Text style={styles.transaction__subtext}>
                                                                    {blockConfirmations}
                                                                </Text>
                                                            </View>
                                                            :
                                                            <View
                                                                style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { invoiceMemo }
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    { ' | '}
                                                                </Text>
                                                                <Text style={styles.transaction__subtext}>
                                                                    {strings(`account.transactionStatuses.${!transactionStatus ? 'new' : transactionStatus}`)}
                                                                </Text>
                                                            </View>
                                                        }
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.transaction__income, styles.textAlign_right, !blockConfirmations ? styles.transaction__new : null]}>+ {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                        <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>{ localCurrencySymbol } { FiatRatesActions.toLocalCurrency(prettieAmount * cryptocurrency.currency_rate_usd) }</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                    }
                                </View>
                                <View style={selectedTransactionHash == item.transaction_hash ? { ...styles.transaction__bg, ...styles.transaction__bg_active } : { ...styles.transaction__bg }}>
                                    <View style={styles.transaction__action}>
                                        <MaterialCommunity name="file-replace" color={selectedTransactionHash == item.transaction_hash ? '#f4f4f4' : '#fff'} size={20}/>
                                        <Text style={styles.transaction__action__text}>Replace</Text>
                                    </View>
                                </View>
                                {transactions.length != index + 1 && amountToView != index + 1 ? <GradientView key={index} style={styles.line} array={blockConfirmations ? line.array : line.array_new} start={line.start} end={line.end}/> : null}
                            </View>
                        ): null
                    }) : null
                }
                {
                    this.state.amountToView < this.state.dataLength ?
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore}>
                                <Text style={styles.showMore__btn}>
                                    { strings('account.showMore') }
                                </Text>
                                <Ionicons name='ios-arrow-down' size={12} color='#7127ac' />
                            </TouchableOpacity>
                        </View> : null
                }
            </View>
        )
    }

    renderAddressTooltip = (props) => {
        return (
            <Text style={styles.topContent__address}>
                { props.address.slice(0, 10) + '...' + props.address.slice(props.address.length - 8, props.address.length) }
            </Text>
        )
    }

    render() {
        firebase.analytics().setCurrentScreen('Account.AccountScreen')

        const { address, currency_code, balance, transactions } = this.props.account
        const { localCurrencySymbol } = this.props.fiatRatesStore

        let{ dataLength } = this.state

        let prettieBalance = BlocksoftPrettyNumbers.setCurrencyCode(currency_code).makePrettie(balance)
        if (prettieBalance) {
            prettieBalance = prettieBalance.toString()
        } else {
            prettieBalance = '0.0'
        }

        const cryptocurrency = JSON.parse(JSON.stringify(this.props.cryptocurrency))

        const contentHeight = dataLength ? (Platform.OS === 'android' ? 62.3 : 58.7) * dataLength + ((Platform.OS === 'android' ? 62.3 : 58.7) * dataLength < SCREEN_HEIGHT - 450 ? SCREEN_HEIGHT - 450 : 40) : SCREEN_HEIGHT - 450

        let prettieUsdBalance = (cryptocurrency.currency_rate_usd * prettieBalance).toFixed(5) == 0.00000 ? 0 : (cryptocurrency.currency_rate_usd * prettieBalance).toFixed(5)
        
        console.log({
            currency_code : this.props.account.currency_code,
            address : this.props.account.address,
            state_balance :  this.state.balance,
            props_balance : this.props.account.balance
        })

        prettieUsdBalance = +prettieUsdBalance

        if (this.props.account.balance_provider) {
            const logData = { currency: cryptocurrency.currencyCode, address, amount: prettieBalance + '', balanceProvider: this.props.account.balance_provider + '', usd: prettieUsdBalance + ''}
            MarketingEvent.logEvent('view_account', logData)
            Log.log('Account.AccountScreen is rendered', logData)
        }


        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={`${strings('account.title')} ${cryptocurrency.currencySymbol}`}
                    isBack={false}
                    navigation={this.props.navigation}
                />
                <ScrollView
                    style={styles.wrapper__scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                        />
                    }
                    onScroll={this.handleScroll}
                    >
                    <View style={styles.wrapper__content}>
                        <View style={styles.topContent}>
                            <View style={stl.topContent__content}>
                                <View style={styles.topContent__top}>
                                    <View style={{ position: 'absolute', width: '100%', height: 140, zIndex: 1 }}>
                                        <View style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#f6f6f6',
                                            borderRadius: 15,
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 0,
                                                height: 2
                                            },
                                            shadowOpacity: 0.23,
                                            shadowRadius: 2.62,

                                            elevation: 4
                                        }}>
                                            <Image
                                                style={styles.topBlock__top_bg}
                                                resizeMode='stretch'
                                                source={require('../../assets/images/accountBg.png')}/>
                                        </View>
                                    </View>
                                    <View style={{ position: 'absolute', alignItems: 'center', left: 0, top: 0, width: '100%', height: '100%', zIndex: 2 }}>
                                        <View style={styles.topContent__title}>
                                            <Text style={styles.topContent__title_first}>
                                                {
                                                    typeof prettieBalance.toString().split('.')[1] != 'undefined' ? prettieBalance.toString().split('.')[0] + '.' : prettieBalance.toString().split('.')[0]
                                                }
                                            </Text>
                                            <Text style={styles.topContent__title_last}>
                                                {
                                                    typeof prettieBalance.toString().split('.')[1] != 'undefined' ? prettieBalance.toString().split('.')[1].slice(0, 7) + ' ' + cryptocurrency.currencySymbol : ' ' + cryptocurrency.currencySymbol
                                                }
                                            </Text>
                                        </View>
                                        <Text style={styles.topContent__subtitle}>
                                            { localCurrencySymbol } { FiatRatesActions.toLocalCurrency(prettieUsdBalance) }
                                        </Text>
                                        <ButtonIcon
                                            style={styles.topContent__buttonLine}
                                            icon={cryptocurrency.currencyCode}
                                            callback={() => this.handleOpenLink()}/>
                                    </View>
                                </View>
                                <View style={styles.topContent__middle}>
                                    <ToolTips showAfterRender={true} height={100} type={'ACCOUNT_SCREEN_ADDRESS_TIP'} cryptocurrency={cryptocurrency} mainComponentProps={{ address }} MainComponent={this.renderAddressTooltip} />
                                    <TouchableOpacity onPress={() => this.handleCopyAddress()} style={styles.copyBtn}>
                                        <Text style={styles.copyBtn__text}>
                                            {strings('account.copy')}
                                        </Text>
                                        <View style={styles.copyBtn__icon} >
                                            <Copy name="content-copy" size={18} color="#8040bf"/>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.topContent__bottom}>
                                    <Button onPress={this.handleReceive} styles={{ flex: 1 }}>
                                        { strings('account.receive', { receive: strings('repeat.receive') } )}
                                    </Button>
                                    <View style={styles.topContent__whiteBox}/>
                                    <Button onPress={this.handleSend} styles={{ flex: 1 }}>
                                        { strings('account.send') }
                                    </Button>
                                </View>
                            </View>
                            <View style={stl.topContent__bg}>
                                <View style={styles.shadow}>

                                </View>
                            </View>
                        </View>
                        <View style={styles.dots}>
                            <View style={[styles.dots__item, !this.state.index ? styles.dots__item_active : null ]} />
                            <View style={[styles.dots__item, this.state.index ? styles.dots__item_active : null ]} />
                        </View>
                        <TabView
                            tabBarPosition={'none'}
                            navigationState={this.state}
                            swipeEnabled={this.state.swipeEnable}
                            renderScene={(route) => this.renderScene({route, transactions})}
                            onIndexChange={this.handleOnIndexChanged}
                            style={{ minHeight: SCREEN_HEIGHT - 450 }}
                            initialLayout={{ width: Dimensions.get('window').width }}
                        />
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        account: state.mainStore.selectedAccount,
        cryptocurrency: state.mainStore.selectedCryptoCurrency,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Account)

const styles_ = {
    array: ['#fff', '#fff'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const circle = {
    array: ['#752cb2', '#efa7b5'],
    array_: ['#7127ac', '#9b62f0'],
    array_new: ['#EA751D', '#F4ED69'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const line = {
    array: ['#752cb2', '#efa7b5'],
    array_new: ['#EA751D', '#F4ED69'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const stl = StyleSheet.create({
    topContent__content: {
        position: 'relative',
        //justifyContent: 'flex-end',
        zIndex: 1
    },
    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: -15,
        right: -15,
        bottom: 20,
        zIndex: 0
    }
})
