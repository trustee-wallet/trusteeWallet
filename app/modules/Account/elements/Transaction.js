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
import config from '../../../config/config'

class Transaction extends Component {

    constructor(props) {
        super(props)
        this.state = {
            styles: {},
        }
    }

    async UNSAFE_componentWillMount() {
        this.init()
    }

    async componentDidMount() {
        this.init()
    }

    async componentDidUpdate(prevProps, prevState) {
    //    this.init()
    }

    init() {
        const { transaction } = this.props
        const transactionStatus = this.prepareStatus(transaction.transactionStatus)
        const transactionDirection = this.prepareDirection(transaction.transactionDirection)
        const styles = JSON.parse(JSON.stringify(this.prepareStyles(transactionStatus, transactionDirection)))
        this.setState({
            styles
        })
    }

    prepareStyles = (status, direction) => {
        let styles = globalStyles.themes[direction]
        if (status === 'new' || status === 'confirming' || status === 'done_payin' || status === 'wait_trade' || status === 'done_trade' || status === 'pending_payin') {
            styles = globalStyles.themes.new
        }
        return _.merge(globalStyles.default, styles)
    }

    prepareDirection = (transactionDirection) => {
        return transactionDirection
    }

    prepareWayType = (wayType) => {
        return wayType // moved to preformatWithBSEforShow
    }

    prepareStatus = (transactionStatus) => {
        // orderStatus => transactionStatus moved to preformatWithBSEforShow
        const transactionStatusTmp = typeof (transactionStatus) !== 'undefined' ? transactionStatus : 'new'
        return !transactionStatusTmp ? 'new' : transactionStatusTmp
    }

    prepareBlockConfirmations = (blockConfirmations) => {
        let tmp = 0
        if (typeof blockConfirmations !== 'undefined' && blockConfirmations > 0) {
            tmp = blockConfirmations.toString()
            if (blockConfirmations > 20) {
                tmp = '20+'
            }
        }
        return tmp
    }

    handleCopyAll = (valueToView, currencySymbolToView) => {
        const tx = this.props.transaction
        let text = ' ' + tx.transactionHash + ' ' + valueToView + ' ' + currencySymbolToView
        if (tx.transactionDirection === 'outcome') {
            text += ' => ' + tx.addressTo
        } else if (tx.transactionDirection === 'income') {
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
        const { colors } = this.context
        if (transaction.transactionOfTrusteeWallet && transaction.transactionOfTrusteeWallet === 1)
            return (
                <View style={{ marginLeft: 'auto', marginRight: 20 }}>
                    <CustomIcon name="shield" style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                </View>
            )
    }

    renderStatusCircle = (isStatus, status, transactionDirection) => {
        const { colors } = this.context
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

    transactionDetails = (tx) => {
        NavStore.goNext('TransactionScreen', {
            txData: {
                transaction: tx
            } 
        })
    }

    render() {
        const { styles } = this.state
        const { colors, isLight } = this.context

        const { cryptoCurrency, transaction } = this.props
        const { bseOrderData, createdAt } = transaction

        // if any of this will be reused the same way at details screen -> move to preformatWithBSEforShowInner
        const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)
        const transactionStatus = this.prepareStatus(transaction.transactionStatus)
        const transactionDirection = this.prepareDirection(transaction.transactionDirection)
        const wayType = this.prepareWayType(transaction.wayType)

        let value, valueToView, currencySymbolToView
        if (transaction.addressAmountSatoshi && (cryptoCurrency.currencyCode === 'BTC' || cryptoCurrency.currencyCode === 'DOGE')) {
            value = transaction.addressAmountSatoshi
            valueToView = transaction.addressAmountPrettyPrefix + ' ' + value
            currencySymbolToView = 'sat'
        } else {
            value = transaction.addressAmountPretty
            valueToView = transaction.addressAmountPrettyPrefix + ' ' + value
            currencySymbolToView = cryptoCurrency.currencySymbol
        }
        const basicValueToView = wayType !== 'EXCHANGE' && typeof transaction.basicAmountPretty !== 'undefined' ?
            ( transaction.basicCurrencySymbol + ' ' + transaction.basicAmountPretty ) : false

        const isStatus = transactionStatus === 'new' || transactionStatus === 'done_payin' || transactionStatus === 'wait_trade' || transactionStatus === 'done_trade' || transactionStatus === 'pending_payin'
        // end preformat


        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor



        // const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        // const subtitleMini = transaction.bseOrderData.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
        //     transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
        //         transaction.subtitle.slice(doteSlice + 1, transaction.subtitle.length) : transaction.subtitle : transaction.subtitle

        let subtitle = false
        let subtitleMini = ''
        if (bseOrderData) { // simplified in preformatWithBSEforShow
            if (bseOrderData.exchangeWayType !== 'BUY') {
                subtitle = true
            }
            if (bseOrderData.exchangeWayType === 'SELL') {
                subtitleMini = bseOrderData.outDestination
            } else if (bseOrderData.exchangeWayType === 'EXCHANGE'){
                subtitleMini = transactionDirection === 'income' ?
                    bseOrderData.requestedOutAmount.currencyCode : bseOrderData.requestedInAmount.currencyCode
            }
        }

        return (
            <View style={styles.transaction}>
                {this.renderStatusCircle(isStatus, transactionStatus, transactionDirection)}
                <View style={[styles.transaction__col, styles.transaction__col2]}>
                    <TouchableOpacity style={{ ...styles.transaction__top }} onLongPress={() => this.handleCopyAll(valueToView, currencySymbolToView)}>
                        <Text style={{ ...styles.transaction__top__title, color: colors.accountScreen.transactions.transactionTitleColor }}>
                            {strings(`account.transaction.${wayType.toLowerCase()}`)}
                        </Text>
                        {
                            !isStatus ?
                                <View style={{ marginRight: 4 }}>
                                    <MaterialCommunity name="progress-check"
                                        style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                                </View> : null
                        }
                        <Text style={[styles.transaction__top__type, { color: isStatus ? color : colors.accountScreen.transactions.transactionTitleColor }]}>
                            {isStatus ? strings(`account.transactionStatuses.${transactionStatus === 'confirming' ? 'confirming' : 'process'}`).toUpperCase() : blockConfirmations}
                        </Text>
                        {this.ifTxsTW()}
                    </TouchableOpacity>
                    <View style={{ ...styles.transaction__content, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                        <View style={{ ...styles.transaction__content__item, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                            <TouchableOpacity onPress={() => this.transactionDetails(transaction)}>
                                <GradientView
                                    style={[styles.transaction__item, styles.transaction__item_active ]}
                                    array={colors.accountScreen.transactions.transactionGradientArray}
                                    start={styles.transaction__item_bg.start}
                                    end={styles.transaction__item_bg.end}>
                                    <View style={{ ...styles.transaction__item__content, opacity: transactionStatus === 'fail' || transactionStatus === 'missing' ? 0.5 : null }}>
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
                                                                transform: [{ rotate: transactionDirection === 'outcome' ? "90deg" : "-90deg" }],
                                                                marginHorizontal: 7, marginBottom: Platform.OS === 'ios' ? -1 : null
                                                            }} />
                                                            <Text style={{ ...styles.transaction__item__subtitle, marginBottom: Platform.OS === 'ios' ? 2 : null }} >
                                                                {subtitleMini}
                                                            </Text>
                                                        </>
                                                        : null
                                                }
                                            </View>
                                            { basicValueToView ?
                                                <Text style={{ ...styles.transaction__item__subtitle, color: '#999999' }}>
                                                    {basicValueToView}
                                                </Text> : null}
                                        </View>
                                        <View style={{ flexDirection: 'column', alignItems: 'flex-end', width: '25%' }}>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {this.getTransactionDate(createdAt)}</Text>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {new Date(createdAt).toTimeString().slice(0, 5)}</Text>

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
        )
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

