/**
 * @version 0.43
 */
import React from 'react'
import {
    Platform,
    View,
    Text,
    Dimensions,
    PixelRatio,
} from 'react-native'
import Dash from 'react-native-dash'
import { BoxShadow } from 'react-native-shadow'
import _ from 'lodash'

import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'

import GradientView from '@app/components/elements/GradientView'
import CustomIcon from '@app/components/elements/CustomIcon'
import Circle from './Circle'

import NavStore from '@app/components/navigation/NavStore'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

class Transaction extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            styles: this.getPreparedStyles(),
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
    }

    getPreparedStyles() {
        const { transaction } = this.props
        const status = this.prepareStatus(transaction.transactionVisibleStatus)
        const direction = transaction.transactionDirection
        let styles
        if (/new|confirming|done_payin|wait_trade|done_trade|pending_payin/.test(status)) {
            styles = globalStyles.themes.new
        } else {
            styles = globalStyles.themes[direction]
        }
        const prepared = _.merge(globalStyles.default, styles)
        return {...prepared}
    }

    prepareStatus = (transactionStatus) => {
        // orderStatus => transactionStatus moved to preformatWithBSEforShow
        return typeof transactionStatus !== 'undefined' && transactionStatus ? transactionStatus : 'new'
    }

    prepareBlockConfirmations = (blockConfirmations) => {
        if (blockConfirmations === '' || blockConfirmations === false) {
            return ''
        }
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
        if (tx.transactionDirection === 'outcome' || tx.transactionDirection === 'swap_outcome') {
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
                <View style={{ marginLeft: transaction?.bseOrderData ? 10 : 'auto', marginRight: 20 }}>
                    <CustomIcon name="shield" style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                </View>
            )
    }

    isBSEorder = () => {
        const { styles } = this.state
        const { transaction } = this.props
        const { colors } = this.context
        if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData) {
            return (
                <View style={{ marginLeft: 'auto', marginRight: transaction.transactionOfTrusteeWallet && transaction.transactionOfTrusteeWallet === 1 ? 0 : 20 }}>
                    <CustomIcon name="exchange" style={{ ...styles.transaction__top__type__icon, color: colors.accountScreen.transactions.transactionTitleColor }} />
                </View>
            )
        }
    }

    renderStatusCircle = (isStatus, status, transactionDirection, visibleStatus, transactionFilterType, wayType) => {
        const { colors } = this.context
        const { styles } = this.state
        const { isFirst, cryptoCurrency } = this.props
        const { currencyColor } = cryptoCurrency

        let arrowIcon = <Feather name='arrow-up-right' style={{ marginTop: 1, color: colors.accountScreen.transactions.color, fontSize: 15 }} />
        let circleStyle = {}

        if (transactionDirection === 'income' || transactionDirection === 'claim' || transactionDirection === 'swap_income') {
            arrowIcon = <Feather name='arrow-down-left' style={{ marginTop: 1, color: colors.accountScreen.transactions.color, fontSize: 15 }} />
        }
        if (transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name='infinity' style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 10 }} />
            circleStyle = { backgroundColor: isStatus ? currencyColor : colors.accountScreen.transactions.circleBackground }
        }

        if (transactionFilterType === TransactionFilterTypeDict.SWAP) {
            arrowIcon = <CustomIcon name='swap' style={{ marginTop: 1, color: colors.accountScreen.transactions.color, fontSize: 16 }} />
        }

        if (wayType === TransactionFilterTypeDict.FEE) {
            arrowIcon = <CustomIcon name='feeTxScreen' style={{ marginTop: 1, color: colors.accountScreen.transactions.color, fontSize: 14 }} />
            circleStyle = { backgroundColor: isStatus ? currencyColor : colors.accountScreen.transactions.circle }
        }

        // if (status === 'fail' || status === 'missing' || status === 'replaced') {
        if (visibleStatus.toUpperCase() === 'MISSING' || visibleStatus.toUpperCase() === 'OUT_OF_ENERGY') {
            arrowIcon = <Feather name='x' style={{ marginTop: 1, color: colors.accountScreen.transactions.circleColor, fontSize: 15 }} />
            circleStyle = { backgroundColor: colors.accountScreen.transactions.circleBackground }
        }

        const statusTmp = status !== 'new' && status !== 'confirming' && status !== 'done_payin' && status !== 'wait_trade' && status !== 'done_trade' && status !== 'pending_payin' && status !== 'pending_payin'

        const marginTop = isFirst ? 50 : 0

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
                {/* <View style={{ position: 'absolute', top: 3, left: 23 }}>
                    <Dash
                        style={{
                            width: 2,
                            height,
                            marginTop: marginTop,
                            flexDirection: 'column'
                        }}
                        dashColor={colors.accountScreen.transactions.dashColor}
                        dashGap={3}
                        dashLength={3}
                    />
                </View> */}
                <Circle style={{
                    ...styles.transaction__circle__small, ...circleStyle,
                    backgroundColor: isStatus ? currencyColor : colors.accountScreen.transactions.circle,
                    width: 24,
                    height: 24
                }}>
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        borderRadius: 25,
                        backgroundColor: isStatus ? currencyColor : colors.accountScreen.transactions.circle,
                        ...circleStyle,
                        marginLeft: 0,
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
        NavStore.goNext('AccountTransactionScreen', {
            txData: {
                transaction: tx
            },
            source : 'Transaction.transactionDetails'
        })
    }

    render() {
        const { styles } = this.state
        const { colors } = this.context

        const { 
            cryptoCurrency, 
            transaction, 
            isBalanceVisible, 
            isBalanceVisibleTriggered, 
            originalVisibility 
        } = this.props

        const { createdAt } = transaction
        const { currencyColor, currencyCode } = cryptoCurrency

        // if any of this will be reused the same way at details screen -> move to preformatWithBSEforShowInner
        const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)
        const transactionStatus = this.prepareStatus(transaction.transactionStatus)
        const transactionBlockchainStatus = transaction.transactionBlockchainStatus
        const transactionDirection = transaction.transactionDirection
        const transactionFilterType = transaction.transactionFilterType
        const wayType = transaction.wayType // SWAP OUTCOME INCOME FEE !

        let value, valueToView, currencySymbolToView, basicValueToView
        const isFeeTx = transaction.addressAmount * 1 <= 0

        if (transaction.addressAmountSatoshi && (currencyCode === 'BTC' || currencyCode === 'DOGE')) {
            value = transaction.addressAmountSatoshi
            valueToView = transaction.addressAmountPrettyPrefix + ' ' + value
            currencySymbolToView = 'sat'
        } else {
            value = isFeeTx ? transaction.transactionFeePretty : transaction.addressAmountPretty
            valueToView = transaction.addressAmountPrettyPrefix + ' ' + value
            currencySymbolToView = isFeeTx ? transaction.feesCurrencySymbol : cryptoCurrency.currencySymbol
        }
        
        if (transactionFilterType !== TransactionFilterTypeDict.SWAP && typeof transaction.basicAmountPretty !== 'undefined') {
            if (isFeeTx) {
                basicValueToView = transaction.basicFeeCurrencySymbol + ' ' + transaction.basicFeePretty
            } else {
                basicValueToView = transaction.basicCurrencySymbol + ' ' + transaction.basicAmountPretty
            }
        } else {
            basicValueToView = false
        }

        const isStatus = transactionStatus === 'new' || transactionStatus === 'done_payin' || transactionStatus === 'wait_trade' || transactionStatus === 'done_trade' || transactionStatus === 'pending_payin'
        // end preformat

        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        return (
            <View style={styles.transaction}>
                {this.renderStatusCircle(isStatus, transactionStatus, transactionDirection, transaction.transactionVisibleStatus, transactionFilterType, wayType)}
                <View style={[styles.transaction__col, styles.transaction__col2]}>
                    <TouchableDebounce style={{ ...styles.transaction__top }} onLongPress={() => this.handleCopyAll(valueToView, currencySymbolToView)}>
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
                        <Text style={[styles.transaction__top__type, { color: isStatus ? currencyColor : colors.accountScreen.transactions.transactionTitleColor }]}>
                            {isStatus ? strings(`account.transactionStatuses.${transactionBlockchainStatus === 'confirming' ? 'confirming' : 'process'}`).toUpperCase() : blockConfirmations}
                        </Text>
                        {this.isBSEorder()}
                        {this.ifTxsTW()}
                    </TouchableDebounce>
                    <View style={{ ...styles.transaction__content, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                        <View style={{ ...styles.transaction__content__item, backgroundColor: colors.accountScreen.transactions.transactionContentBack }}>
                            <TouchableDebounce onPress={() => this.transactionDetails(transaction)}>
                                <GradientView
                                    style={[styles.transaction__item, styles.transaction__item_active]}
                                    array={colors.accountScreen.transactions.transactionGradientArray}
                                    start={styles.transaction__item_bg.start}
                                    end={styles.transaction__item_bg.end}
                                >
                                    <View style={{ ...styles.transaction__item__content, opacity: transactionStatus === 'fail' || transactionStatus === 'missing' || transactionStatus === 'out_of_energy' ? 0.5 : null }}>
                                        <View style={{ justifyContent: 'center', flex: 3 }}>
                                            {finalIsBalanceVisible ?
                                            <>
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                                    <Text style={{ ...styles.transaction__item__title, color: colors.common.text1 }} numberOfLines={1}>
                                                        {valueToView}
                                                    </Text>
                                                    <Text style={[styles.transaction__item__title__subtitle, { color: currencyColor }]}>
                                                        {currencySymbolToView}
                                                    </Text>
                                                </View>
                                                {basicValueToView ? (
                                                    <Text style={{ ...styles.transaction__item__subtitle, color: '#999999' }}>
                                                        {basicValueToView}
                                                    </Text>
                                                ) : null}
                                                </> 
                                                : 
                                                <View style={{ justifyContent: 'center', marginTop: Platform.OS === 'ios' ? 12 : 6 }}>
                                                    <Text style={{ ...styles.transaction__item__title, color: colors.common.text1, fontSize: 26  }} numberOfLines={1}>****</Text>
                                                </View>
                                                }
                                        </View>
                                        <View style={{ flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {this.getTransactionDate(createdAt)}</Text>
                                            <Text style={{ ...styles.transaction__data, color: colors.accountScreen.transactions.transactionData }}>
                                                {new Date(createdAt).toTimeString().slice(0, 5)}</Text>

                                        </View>
                                    </View>
                                </GradientView>
                            </TouchableDebounce>
                        </View>
                        {
                            isStatus && Platform.OS !== 'ios' && this.state.height && this.state.width ? (
                                <BoxShadow
                                    setting={{
                                        ...styles.shadow__item__android,
                                        color: currencyColor,
                                        height: this.state.height,
                                        width: this.state.width
                                    }}
                                    fromTransaction={1}
                                />
                            ) : (
                                <View style={styles.shadow}>
                                    <View style={{ ...styles.shadow__item, shadowColor: isStatus ? currencyColor : null }} />
                                </View>
                            )
                        }
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
            height: 110,

            overflow: 'hidden'
        },
        transaction__content: {
            position: 'relative',

            borderRadius: 18
        },
        transaction__content__item: {
            position: 'relative',

            borderRadius: 18,

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
            color: '#1EB3E4',
            paddingBottom: Platform.OS === 'ios' ? 0 : 1
        },
        transaction__item__subtitle: {
            fontFamily: 'Montserrat-SemiBold',
            fontSize: 12,
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
            lineHeight: 18,
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

