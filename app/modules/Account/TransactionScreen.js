import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput, Dimensions, PixelRatio,
    SafeAreaView, ScrollView
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '../../services/i18n'
import Header from '../../components/elements/new/Header'
import NavStore from '../../components/navigation/NavStore'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import Theme from '../../themes/Themes'
import UIDict from '../../services/UIDict/UIDict'

import LetterSpacing from '../../components/elements/LetterSpacing'
import Loader from '../../components/elements/LoaderItem'
import TrxItem from './elements/TrxItem'

import Carousel, { Pagination } from 'react-native-snap-carousel'
import Buttons from './elements/buttons'

import { Pages } from 'react-native-pages'


let style

class TransactionScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0
        }
    }


    async UNSAFE_componentWillMount() {
        // UpdateOneByOneDaemon._canUpdate = false
        // try {
        style = Theme.getStyles().accountScreenStyles
        // }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    getTransactionData(data) {
        let datetime = new Date(data)
        datetime = (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '/' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + '/' + datetime.getFullYear()
        return datetime
    }

    headerTrx = (trx, color, currencyCode) => {

        const status = trx.transactionStatus

        const { colors, isLight } = this.context

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ color: '#404040', fontSize: 17 }} />

        if (trx.transactionDirection === 'income' || trx.transactionDirection === 'claim') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ color: '#404040', fontSize: 17 }} />
        }
        if (trx.transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name="infinity" style={{ color: '#404040', fontSize: 17 }} />
        }
        if (status === 'fail' || status === 'missing' || status === 'replaced') {
            arrowIcon = <Feather name="x" style={{ color: '#404040', fontSize: 17 }} />
        }

        let exchangeWay

        if (trx.exchangeWayType) {
            exchangeWay = trx.exchangeWayType[0] + trx.exchangeWayType.slice(1, trx.exchangeWayType.length).toLowerCase()
        } else {
            exchangeWay = trx.transactionDirection[0].toUpperCase() + trx.transactionDirection.toString().slice(1, trx.transactionDirection.length)
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
                    <Text style={styles.date} >{new Date(trx.createdAt).toTimeString().slice(0, 8)} {this.getTransactionData(trx.createdAt)}</Text>
                </View>
                <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row' }}>
                    <View style={{ ...styles.statusLine, borderBottomColor: color }} />
                    <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                        <View style={{ ...styles.statusBlock, backgroundColor: color }}>
                            <LetterSpacing text={trx.status || status.toUpperCase()} textStyle={styles.status} letterSpacing={1.5} />
                        </View>
                    </View>
                </View>
                <View style={style.topContent__title}>
                    {/* {(trx.status ? trx.status.toUpperCase() !== 'PENDING_PAYIN' : false) || (status ? status.toUpperCase() !== 'PENDING' : false) ? */}
                    <>
                        <Text style={styles.amount}>
                            {this.prepareValueToView(trx.addressAmountPretty, '', trx.transactionDirection)}
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

    render() {

        const { colors, GRID_SIZE, isLight } = this.context
        const { mainStore, account, cryptoCurrency, exchangeStore, settingsStore } = this.props

        const { headerHeight } = this.state

        const transaction = this.props.navigation.getParam('transaction')
        console.log(transaction)
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        const subtitle = typeof transaction.subtitle !== 'undefined' && transaction.subtitle ? transaction.subtitle : false

        const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        const subtitleMini = doteSlice && transaction.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
            transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
                transaction.subtitle.slice(doteSlice + 1, transaction.subtitle.length) : transaction.subtitle : transaction.subtitle

        const buttonsArray = []
        buttonsArray[0] = [
            { icon: 'pinCode', title: 'support', action: () => console.log('support') },
            { icon: 'accounts', title: 'accounts', action: () => console.log('accounts') },
            { icon: 'wallet', title: 'wallet', action: () => console.log('wallet') }
        ]
        buttonsArray[1] =
            [
                { icon: 'pinCode', title: 'support', action: () => console.log('support') },
                { icon: 'accounts', title: 'accounts', action: () => console.log('accounts') }
                // { icon: 'wallet', title: 'wallet', action: () => console.log('wallet') }
            ]


        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType="back"
                    leftAction={this.closeAction}
                    rightType="close"
                    rightAction={this.closeAction}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={() => this.headerTrx(transaction, color, cryptoCurrency.currencyCode)}
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
                    </View>
                    <View style={{ height: 110 }}>
                        <Pages indicatorColor={'#5C5C5C'}>
                            {buttonsArray.map(this.renderButton)}
                        </Pages>
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
    }
}