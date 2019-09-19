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

import firebase from 'react-native-firebase'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

const WIDTH = Dimensions.get('window').width

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

import updateAccountBalanceDaemon from '../../services/Daemon/classes/UpdateAccountTransactions'
import updateAccountTransactionsDaemon from '../../services/Daemon/classes/UpdateAccountBalance'
import updateExchangeOrdersDaemon from '../../services/Daemon/classes/UpdateExchangeOrders'


import Toast from '../../services/Toast/Toast'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'


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
        }

        this.ordersRef = React.createRef()
    }

    async componentWillMount() {
        const { balancePretty, transactions } = this.props.account

        this.setState({
            balance: balancePretty,
            transactions
        })

        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            this.handleOnIndexChanged(0)
        })
    }

    componentWillReceiveProps(props) {

        const { account } = props

        Log.log(`Account.AccountScreen got props`, account)

        if (Object.keys(account).length != 0) {
            this.setState({
                balance: account.balancePretty.toString(),
                transactions: account.transactions
            })
        }
    }

    handleLink = (data) => {

        const { currencyExplorerTxLink } = this.props.cryptocurrency
        const { address } = data

        Linking.canOpenURL(`${currencyExplorerTxLink}${address}`).then(supported => {
            if (supported) {
                Linking.openURL(`${currencyExplorerTxLink}${address}`)
            } else {
                Log.err(`Account.AccountScreen Don't know how to open URI: ${currencyExplorerTxLink}${address}`)
            }
        })
    }

    handleReceive = () => {
        NavStore.goNext('ReceiveScreen')
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

        this.state.index ? await updateExchangeOrdersDaemon.forceDaemonUpdate() : await updateAccountTransactionsDaemon.forceDaemonUpdate()

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
                Log.err(`Account.AccountScreen Don't know how to open URI: ${currencyExplorerLink}${address}`)
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

        this.ordersRef.setAmountToView()

        this.setState({
            amountToView: 10,
            index,
            dataLength: index ? this.ordersRef.getExchangeOrdersLength() : this.state.transactions.length,
        })
    }

    renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return this.renderTransaction()
            case 'second':
                return <Orders ref={ orders => this.ordersRef = orders } amountToView={this.state.amountToView} currency={this.props.cryptocurrency} />
            default:
                return null
        }
    }

    handleShowMore = () => this.setState({ amountToView: this.state.amountToView + 10 })

    renderTransaction = () => {

        const { transactions, selectedTransactionHash, amountToView } = this.state
        const { localCurrencySymbol } = this.props.fiatRatesStore

        const cryptocurrency = JSON.parse(JSON.stringify(this.props.cryptocurrency))

        return (
            <View style={{ flex: 1 }}>
                <Text style={styles.transaction_title}>{strings('account.history')}</Text>
                {
                    transactions.length ? transactions.map((item, index) => {

                        let date = new Date(item.created_at)
                        date = date.toString()
                        date = date.split(' ')

                        let address = (item.transaction_direction == 'outcome') ? item.address_to : item.address_from
                        let prettieAddress = address.slice(0, 4) + '...' + address.slice(address.length - 4, address.length)
                        let prettieAmount = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(item.address_amount)
                        prettieAmount = +prettieAmount
                        prettieAmount = parseFloat(prettieAmount.toFixed(5))

                        return index < amountToView ? (
                            <View style={{ position: 'relative', paddingBottom: Platform.OS === 'ios' ? 5 : 0, overflow: 'visible' }} key={index}>
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
                                                    <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                        {date[1] + ' ' + date[2]}
                                                    </Text>
                                                    <GradientView style={styles.circle} array={item.transaction_direction == 'outcome' ? circle.array : circle.array_} start={circle.start} end={circle.end}/>
                                                    <TouchableOpacity style={styles.transaction__content} onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                        <View>
                                                            {
                                                                item.transaction_direction == 'outcome' ?
                                                                    <Text style={{ ...styles.transaction__expand }}>{capitalize(item.transaction_direction)}</Text>
                                                                    :
                                                                    <Text style={{ ...styles.transaction__income }}>{capitalize(item.transaction_direction)}</Text>
                                                            }
                                                            <Text style={{ ...styles.transaction__subtext }}>{prettieAddress}</Text>
                                                        </View>
                                                        <View>
                                                            {
                                                                item.transaction_direction == 'outcome' ?
                                                                    <Text style={{ ...styles.transaction__expand, ...styles.textAlign_right }}>- {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                                    :
                                                                    <Text style={{ ...styles.transaction__income, ...styles.textAlign_right }}>+ {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                            }
                                                            <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>{ localCurrencySymbol } { FiatRatesActions.toLocalCurrency(prettieAmount * cryptocurrency.currency_rate_usd) }</Text>

                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            :
                                            <View style={selectedTransactionHash == item.transaction_hash ? { ...styles.transaction__item, ...styles.transaction__item_active } : { ...styles.transaction__item }}>
                                                <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                    {date[1] + ' ' + date[2]}
                                                </Text>
                                                <GradientView style={styles.circle} array={item.transaction_direction == 'outcome' ? circle.array : circle.array_} start={circle.start} end={circle.end}/>
                                                <TouchableOpacity style={styles.transaction__content} onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                    <View>
                                                        {
                                                            item.transaction_direction == 'outcome' ?
                                                                <Text style={{ ...styles.transaction__expand }}>{capitalize(item.transaction_direction)}</Text>
                                                                :
                                                                <Text style={{ ...styles.transaction__income }}>{capitalize(item.transaction_direction)}</Text>
                                                        }
                                                        <Text style={{ ...styles.transaction__subtext }}>{prettieAddress}</Text>
                                                    </View>
                                                    <View>
                                                        {
                                                            item.transaction_direction == 'outcome' ?
                                                                <Text style={{ ...styles.transaction__expand, ...styles.textAlign_right }}>- {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                                :
                                                                <Text style={{ ...styles.transaction__income, ...styles.textAlign_right }}>+ {prettieAmount} {cryptocurrency.currencySymbol}</Text>
                                                        }
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
                                {transactions.length != index + 1 && amountToView != index + 1 ? <GradientView key={index} style={styles.line} array={line.array} start={line.start} end={line.end}/> : null}
                            </View>
                        ): null
                    }) : <Text style={styles.transaction__empty_text}>{strings('account.noTransactions')}</Text>
                }
                {
                    this.state.amountToView < this.state.dataLength ?
                        <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore}>
                            <Text style={styles.showMore__btn}>
                                { strings('account.showMore') }
                            </Text>
                            <Ionicons name='ios-arrow-down' size={12} color='#7127ac' />
                        </TouchableOpacity> : null
                }
            </View>
        )
    }

    render() {
        firebase.analytics().setCurrentScreen('Account.AccountScreen')




        const { address } = this.props.account
        const { localCurrencySymbol } = this.props.fiatRatesStore

        const { balance, dataLength } = this.state

        const cryptocurrency = JSON.parse(JSON.stringify(this.props.cryptocurrency))

        const contentHeight = dataLength ? (Platform.OS === 'android' ? 62.3 : 58.7) * dataLength + ((Platform.OS === 'android' ? 62.3 : 58.7) * dataLength < SCREEN_HEIGHT - 450 ? SCREEN_HEIGHT - 450 : 40) : SCREEN_HEIGHT - 450

        let prettieUsdBalance = (cryptocurrency.currency_rate_usd * this.state.balance).toFixed(5) == 0.00000 ? 0 : (cryptocurrency.currency_rate_usd * this.state.balance).toFixed(5)

        prettieUsdBalance = +prettieUsdBalance
        prettieUsdBalance = prettieUsdBalance.toFixed(2)

        const logData = { currency: cryptocurrency.currencyCode, address, amount: this.state.balance, usd: prettieUsdBalance }

        MarketingEvent.logEvent('view_account', logData)
        Log.log('Account.AccountScreen is rendered', logData)

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={`${strings('account.title')} ${cryptocurrency.currencySymbol}`}
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
                                                    typeof balance.toString().split('.')[1] != 'undefined' ? balance.toString().split('.')[0] + '.' : balance.toString().split('.')[0]
                                                }
                                            </Text>
                                            <Text style={styles.topContent__title_last}>
                                                {
                                                    typeof balance.toString().split('.')[1] != 'undefined' ? balance.toString().split('.')[1].slice(0, 7) + ' ' + cryptocurrency.currencySymbol : ' ' + cryptocurrency.currencySymbol
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
                                    <Text style={styles.topContent__address}>
                                        {address.slice(0, 10) + '...' + address.slice(address.length - 8, address.length)}
                                    </Text>
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
                            renderScene={this.renderScene}
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
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const line = {
    array: ['#752cb2', '#efa7b5'],
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

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper__content: {
        flex: 1,

        paddingTop: 20,
    },
    topContent: {
        position: 'relative',
        marginTop: 25,
        marginBottom: 30,
        marginLeft: 30,
        marginRight: 30
    },
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
        height: 160,
        marginTop: -25
    },
    topBlock__top_bg: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: 140
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    topContent__subtitle: {
        marginTop: -5,
        marginBottom: 15,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#f4f4f4',
        textAlign: 'center'
    },
    topContent__title_first: {
        height: 42,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 36,
        color: '#f4f4f4'
    },
    topContent__title_last: {
        height: 30,
        fontFamily: 'SFUIDisplay-Regular',
        textAlign: 'center',
        fontSize: 24,
        color: '#f4f4f4'
    },
    topContent__bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'visible'
    },
    topContent__middle: {
        alignItems: 'center',
        marginTop: 20
    },
    topContent__address: {
        marginBottom: 3,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        color: '#404040'
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 80,
        paddingLeft: 50,
        paddingRight: 50,
        marginTop: -35
    },
    copyBtn__text: {
        marginTop: 22,
        marginRight: 17,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 10,
        color: '#864dd9'
    },
    copyBtn__icon: {
        marginTop: 18
    },
    shadow: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    transaction_title: {
        marginLeft: 30,
        marginBottom: 10,
        color: '#404040',
        fontSize: 22,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__empty_text: {
        marginTop: -10,
        marginLeft: 30,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__item: {
        position: 'relative',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 15,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    transaction__item_active: {
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    transaction__subtext: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        fontSize: 12
    },
    transaction__content: {
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row'
    },
    transaction__expand: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#e77ca3',
        fontSize: 16
    },
    transaction__income: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9',
        fontSize: 16
    },
    transaction__bg: {
        alignItems: 'flex-end',
        position: 'absolute',
        top: 0,
        left: 15,
        width: WIDTH - 30,
        height: '100%',
        borderRadius: 15,
        zIndex: 1
    },
    transaction__bg_active: {
        backgroundColor: '#e77ca3'
    },
    transaction__action: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: '100%'
    },
    transaction__action__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#ffffff',
        fontSize: 10
    },
    textAlign_right: {
        textAlign: 'right'
    },
    circle: {
        position: 'relative',
        width: 10,
        height: 10,
        marginLeft: 6,
        marginRight: 20,
        borderRadius: 10,
        zIndex: 2
    },
    line: {
        position: 'absolute',
        top: 30,
        left: 92,
        width: 2,
        height: 60,
        zIndex: 2
    },
    topContent__whiteBox: {
        width: 40,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',

        marginBottom: 10,
    },
    dots__item: {
        width: 10,
        height: 10,

        marginHorizontal: 4,

        borderRadius: 10,
        backgroundColor: '#f4f4f4'
    },
    dots__item_active: {
        backgroundColor: '#864dd9'
    },
    showMore: {
        flexDirection: 'row',
        justifyContent: 'center',

        padding: 10,
        marginBottom: 20
    },
    showMore__btn: {
        marginRight: 5,

        color: '#864dd9',
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold'
    }
}

