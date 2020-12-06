import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    ScrollView
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '../../services/i18n'
import Header from '../../components/elements/new/Header'
import NavStore from '../../components/navigation/NavStore'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import UIDict from '../../services/UIDict/UIDict'

import LetterSpacing from '../../components/elements/LetterSpacing'
import Loader from '../../components/elements/LoaderItem'
import TrxItem from './elements/TrxItem'

import Buttons from './elements/buttons'

import { Pages } from 'react-native-pages'

class TransactionScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            transaction: {}
        }
    }

    componentDidMount() {
        const transaction = this.props.navigation.getParam('transaction')

        this.setState({
            transaction
        })
    }

    closeAction = () => {
        NavStore.goBack()
    }

    getTransactionDate(date) {
        let datetime = new Date(date)
        datetime = (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '/' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + '/' + datetime.getFullYear()
        return datetime
    }

    headerTrx = (color, currencyCode) => {

        const { transaction } = this.state

        const status = transaction.transactionStatus

        const { colors, isLight } = this.context

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ color: '#404040', fontSize: 17 }} />

        if (transaction.transactionDirection === 'income' || transaction.transactionDirection === 'claim') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ color: '#404040', fontSize: 17 }} />
        }
        if (transaction.transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name="infinity" style={{ color: '#404040', fontSize: 17 }} />
        }
        if (status === 'fail' || status === 'missing' || status === 'replaced') {
            arrowIcon = <Feather name="x" style={{ color: '#404040', fontSize: 17 }} />
        }

        let exchangeWay

        if (transaction.exchangeWayType) {
            exchangeWay = transaction.exchangeWayType
        } else {
            exchangeWay = transaction.transactionDirection
        }

        return (
            <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.txDirection}>
                        {exchangeWay}
                    </Text>
                    <View>
                        {arrowIcon}
                    </View>
                </View>
                <View style={{ paddingVertical: 8 }}>
                    <Text style={styles.date} >{new Date(transaction.createdAt).toTimeString().slice(0, 8)} {this.getTransactionDate(transaction.createdAt)}</Text>
                </View>
                <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row' }}>
                    <View style={{ ...styles.statusLine, borderBottomColor: color }} />
                    <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                        <View style={{ ...styles.statusBlock, backgroundColor: color }}>
                            <LetterSpacing text={transaction.status || status.toUpperCase()} textStyle={styles.status} letterSpacing={1.5} />
                        </View>
                    </View>
                </View>
                <View style={styles.topContent__title}>
                    {/* {(trx.status ? trx.status.toUpperCase() !== 'PENDING_PAYIN' : false) || (status ? status.toUpperCase() !== 'PENDING' : false) ? */}
                    <>
                        <Text style={styles.amount}>
                            {this.prepareValueToView(transaction.addressAmountPretty, '', transaction.transactionDirection)}
                        </Text>
                        <Text style={{ ...styles.code, color: color }}>{currencyCode}</Text>
                    </>
                    {/* :
                        <Loader size={20} color={colors.accountScreen.loaderColor} />
                    } */}
                </View>

            </View>
        )
    }

    prepareValueToView = (value, currencySymbol, direction) => `${(direction === 'outcome' || direction === 'self' || direction === 'freeze') ? '-' : '+'} ${value}`

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    renderButton = (item) => {
        return (
            <Buttons
                data={item}
            />
        )
    }

    handlerReplaceByFeeRemove = (array) => {
        const { account } = this.props
        const { transaction } = this.state

        if (transaction.transactionDirection === 'income') {
            return false
        }

        if (transaction.transactionStatus !== 'new' && transaction.transactionStatus !== 'missing') {
            return false
        }

        if (!BlocksoftTransfer.canRBF(account, transaction, 'REMOVE')) {
            return false
        }

        array.push({ icon: 'wallet', title: 'Remove rbf', action: () => this.renderRemoveRbf() })

    }

    handlerRemoveButton = (array) => {

        const { transaction } = this.state
        const { status, exchangeWayType } = transaction

        if (typeof exchangeWayType === 'undefined' || exchangeWayType === null || !exchangeWayType) {
            return null
        }
        if (typeof status === 'undefined' || status === null || !status) {
            return null
        }

        if (typeof transaction.transactionHash === 'string') {
            return null
        }

        array.push({ icon: 'pinCode', title: 'Remove', action: () => this.renderRemove() })
    }

    hendlerReplaceByFee = (array) => {
        const { cryptoCurrency, account } = this.props
        const { transaction } = this.state

        if (transaction.transactionHash === 'undefined' || !transaction.transactionHash) {
            return false
        }

        if (transaction.transactionStatus !== 'new' && transaction.transactionStatus !== 'pending_payin' && transaction.transactionStatus !== 'missing') {
            return false
        }

        if (cryptoCurrency.currencyCode === 'BTC' && transaction.addressTo.indexOf('OMNI') !== -1) {
            return
        }

        if (!BlocksoftTransfer.canRBF(account, transaction, 'REPLACE')) {
            return false
        }

        array.push({ icon: 'accounts', title: 'Booster', action: () => this.handlerRbf()})
    }


    renderRbf = () => {
        // todo
    }

    renderRemoveRbf = () => {
        // todo
    }

    renderRemove = () => {
        // todo
    }

    render() {

        const { colors, GRID_SIZE, isLight } = this.context
        const { mainStore, account, cryptoCurrency, exchangeStore, settingsStore } = this.props

        const { headerHeight, transaction } = this.state

        console.log()
        console.log()
        console.log('TransactionScreen.Transaction', JSON.stringify(transaction))

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        const subtitle = typeof transaction.subtitle !== 'undefined' && transaction.subtitle ? transaction.subtitle : false

        const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        const subtitleMini = doteSlice && transaction.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
            transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
                transaction.subtitle.slice(doteSlice + 1, transaction.subtitle.length) : transaction.subtitle : transaction.subtitle


        const buttonsArray = []
        buttonsArray[0] = [
            { icon: 'pinCode', title: 'Share', action: () => console.log('share trx') },
            { icon: 'accounts', title: 'Support', action: () => console.log('Go to support with data trx') },
            { icon: 'wallet', title: 'Details', action: () => console.log('Show more details') }
        ]
        // todo autoCompete array
        buttonsArray[1] = [
            { icon: 'pinCode', title: 'Check', action: () => console.log('open pre-check and final check from V3') },
        ]

        const moreInfoArray = [
            'blockNumber',
            'blockConfirmatins',
            'blockTime',
            'orderId',
            'transactionFeePretty',
            'transactionFeeCurrencyCode',
            'feeCurrencySymbol',
            'transactionStatus',
            'basicAmountPretty',
            'basicCurrencySymbol',
            'transactionJson',
            'transactionHash',
        ]

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType="back"
                    leftAction={this.closeAction}
                    rightType="close"
                    rightAction={this.closeAction}
                    setHeaderHeight={this.setHeaderHeight}
                    // ExtraView={() => this.headerTrx(color, cryptoCurrency.currencyCode)}
                    anime={false}
                />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}
                >
                    <View style={{ marginTop: headerHeight }}>
                        <View>
                            {transaction.exchangeWayType ? transaction.exchangeWayType === 'SELL' ?
                                <>
                                    <TrxItem
                                        title={'Out destination'}
                                        iconType="pinCode"
                                        subtitle={transaction.outDestination}
                                    />
                                    {transaction.basicAmountPretty && <TrxItem
                                        title={'Sum'}
                                        iconType="pinCode"
                                        subtitle={`${transaction.basicCurrencySymbol} ${transaction.basicAmountPretty}`}
                                    />}
                                </>
                                : transaction.exchangeWayType === 'BUY' ?
                                    <>
                                        <TrxItem
                                            title={'Sum'}
                                            iconType="pinCode"
                                            subtitle={`${transaction.addressAmountPretty} ${cryptoCurrency.currencyCode}`}
                                        />
                                    </>
                                    : transaction.exchangeWayType === 'EXCHANGE' ?
                                        transaction.transactionDirection === 'income' ?
                                            <TrxItem
                                                title={'Address'}
                                                iconType="pinCode"
                                                subtitle={`${transaction.depositAddress}`}
                                            /> :
                                            <TrxItem
                                                title={'Recipient address'}
                                                iconType="pinCode"
                                                subtitle={`${transaction.outDestination}`}
                                            />
                                        : null :
                                transaction.transactionDirection === 'income' ?
                                    <TrxItem
                                        title={'Address'}
                                        iconType="pinCode"
                                        subtitle={`${transaction.addressFrom}`}
                                    /> :
                                    <TrxItem
                                        title={'Recipient address'}
                                        iconType="pinCode"
                                        subtitle={`${transaction.addressTo}`}
                                    />
                            }
                        </View>
                        <View style={{ marginTop: 24 }}>
                            <View style={styles.moreInfo}>
                                {Object.keys(transaction).filter(item => moreInfoArray.includes(item)).map((item) => {
                                    if (transaction[item]) {
                                        if (item === 'transactionJson') {
                                            return (
                                                <>
                                                    {Object.keys(transaction[item]).map((el) => {
                                                        if (transaction[item][el]) {
                                                            return (
                                                                <TrxItem
                                                                    title={el}
                                                                    subtitle={transaction[item][el]}
                                                                    withoutBack={true}
                                                                />
                                                            )
                                                        }
                                                    })}
                                                </>
                                            )
                                        } else {
                                            return (
                                                <TrxItem
                                                    title={item}
                                                    subtitle={transaction[item]}
                                                    withoutBack={true}
                                                />
                                            )
                                        }
                                    }
                                })}
                            </View>
                            <View style={styles.shadow}>
                                <View style={styles.shadowItem} />
                            </View>
                        </View>
                    </View>
                    {this.handlerReplaceByFeeRemove(buttonsArray[1])}
                    {this.hendlerReplaceByFee(buttonsArray[1])}
                    {this.handlerRemoveButton(buttonsArray[1])}
                    <View style={{ height: 110 }}>
                        {buttonsArray.length === 1 ?
                            this.renderButton(buttonsArray[0])
                            :
                            <Pages indicatorColor={'#5C5C5C'} >
                                {buttonsArray.map(this.renderButton)}
                            </Pages>}
                    </View>
                </ScrollView>
            </View>
        )
    }
}

TransactionScreen.contextType = ThemeContext

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

export default connect(mapStateToProps, mapDispatchToProps)(TransactionScreen)

const styles = {
    container: {
        flex: 1
    },
    txDirection: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        color: '#404040'
    },
    date: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 14,
        color: '#999999'
    },
    amount: {
        fontSize: 32,
        fontFamily: 'Montserrat-Medium',
        color: '#404040'
    },
    code: {
        fontSize: 20,
        fontFamily: 'Montserrat-Medium',
        marginBottom: -8,
        paddingLeft: 6
    },
    statusBlock: {
        height: 30,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        minWidth: 120,
        maxWidth: 150
    },
    status: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        color: '#FFFFFF'
    },
    statusLine: {
        position: 'absolute',
        borderBottomWidth: 1.5,
        width: '100%',
        top: 14

    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16,
    },
    content: {
        justifyContent: 'center',
        alignItems: 'center',

        width: '100%'
    },
    content__row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    content__item: {
        flex: 1,
        alignSelf: 'stretch'
    },
    paginationContainer: {
        marginTop: -30
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        paddingHorizontal: 4
    },
    moreInfo: {
        backgroundColor: '#F2F2F2',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,

        zIndex: 3
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',
        zIndex: 1
    },
    shadowItem: {
        flex: 1,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
    },
}