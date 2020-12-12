/**
 * @version 0.11
 */
import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Dimensions, PixelRatio
} from 'react-native'
import { BoxShadow } from 'react-native-shadow'

import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'
import Dash from 'react-native-dash'

import _ from 'lodash'

import Circle from './Circle'
import GradientView from '../../../components/elements/GradientView'
import CustomIcon from '../../../components/elements/CustomIcon'

import NavStore from '../../../components/navigation/NavStore'

import copyToClipboard from '../../../services/UI/CopyToClipboard/CopyToClipboard'
import Log from '../../../services/Log/Log'
import Toast from '../../../services/UI/Toast/Toast'
import { strings } from '../../../services/i18n'

import UIDict from '../../../services/UIDict/UIDict'

import Ionicons from 'react-native-vector-icons/Ionicons'

import updateTradeOrdersDaemon from '../../../daemons/back/UpdateTradeOrdersDaemon'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

class Transaction extends Component {

    constructor(props) {
        super(props)
        this.state = {
            wayType: null,
            direction: null,
            status: null,
            blockConfirmations: null,
            value: null,
            valueToView: null,
            currencySymbolToView: null,
            basicValueToView: null,
            payButtonTimeToEnable: 0,

            isExpanded: false,

            styles: {},

            show: false,
            removed: false,

            orderDirection: false
        }
    }

    componentDidMount() {
        this.init(this.props.transaction)
    }

    init = (transaction) => {

        try {
            const { cryptoCurrency } = this.props

            const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)

            const status = this.prepareStatus(transaction.transactionStatus, transaction.status)

            const direction = this.prepareType(transaction.transactionDirection)

            const wayType = this.prepareWayType()

            const styles = JSON.parse(JSON.stringify(this.prepareStyles(status, direction)))

            let orderDirection
            if (typeof transaction.exchangeWayType !== 'undefined') {
                if (transaction.exchangeWayType === 'BUY') {
                    orderDirection = 'income'
                } else if (transaction.exchangeWayType === 'SELL') {
                    orderDirection = 'outcome'
                } else if (transaction.exchangeWayType === 'EXCHANGE') {
                    if (transaction.requestedOutAmount.currencyCode !== cryptoCurrency.currencyCode) {
                        orderDirection = 'income'
                    } else {
                        orderDirection = 'outcome'
                    }
                }
            }

            let value, valueToView, currencySymbolToView

            if (transaction.addressAmountSatoshi && (cryptoCurrency.currencyCode === 'BTC' || cryptoCurrency.currencyCode === 'DOGE')) {
                value = this.prepareValue(transaction.addressAmountSatoshi, cryptoCurrency.currencyCode)
                valueToView = this.prepareValueToView(value, 'SAT', direction || orderDirection)
                currencySymbolToView = 'sat'
            } else {
                value = this.prepareValue(transaction.addressAmountPretty || transaction.requestedOutAmount.amount, cryptoCurrency.currencyCode)
                valueToView = this.prepareValueToView(value, cryptoCurrency.currencySymbol, direction || orderDirection)
                currencySymbolToView = cryptoCurrency.currencySymbol
            }


            const basicValueToView = transaction.basicCurrencySymbol + ' ' + transaction.basicAmountPretty


            this.setState({
                direction,
                wayType,
                status,
                styles,
                blockConfirmations,
                value,
                valueToView,
                basicValueToView,
                currencySymbolToView,
                show: true
            })
        } catch (e) {
            Log.err(`AccountScreen.Transaction init error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(transaction)}`)
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.transaction.blockConfirmations !== this.props.transaction.blockConfirmations) {
            this.init(this.props.transaction)
        }
    }

    prepareType = (transactionDirection) => {
        return transactionDirection
    }

    prepareWayType = () => {

        const { transaction } = this.props

        if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null && transaction.bseOrderData.outDestination && transaction.bseOrderData.outDestination.includes('+')) {
            return 'MOBILE_PHONE'
        }

        const wayType = typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null ? transaction.bseOrderData.exchangeWayType : transaction.exchangeWayType ? 
            transaction.exchangeWayType : null

        return wayType
    }

    prepareStatus = (transactionStatus, orderStatus) => {

        if (orderStatus) {
            return orderStatus
        }

        const transactionStatusTmp = typeof (transactionStatus) !== 'undefined' ? transactionStatus : 'new'
        return !transactionStatusTmp ? 'new' : transactionStatusTmp
    }

    prepareStyles = (status, direction) => {

        let styles = globalStyles.themes[direction]

        if (status === 'new' || status === 'confirming' || status === 'done_payin' || status === 'wait_trade' || status === 'done_trade' || status === 'pending_payin') styles = globalStyles.themes.new

        return _.merge(globalStyles.default, styles)
    }

    prepareValue = (value) => {
        try {
            return value
        } catch (e) {
            Log.err('AccountScreen/Transaction.prepareValueToView error ' + e.message)
        }
    }

    prepareValueToView = (value, currencySymbol, direction) => `${(direction === 'outcome' || direction === 'self' || direction === 'freeze') ? '-' : '+'} ${value}`

    prepareBlockConfirmations = (blockConfirmations) => {

        let tmp = 0

        if (typeof blockConfirmations !== 'undefined' && blockConfirmations > 0) {

            tmp = blockConfirmations.toString()

            if (blockConfirmations > 20)
                tmp = '20+'
        }

        return tmp
    }

    handleCopyAll = () => {
        const { valueToView, currencySymbolToView } = this.state
        const tx = this.props.transaction
        let text = ' ' + tx.transactionHash + ' ' + valueToView + ' ' + currencySymbolToView
        if (tx.transactionDirection === 'outcome') {
            text += ' => ' + tx.addressTo
        } else if (text.transactionDirection === 'income') {
            text += ' ' + tx.addressFrom + ' => '
        } else {
            text += ' self '
        }
        copyToClipboard(text)
        Toast.setMessage(strings('toast.copied')).show()
    }

    ifTxsTW = () => {

        const { styles } = this.state
        const { transaction } = this.props
        const { colors, isLight } = this.context

        if (transaction.transactionOfTrusteeWallet && transaction.transactionOfTrusteeWallet === 1)
            return (
                <View style={{ marginLeft: 'auto', marginRight: 20 }}>
                    <CustomIcon name="shield" style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                </View>
            )
    }

    renderStatusCircle = (isStatus, status, transactionDirection) => {

        const { colors, isLight } = this.context

        const { styles } = this.state
        const { amountToView, count, transactions, cryptoCurrency } = this.props

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 15 }} />
        let circleStyle = {}

        if (transactionDirection === 'income' || transactionDirection === 'claim') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 15 }} />
        }
        if (transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name="infinity" style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 10 }} />
            circleStyle = { backgroundColor: isStatus ? color : colors.accountScreen.transactions.circleBackground }
        }
        if (status === 'fail' || status === 'missing' || status === 'replaced') {
            arrowIcon = <Feather name="x" style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 15 }} />
            circleStyle = { backgroundColor: colors.accountScreen.transactions.circleBackground }
        }

        const statusTmp = status !== 'new' && status !== 'confirming' && status !== 'done_payin' && status !== 'wait_trade' && status !== 'done_trade' && status !== 'pending_payin' && status !== 'pending_payin'

        const marginTop = !count ? 50 : 0
        const height = (amountToView === count + 1 && transactions && transactions.length === count + 1) ? 50 : 700

        const { width: SCREEN_WIDTH } = Dimensions.get('window')
        const PIXEL_RATIO = PixelRatio.get()
        if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
            // iphone 5s
            return (
                <View style={[styles.transaction__col, styles.transaction__colOld, {
                    overflow: 'visible',
                    marginTop: !statusTmp ? 1 : 0
                }]}>
                    <View style={{ position: 'absolute', top: 3, left: 2 }}>

                    </View>
                </View>
            )
        }

        return (
            <View style={[styles.transaction__col, styles.transaction__col1, {
                overflow: 'visible',
                marginTop: !statusTmp ? 1 : 0
            }]}>
                <View style={{ position: 'absolute', top: 3, left: 23 }}>
                    <Dash style={{
                        width: 2,
                        height: !this.props.dash ? height : transactions.length === 1 ? 0 : 70,
                        marginTop: marginTop,
                        flexDirection: 'column'
                    }}
                        dashColor={colors.accountScreen.transactions.dashColor}
                        dashGap={3}
                        dashLength={3} />
                </View>
                <Circle style={{
                    ...styles.transaction__circle__small, ...circleStyle,
                    backgroundColor: isStatus ? color : colors.accountScreen.transactions.circle,
                    width: 24,
                    height: 24
                }}>
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        borderRadius: 25,
                        backgroundColor: isStatus ? color : colors.accountScreen.transactions.circle, ...circleStyle,
                        marginLeft: Platform.OS === 'ios' && transactionDirection !== 'self' && transactionDirection !== 'fail' ? 1 : 0
                    }}>
                        {arrowIcon}
                    </View>
                </Circle>
            </View>
        )
    }

    getTransactionDate(date) {
        let datetime = new Date(date)
        datetime = (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '.' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + 
            '.' + datetime.getFullYear().toString().slice(-2)
        return datetime
    }

    transactionDetalis = (tx) => {
        NavStore.goNext('TransactionScreen', {
            txData: {
                transaction: tx
            } 
        })
    }

    render() {

        const { wayType, direction, status, valueToView, isExpanded, blockConfirmations, basicValueToView, styles, show, currencySymbolToView, removed, orderDirection } = this.state

        const { colors, isLight } = this.context

        if (removed) {
            return <View />
        }
        const { cryptoCurrency, transaction } = this.props
        const isStatus = status === 'new' || status === 'done_payin' || status === 'wait_trade' || status === 'done_trade' || status === 'pending_payin'

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        const subtitle = typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null && transaction.bseOrderData.exchangeWayType !== 'BUY' ? true : false

        // const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        // const subtitleMini = transaction.bseOrderData.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
        //     transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
        //         transaction.subtitle.slice(doteSlice + 1, transaction.subtitle.length) : transaction.subtitle : transaction.subtitle

        let subtitleMini
        if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null) {
            if (transaction.bseOrderData.exchangeWayType === 'SELL') {
                subtitleMini = transaction.bseOrderData.outDestination
            } else if (transaction.bseOrderData.exchangeWayType === 'EXCHANGE'){
                subtitleMini = transaction.transactionDirection === 'income' ?
                transaction.requestedOutAmount.currencyCode : transaction.requestedInAmount.currencyCode
            }
        }


        return show ? (
            <View style={styles.transaction}>
                {this.renderStatusCircle(isStatus, status, transaction.transactionDirection || orderDirection)}
                <View style={[styles.transaction__col, styles.transaction__col2]}>
                    <TouchableOpacity style={{ ...styles.transaction__top }} onLongPress={this.handleCopyAll}>
                        <Text style={{ ...styles.transaction__top__title, color: colors.accountScreen.transactions.transactionTitleColor }}>
                            {strings(`account.transaction.${wayType === null ? direction : wayType.toLowerCase()}`)}
                        </Text>
                        {
                            !isStatus ?
                                <View style={{ marginRight: 4 }}>
                                    <MaterialCommunity name="progress-check"
                                        style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                                </View> : null
                        }
                        <Text style={[styles.transaction__top__type, { color: isStatus ? color : colors.accountScreen.transactions.transactionTitleColor }]}>
                            {isStatus ? strings(`account.transactionStatuses.${status === 'confirming' ? 'confirming' : 'process'}`).toUpperCase() : blockConfirmations}
                        </Text>
                        {this.ifTxsTW()}
                    </TouchableOpacity>
                    <View style={{ ...styles.transaction__content, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                        <View style={{ ...styles.transaction__content__item, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                            <TouchableOpacity onPress={() => this.transactionDetalis(transaction)}>
                                <GradientView
                                    style={[styles.transaction__item, isExpanded ? styles.transaction__item_active : null]}
                                    array={colors.accountScreen.transactions.transactionGradientArray}
                                    start={styles.transaction__item_bg.start}
                                    end={styles.transaction__item_bg.end}>
                                    <View style={{ ...styles.transaction__item__content, opacity: status === 'fail' || status === 'missing' ? 0.5 : null }}>
                                        <View style={{ justifyContent: 'center', width: '75%' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: subtitle ? '45%' : '100%' }}>
                                                {/* width: subtitle ? '45%' : '100%' */}
                                                <Text style={{...styles.transaction__item__title}} numberOfLines={1}>
                                                    {valueToView}
                                                    </Text>
                                                    <Text style={[styles.transaction__item__title__subtitle, { color: new UIDict(cryptoCurrency.currencyCode).settings.colors.mainColor }]}>
                                                        {currencySymbolToView}
                                                    </Text>
                                                {
                                                    subtitle ?
                                                        <>
                                                            <Ionicons name={'ios-arrow-round-up'} size={20} color={colors.accountScreen.transactions.circle} style={{
                                                                transform: [{ rotate: transaction.transactionDirection === 'outcome' ? "90deg" : "-90deg" }],
                                                                marginHorizontal: 7, marginBottom: Platform.OS === 'ios' ? -1 : null
                                                            }} />
                                                            <Text style={{ ...styles.transaction__item__subtitle, marginBottom: Platform.OS === 'ios' ? 2 : null }} >
                                                                {subtitleMini}
                                                            </Text>
                                                        </>
                                                        : null
                                                }
                                            </View>
                                            {wayType !== 'EXCHANGE' && basicValueToView !== 'undefined undefined' ?
                                                <Text style={{ ...styles.transaction__item__subtitle, color: '#999999' }}>
                                                    {basicValueToView}
                                                </Text> : null}
                                        </View>
                                        <View style={{ flexDirection: 'column', alignItems: 'flex-end', width: '25%' }}>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {this.getTransactionDate(transaction.createdAt)}</Text>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {new Date(transaction.createdAt).toTimeString().slice(0, 5)}</Text>

                                        </View>
                                    </View>
                                </GradientView>
                            </TouchableOpacity>
                        </View>
                        {isStatus && Platform.OS !== 'ios' && typeof this.state.height !== 'undefined' && typeof this.state.width !== 'undefined' ?
                            <BoxShadow setting={{
                                ...styles.shadow__item__android, color: color,
                                height: this.state.height, width: this.state.width
                            }} fromTransaction={1}>
                            </BoxShadow> :
                            <View style={styles.shadow}>
                                <View style={{ ...styles.shadow__item, shadowColor: isStatus ? color : null }} />
                            </View>}
                    </View>
                </View>
            </View>
        ) : <View />
    }
}

Transaction.contextType = ThemeContext

export default Transaction


const globalStyles = {
    default: {
        transaction: {
            flexDirection: 'row',

            overflow: 'hidden'
        },
        transaction__content: {
            position: 'relative',

            borderRadius: 16
        },
        transaction__content__item: {
            position: 'relative',

            borderRadius: 16,

            zIndex: 2,
        },
        transaction__col1: {
            alignItems: 'center',

            width: 48,
            paddingTop: 54,

            overflow: 'hidden'
        },
        transaction__colOld: {
            alignItems: 'center',

            width: 20,
            paddingTop: 54,

            overflow: 'hidden'
        },
        transaction__col2: {
            flex: 1,

            paddingTop: 4,
            paddingBottom: 16,
            marginRight: 16
        },
        transaction__circle__small: {
            width: 10,
            height: 10,
            border: 0
        },
        transaction__circle__big: {
            width: 20,
            height: 20,
            border: 3,
            backgroundInnerColor: '#f6f6f6'
        },
        transaction__top: {
            flexDirection: 'row',
            alignItems: 'center',

            marginLeft: 16,
            marginBottom: 4
        },
        transaction__top__title: {
            marginRight: 8,

            fontFamily: 'Montserrat-Bold',
            fontSize: 14,
        },
        transaction__top__type__icon: {
            marginTop: 2,
            fontSize: 16,
        },
        transaction__top__type: {
            marginTop: Platform.OS === 'android' ? 2.5 : 0.5,

            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 14,
        },
        transaction__top__confirmation: {},
        transaction__item: {
            maxHeight: 62,
            paddingHorizontal: 16,

            borderRadius: 16,

            overflow: 'hidden'
        },
        transaction__item_active: {
            maxHeight: 1000
        },
        transaction__item__content: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',

            height: 62
        },
        transaction__item_bg: {
            start: { x: 1, y: 0 },
            end: { x: 1, y: 1 }
        },
        transaction__item__title: {
            marginRight: 5,

            fontFamily: 'Montserrat-SemiBold',
            fontSize: 18
        },
        transaction__item__title__subtitle: {

            fontFamily: 'Montserrat-SemiBold',
            fontSize: 14,
            color: '#1EB3E4'
        },
        transaction__item__subtitle: {
            fontFamily: 'Montserrat-SemiBold',
            fontSize: 12,
            color: '#404040'
        },
        circle: {},
        transaction__item__arrow: {
            marginLeft: .5,

            fontSize: 16
        },
        shadow: {
            position: 'absolute',
            top: 0,
            left: 0,

            width: '100%',
            height: '100%',

            zIndex: 1
        },
        shadow__item: {
            flex: 1,

            marginHorizontal: 4,
            marginTop: 11,
            marginBottom: Platform.OS === 'android' ? 6 : 0,

            backgroundColor: '#fff',

            borderRadius: 16,

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 5
            },
            shadowOpacity: 0.34,
            shadowRadius: 6.27,

            elevation: 10
        },

        shadow__item__android: {
            flex: 1,

            marginHorizontal: 4,
            marginTop: 11,
            marginBottom: Platform.OS === 'android' ? 6 : 0,

            backgroundColor: '#fff',

            width: 350,
            height: 63,
            border: 6,
            radius: 16,
            opacity: 0.07,
            x: 0,
            y: 0,
            style: {
                flexDirection: 'row',
                position: 'absolute',
            }
        },
        transaction__data: {
            fontFamily: 'SFUIDisplay-Semibold',
            fontSize: 14,
            lineРeight: 18,
        },
    },
    themes: {
        new: {
            transaction__circle__small: {
                backgroundColor: '#404040'
            },
            transaction__circle__big: {
                borderColor: '#404040',
                borderWidth: 1.5,
                borderRadius: 20
            },
            transaction__item__title: {
                color: '#404040'
            },
            transaction__item__arrow: {
                color: '#404040'
            },
        },
        self: {
            transaction__circle__small: {
                backgroundColor: '#404040'
            },
            transaction__circle__big: {
                borderColor: '#404040',
                borderWidth: 1.5,
                borderRadius: 20
            },
            transaction__item__title: {
                color: '#404040'
            },
            transaction__item__arrow: {
                color: '#404040'
            },
        },
        outcome: {
            transaction__circle__small: {
                backgroundColor: '#404040'
            },
            transaction__circle__big: {
                borderColor: '#404040',
                borderWidth: 1.5,
                borderRadius: 20
            },
            transaction__item__title: {
                color: '#404040'
            },
            transaction__item__arrow: {
                color: '#404040'
            }
        },
        income: {
            transaction__circle__small: {
                backgroundColor: '#404040'
            },
            transaction__circle__big: {
                borderColor: '#404040',
                borderWidth: 1.5,
                borderRadius: 20
            },
            transaction__item__title: {
                color: '#404040'
            },
            transaction__item__arrow: {
                color: '#404040'
            }
        }
    }
}

