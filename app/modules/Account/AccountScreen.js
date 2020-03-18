import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Linking,
    RefreshControl,
    FlatList
} from 'react-native'

import firebase from 'react-native-firebase'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'
import ToolTips from '../../components/elements/ToolTips'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LetterSpacing from '../../components/elements/LetterSpacing'

import { clearSendData } from '../../appstores/Actions/SendActions'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'
import { setSelectedAccount, setSelectedSegwitOrNot } from '../../appstores/Actions/MainStoreActions'

import Log from '../../services/Log/Log'
import Toast from '../../services/Toast/Toast'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import updateAccountBalanceDaemon from '../../services/Daemon/classes/UpdateAccountTransactions'
import updateAccountTransactionsDaemon from '../../services/Daemon/classes/UpdateAccountBalance'
import updateExchangeOrdersDaemon from '../../services/Daemon/classes/UpdateExchangeOrders'
import utils, { copyToClipboard } from '../../services/utils'
import { strings } from '../../services/i18n'

import Theme from '../../themes/Themes'
import Transaction from './elements/Transaction'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftTransfer from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { showModal } from '../../appstores/Actions/ModalActions'

let styles


class Account extends Component {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            amountToView: 5,
            transactions: [],
            transactionsToView: [],
            transactionsLength: 0,
            show: true
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        try {
            styles = Theme.getStyles().accountScreenStyles

            await updateAccountBalanceDaemon.forceDaemonUpdate()
            await updateExchangeOrdersDaemon.forceDaemonUpdate()
            await updateAccountTransactionsDaemon.forceDaemonUpdate()
        } catch (e) {
            Log.err('AccountScreen.componentDidMount' + e.message)
        }
    }

    handleReceive = async () => {

        const { selectedCryptoCurrency, selectedAccount } = this.props.mainStore

        utils.checkTransferHasError(selectedCryptoCurrency.currencyCode, selectedAccount.address)

        if (this.props.account.currency_code === 'BTC_LIGHT') {
            // @misha todo view where will be entered
            BlocksoftInvoice.setCurrencyCode(this.props.account.currency_code).setAddress(this.props.account.address).setAdditional(this.props.account.account_json).setAmount(900).setMemo('ksu is testing6')
            const res = await BlocksoftInvoice.createInvoice()
            // @misha todo view with this hash qr
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

        this.setState({
            refreshing: false
        })
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

    handleCopyAddress = () => {

        const { selectedCryptoCurrency, selectedAccount } = this.props.mainStore

        utils.checkTransferHasError(selectedCryptoCurrency.currencyCode, selectedAccount.address)

        copyToClipboard(this.props.account.address)

        Toast.setMessage(strings('toast.copied')).show()
    }

    handleToggleSegwit = async () => {
        const setting = await setSelectedSegwitOrNot()
        await setSelectedAccount(setting)
    }

    renderTooltip = (props) => {
        return (
            <View>
                <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                { !props.transactionsToView.length ? <Text style={styles.transaction__empty_text}>{ strings('account.noTransactions') }</Text> : null }
            </View>
        )
    }

    prepareTransactions = (param) => {

        let exchangeOrders = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeOrders))
        let transactions = JSON.parse(JSON.stringify(param))
        const cryptocurrency = this.props.cryptocurrency

        let transactionsTmp = []

        transactions = transactions.map(item => {

            let prettieAmount = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(item.address_amount)
            prettieAmount = +prettieAmount
            prettieAmount = parseFloat(prettieAmount.toFixed(5))

            return {
                ...item,
                address_amount: prettieAmount
            }
        })

        exchangeOrders = exchangeOrders.filter(item => item.requestedOutAmount.currencyCode === this.props.cryptocurrency.currencyCode || item.requestedInAmount.currencyCode === this.props.cryptocurrency.currencyCode)

        exchangeOrders = exchangeOrders.filter(item => item.exchangeWayType !== "EXCHANGE")

        exchangeOrders.forEach(item1 => transactions.forEach(item2 => {
            if(item1.inTxHash === item2.transaction_hash || item1.outTxHash === item2.transaction_hash){
                transactionsTmp.push({...item2, ...item1})
            }
        }))

        transactionsTmp.forEach(item1 => {
            transactions = transactions.filter(item => item.transaction_hash !== item1.transaction_hash)
        })

        transactionsTmp.forEach(item1 => {
            exchangeOrders = exchangeOrders.filter(item => item.inTxHash !== item1.transaction_hash && item.outTxHash !== item1.transaction_hash)
        })

        exchangeOrders = exchangeOrders.map(item => {
            return {
                exchangeWayType: item.exchangeWayType,
                transaction_status: "new",
                status: item.status,
                block_confirmations: 0,
                transaction_direction: item.requestedOutAmount.currencyCode === this.props.cryptocurrency.currencyCode ? "income" : "outcome",
                created_at: item.createdAt,
                address_amount: item.requestedOutAmount.currencyCode === this.props.cryptocurrency.currencyCode ? item.requestedOutAmount.amount : item.requestedInAmount.amount
            }
        })

        transactionsTmp = transactionsTmp.concat(exchangeOrders, transactions)

        transactionsTmp = transactionsTmp.sort((a,b) =>{
            return new Date(b.created_at) - new Date(a.created_at)
        })

        transactionsTmp = transactionsTmp.map(item => {
            if(typeof item.id === "undefined"){
                return { ...item, id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) }
            } else return item
        })

        return transactionsTmp
    }

    handleShowMore = () => this.setState({ amountToView: this.state.amountToView + 5, transactionToView: this.state.transactions.slice(this.state.amountToView + 5) })

    renderAddressTooltip = (props) => {
        return (
            <View style={styles.topContent__address}>
                <LetterSpacing text={props.address.slice(0, 10) + '...' + props.address.slice(props.address.length - 8, props.address.length)} textStyle={styles.topContent__address} letterSpacing={1} />
            </View>
        )
    }

    renderToggleAddress = () => {

        const account = this.props.account

        if(typeof account.addressType !== "undefined"){
            return (
                <TouchableOpacity style={stl.topContent__tag} onPress={() => this.handleToggleSegwit()}>
                    <View style={stl.topContent__content__tag}>
                        <Text style={stl.topContent__tag__text}>{ account.addressType }</Text>
                    </View>
                </TouchableOpacity>
            )
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('Account.AccountScreen')

        const { show } = this.state
        const { address, transactions } = this.props.account
        const { mainStore, settingsStore } = this.props
        const { localCurrencySymbol } = this.props.fiatRatesStore
        const { amountToView } = this.state

        let transactionsToView = this.prepareTransactions(transactions)
        transactionsToView = transactionsToView.slice(0, this.state.amountToView)

        const cryptocurrency = JSON.parse(JSON.stringify(this.props.cryptocurrency))

        const prettieBalance = cryptocurrency.currencyBalanceAmount

        let prettieUsdBalance = (cryptocurrency.currency_rate_usd * prettieBalance).toFixed(5) == 0.00000 ? 0 : (cryptocurrency.currency_rate_usd * prettieBalance).toFixed(5)

        prettieUsdBalance = +prettieUsdBalance

        if (this.props.account.balance_provider) {
            const logData = {
                currency: cryptocurrency.currencyCode, address,
                amount: prettieBalance + '',
                balanceScanTime : this.props.account.balance_scan_time + '',
                balanceProvider: this.props.account.balance_provider + '',
                balanceScanLog : this.props.account.balance_scan_log + '',
                usd: prettieUsdBalance + ''
            }
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
                    }>
                    <View style={styles.wrapper__content}>
                        <View style={styles.topContent}>
                            <View style={stl.topContent__content}>
                                { this.renderToggleAddress() }
                                <View style={styles.topContent__top}>
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
                                        <LetterSpacing text={localCurrencySymbol + " " + (settingsStore.data.local_currency === "UAH" && cryptocurrency.currencyCode === "ETH_UAX" ? cryptocurrency.currencyBalanceAmount : utils.prettierNumber(FiatRatesActions.toLocalCurrency(prettieUsdBalance, false), 2))} textStyle={styles.topContent__subtitle} letterSpacing={.5} />
                                </View>
                                <View style={styles.topContent__middle}>
                                    <ToolTips showAfterRender={true} height={100} type={'ACCOUNT_SCREEN_ADDRESS_TIP'} cryptocurrency={cryptocurrency} mainComponentProps={{ address }} MainComponent={this.renderAddressTooltip} />
                                    <TouchableOpacity onPress={() => this.handleCopyAddress()} style={styles.copyBtn}>
                                        <Text style={styles.copyBtn__text}>
                                            {strings('account.copy')}
                                        </Text>
                                        <View style={styles.copyBtn__icon}>
                                            <Copy name="content-copy" size={15} color="#8040bf"/>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.topContent__bottom}>
                                    <TouchableOpacity style={{ padding: 20, alignItems: "center", }} onPress={this.handleReceive}>
                                        <View style={{ position: "relative", alignItems: "center", width: 50, height: 50 }}>
                                            <GradientView style={stl.topContent__bottom__btn__wrap} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end} >
                                                <View style={stl.topContent__bottom__btn}>
                                                    <FontAwesome5 name="arrow-down" style={{ color: '#864DD9', fontSize: 18 }} />
                                                </View>
                                            </GradientView>
                                            <View style={stl.topContent__bottom__btn__shadow}>
                                                <View style={stl.topContent__bottom__btn__shadow__item} />
                                            </View>
                                            <View style={stl.topContent__bottom__btn__white} />
                                        </View>
                                        <Text style={stl.topContent__bottom__btn__text}>
                                            { strings('account.receive', { receive: strings('repeat.receive') } )}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ position: "relative", padding: 20, alignItems: "center", }} onPress={() => this.handleOpenLink()}>
                                        <View style={{ position: "relative", alignItems: "center", width: 50, height: 50 }}>
                                            <GradientView style={stl.topContent__icon} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end} />
                                            <View style={{ position: "absolute", alignItems: "center", justifyContent: "center", top: 0, left: 0, bottom: 0, right: 0, zIndex: 3 }}>
                                                <CurrencyIcon currencyCode={cryptocurrency.currencyCode}
                                                              containerStyle={{ borderWidth: 0 }}
                                                              markStyle={{ top: 30 }}
                                                              textContainerStyle={{ bottom: -19 }}
                                                              textStyle={{ backgroundColor: "transparent" }}/>
                                            </View>
                                            <View style={{...stl.topContent__bottom__btn__shadow}}>
                                                <View style={stl.topContent__bottom__btn__shadow__item} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ padding: 20, alignItems: "center", }} onPress={this.handleSend}>
                                        <View style={{ position: "relative", alignItems: "center", width: 50, height: 50  }}>
                                            <View style={{ position: "relative", zIndex: 2 }}>
                                                <GradientView style={stl.topContent__bottom__btn__wrap} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end} >
                                                    <View style={stl.topContent__bottom__btn}>
                                                        <FontAwesome5 name="arrow-up" style={{ color: '#864DD9', fontSize: 18 }} />
                                                    </View>
                                                </GradientView>
                                            </View>
                                            <View style={stl.topContent__bottom__btn__shadow}>
                                                <View style={stl.topContent__bottom__btn__shadow__item} />
                                            </View>
                                            <View style={stl.topContent__bottom__btn__white} />
                                        </View>
                                        <Text style={stl.topContent__bottom__btn__text}>
                                            { strings('account.send') }
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <GradientView style={stl.bg} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end} />
                            <View style={stl.topContent__bg}>
                                <View style={styles.shadow} />
                            </View>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <View>
                                <ToolTips type={'ACCOUNT_SCREEN_TRANSACTION_TIP'}
                                          height={100}
                                          MainComponent={this.renderTooltip}
                                          nextCallback={this.nextCallback}
                                          mainComponentProps={{ transactionsToView }}/>
                            </View>
                            <View style={{ position: "relative", width: "100%", marginTop: 20 }}>
                                <View style={{ position: "relative", width: "100%", zIndex: 1 }}>
                                    {
                                        show ?
                                            <FlatList
                                                contentContainerStyle={{ paddingTop: 5 }}
                                                data={transactionsToView}
                                                windowSize={5}
                                                initialListSize={5}
                                                initialNumToRender={5}
                                                maxToRenderPerBatch={5}
                                                renderItem={({ item, index }) => {

                                                    // let invoiceMemo = typeof item.transaction_json === 'undefined' || item.transaction_json == null || typeof item.transaction_json.memo === 'undefined' ? 'no title' : item.transaction_json.memo*/}
                                                    // {/*        if (item.transaction_direction === 'income' && item.block_hash === 'user_invoice') {*/}
                                                    // {/*            if (item.transaction_status === 'pay_waiting' || item.transaction_status === 'new' ) {*/}
                                                    // {/*                console.log('could be destination address shown qr liked or passed by messangers etc to anyone to pay', item.transaction_hash)*/}
                                                    // {/*            }*/}
                                                    // {/*        }*/}

                                                    return (
                                                        <Transaction index={index}
                                                                     transactions={transactionsToView}
                                                                     amountToView={amountToView}
                                                                     transaction={item}
                                                                     cryptocurrency={cryptocurrency}
                                                                     cryptocurrencyList={mainStore.currencies}
                                                                     localCurrencySymbol={localCurrencySymbol}
                                                                     keyExtractor={(item, index) => index+""}/>
                                                    )
                                                }}
                                            /> : null
                                    }
                                </View>
                            </View>
                            {
                                this.state.amountToView < transactions.length ?
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
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore,
        account: state.mainStore.selectedAccount,
        cryptocurrency: state.mainStore.selectedCryptoCurrency,
        fiatRatesStore: state.fiatRatesStore,
        settingsStore: state.settingsStore
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
        position: "absolute",
        top: 0,
        left: 0,

        width: "100%",
        height: 210,

        zIndex: 1,

        borderRadius: 16
    },
    topContent__content: {
        position: 'relative',
        zIndex: 2,
        borderRadius: 16,
    },
    topContent__tag: {
        position: "absolute",
        top: 0,
        right: 0,

        paddingLeft: 30,
        paddingBottom: 30,
        zIndex: 1,
    },
    topContent__content__tag: {
        alignItems: "center",

        width: 70,
        paddingVertical: 5,

        backgroundColor: "#8D51E4",
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
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
        width: "100%",
        height: 200,
        borderRadius: 16,

        zIndex: 0
    },
    topContent__icon: {
        position: "relative",

        width: 50,
        height: 50,

        backgroundColor: "#fff",
        borderRadius: 30,

        zIndex: 1,
    },
    topContent__bottom__btn: {

        justifyContent: "center",
        alignItems: "center",

        width: 50,
        height: 50,

        borderRadius: 50,
    },
    topContent__bottom__btn__white: {
        position: "absolute",
        top: 0,
        left: 0,

        width: 50,
        height: 50,

        backgroundColor: "#fff",
        borderRadius: 50,

        zIndex: 1,
    },
    topContent__bottom__btn__wrap: {
        position: "relative",

        width: 50,
        height: 50,

        borderRadius: 50,

        zIndex: 2
    },
    topContent__bottom__btn__line: {
        width: 16,
        height: 1.5,

        marginTop: 2,

        backgroundColor: "#864DD9"
    },
    topContent__bottom__btn__shadow: {
        position: "absolute",
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

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,

        backgroundColor: "#fff",
        borderRadius: 100,

        zIndex: 0
    },
    topContent__bottom__btn__text: {
        marginTop: 5,

        fontSize: 12,
        color: "#999",
        textAlign: "center",
        fontFamily: "SFUIDisplay-Regular"
    }
}
