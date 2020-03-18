import React, { Component } from "react"
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Clipboard,
    Linking
} from 'react-native'

import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'

import _ from 'lodash'

import Circle from "./Circle"
import GradientView from '../../../components/elements/GradientView'
import LetterSpacing from '../../../components/elements/LetterSpacing'
import CustomIcon from '../../../components/elements/CustomIcon'

import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import utils from '../../../services/utils'
import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'
import Toast from '../../../services/Toast/Toast'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import Dash from 'react-native-dash'



class Transaction extends Component {

    constructor(props){
        super(props)
        this.state = {
            wayType: null,
            direction: null,
            status: null,
            blockConfirmations: null,
            value: null,
            valueToView: null,
            fiatValueToView: null,

            isExpanded: false,
            subContent: [],

            styles: {},

            show: false
        }
    }

    componentDidMount () {
        this.init(this.props.transaction)
    }

    init = (transaction) => {

        try {
            const { cryptocurrency, localCurrencySymbol } = this.props

            const subContent = []

            const blockConfirmations = this.prepareBlockConfirmations(transaction.block_confirmations)

            const status = this.prepareStatus(transaction.transaction_status, transaction.status)

            const statusToView = this.prepareStatusToView(status, transaction)
            statusToView ? subContent.push(statusToView) : null

            // const fromToView = this.prepareFromToView(cryptocurrency, transaction)
            // fromToView ? subContent.push(fromToView) : null
            //
            // const toToView = this.prepareToToView(cryptocurrency, transaction)
            // toToView ? subContent.push(toToView) : null

            const date = this.prepareDate(transaction.created_at)
            subContent.push(date)

            const transactionDestinationTag = this.prepareTransactionDestinationTag(transaction.transaction_json, cryptocurrency.currencyCode)
            transactionDestinationTag ? subContent.push(transactionDestinationTag) : null

            const transactionFeeToView = this.prepareTransactionFeeToView(transaction.transaction_fee, cryptocurrency.currencyCode)
            transactionFeeToView ? subContent.push(transactionFeeToView) : null

            const transactionHashToView = this.prepareTransactionHashToView(cryptocurrency, transaction)
            transactionHashToView ? subContent.push(transactionHashToView) : null

            const direction = this.prepareType(transaction.transaction_direction)

            const wayType = this.prepareWayType(transaction.exchangeWayType)

            const styles = JSON.parse(JSON.stringify(this.prepareStyles(status, direction)))

            const value = this.prepareValue(transaction.address_amount, cryptocurrency.currencyCode)

            const valueToView = this.prepareValueToView(value, cryptocurrency.currencySymbol, direction)

            const fiatValueToView = this.prepareFiatValueToView(value, cryptocurrency.currency_rate_usd, localCurrencySymbol)


            this.setState({
                direction,
                wayType,
                status,
                subContent,
                styles,
                blockConfirmations,
                value,
                valueToView,
                fiatValueToView,

                show: true
            })
        } catch (e) {
            console.log(e)
            Log.err(`AccountScreen.Transaction/init error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(transaction)}`)
        }
    }

    static getDerivedStateFromProps(nextProps, prevState){

        if(typeof nextProps.transaction !== "undefined" && typeof prevState.transaction !== "undefined" && typeof prevState.transaction.prevState !== "undefined" && typeof nextProps.transaction.block_confirmations !== "undefined" && nextProps.transaction.block_confirmations !== prevState.transaction.block_confirmations){
            return { transaction: nextProps.transaction}
        }
        else return null
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevProps.transaction.block_confirmations !== this.props.transaction.block_confirmations){
            this.init(this.props.transaction)
        }
    }

    handleLink = (link) => {

        Linking.canOpenURL(link).then(supported => {
            if (supported) {
                Linking.openURL(link)
            } else {
                Log.err('Account.AccountScreen Dont know how to open URI', `${link}`)
            }
        })
    }

    prepareTransactionFeeToView = (transactionFee, currencyCode) => {

        if(transactionFee){
            const { localCurrencySymbol, cryptocurrencyList } = this.props

            let extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            extendCurrencyCode = typeof extendCurrencyCode.addressCurrencyCode !== 'undefined' ? BlocksoftDict.Currencies[extendCurrencyCode.addressCurrencyCode].currencyCode : currencyCode

            let cryptocurrency = cryptocurrencyList.filter(item => item.currencyCode === extendCurrencyCode)
            cryptocurrency = cryptocurrency[0]

            const prettieFee = BlocksoftPrettyNumbers.setCurrencyCode(cryptocurrency.currencyCode).makePrettie(transactionFee)
            const feeInUsd = prettieFee * cryptocurrency.currency_rate_usd

            return {
                title: strings(`account.transaction.fee`),
                description: `${prettieFee} ${cryptocurrency.currencySymbol} (${localCurrencySymbol} ${utils.prettierNumber(FiatRatesActions.toLocalCurrency(feeInUsd, false), 2)})`,
            }
        }

        return null
    }

    prepareTransactionDestinationTag = (transactionJson, currencyCode) => {
        if(typeof transactionJson !== "undefined" && transactionJson !== null && typeof transactionJson.memo !== "undefined"){
            if(currencyCode === "XRP"){
                return {
                    title: strings(`account.transaction.destinationTag`),
                    description: transactionJson.memo.toString()
                }
            }
        }

        return null
    }

    prepareStatusToView = (status, transaction) => {

        if(transaction.exchangeWayType){
            return {
                title: strings(`account.transaction.status`),
                description: strings(`exchange.ordersStatus.${transaction.exchangeWayType.toLowerCase()}.${transaction.status}`),
            }
        }

        return {
            title: strings(`account.transaction.status`),
            description: strings(`account.transactionStatuses.${status}`)
        }
    }

    prepareFromToView = (cryptocurrency, transaction) => {

        if(transaction.address_from){
            return {
                title: strings(`account.transaction.from`),
                description: transaction.address_from,
                isLink: true,
                linkUrl: cryptocurrency.currencyExplorerLink + transaction.address_from
            }
        }

        return null
    }

    prepareToToView = (cryptocurrency, transaction) => {

        if(transaction.address_to){
            return {
                title: strings(`account.transaction.to`),
                description: transaction.address_to,
                isLink: true,
                linkUrl: cryptocurrency.currencyExplorerLink + transaction.address_to
            }
        }

        return null
    }

    prepareTransactionHashToView = (cryptocurrency, transaction) => {

        if(transaction.transaction_hash){
            return {
                title: strings(`account.transaction.txHash`),
                description: transaction.transaction_hash,
                isLink: true,
                linkUrl: cryptocurrency.currencyExplorerTxLink + transaction.transaction_hash
            }
        }

        return null
    }

    prepareType = (transactionDirection) => transactionDirection

    prepareWayType = (wayType) => typeof wayType !== "undefined" ? wayType : null

    prepareStatus = (transactionStatus, orderStatus) => {

        if(orderStatus){
            return orderStatus
        }

        const transactionStatusTmp = typeof(transactionStatus) !== 'undefined' ? transactionStatus : 'new'
        return !transactionStatusTmp ? 'new' : transactionStatusTmp
    }

    prepareStyles = (status, direction) => {

        let styles = globalStyles.themes[direction]

        if(status === "new" || status === "confirming" || status === "done_payin" || status === "wait_trade" || status === "done_trade" || status === "pending_payin") styles = globalStyles.themes.new

        return _.merge(globalStyles.default, styles)
    }

    prepareValue = (value, currencyCode) => {
        try {
            return value
        } catch (e) {
            Log.err('AccountScreen/Transaction.prepareValueToView error ' + e.message)
        }
    }

    prepareValueToView = (value, currencySymbol, direction) => `${direction === "outcome" ? "-" : "+"} ${value} ${currencySymbol}`


    prepareFiatValueToView = (value, rate, localCurrencySymbol) => {

        const { cryptocurrency } = this.props

        return localCurrencySymbol + " " + ( localCurrencySymbol === "₴" && cryptocurrency.currencyCode === "ETH_UAX" ? value : utils.prettierNumber(FiatRatesActions.toLocalCurrency(value * rate, false),2))
    }

    prepareDate = (createdAt) => {

        const tmp = {
            title: strings('account.transaction.date'),
            description: "..."
        }

        if(createdAt)
            tmp.description = new Date(createdAt).toLocaleTimeString() + " " + new Date(createdAt).toLocaleDateString()

        return tmp
    }

    prepareBlockConfirmations = (blockConfirmations) => {

        let tmp = 0

        if (typeof blockConfirmations !== "undefined" && blockConfirmations > 0) {

            tmp = blockConfirmations.toString()

            if (blockConfirmations > 20)
                tmp = "20+"
        }

        return tmp
    }


    toggleIsExpanded = () => this.setState((state) => { return { isExpanded: !state.isExpanded }})

    renderToggleArrow = () => {

        const { isExpanded, styles } = this.state

        const settings = {}

        settings.style = styles.transaction__item__arrow_down
        settings.arrowName = "chevron-down"

        if(isExpanded){
            settings.style = styles.transaction__item__arrow_up
            settings.arrowName = "chevron-up"
        }

        return (
            <Circle style={styles.transaction__circle__big}>
                <Feather name={settings.arrowName} style={[styles.transaction__item__arrow, settings.style]} />
            </Circle>
        )
    }

    subContentTemplate = (item, key) => {
        const { styles } = this.state

        const onPressCallback = typeof item.isLink !== "undefined" && item.isLink ? () => this.handleLink(item.linkUrl) : () => this.handleSubContentPress(item)
        const onLongPressCallback = typeof item.isLink !== "undefined" && item.isLink ? () => this.handleSubContentPress({ description: item.linkUrl }) : () => this.handleSubContentPress(item)

        return (
            <TouchableOpacity onPress={onPressCallback} onLongPress={onLongPressCallback} key={key}>
                <View style={styles.transaction__item__subcontent}>
                    <View>
                        <Text style={styles.transaction__item__subcontent__title}>
                            { item.title }
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.transaction__item__subcontent__text, item.isLink ? styles.transaction__item__subcontent__text_link : null ]}>{ item.description.split('').join(String.fromCodePoint(parseInt("2006", 16))) }</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    handleSubContentPress = (item) => {
        Clipboard.setString(item.description)
        Toast.setMessage(strings('toast.copied')).show()
    }

    ifTxsTW = () => {

        const { styles } = this.state
        const { transaction } = this.props

        if(transaction.transaction_of_trustee_wallet && transaction.transaction_of_trustee_wallet === 1)
            return <View style={{ marginLeft: "auto", marginRight: 20 }}><CustomIcon name="shield" style={styles.transaction__top__type__icon}/></View>
    }

    renderStatusCircle = (status, transactionDirection) => {
        const { styles } = this.state
        const { amountToView, index, transactions } = this.props

        const arrowName = transactionDirection === "outcome" ? "arrow-up" : "arrow-down"
        const statusTmp = status !== "new" && status !== "confirming" && status !== "done_payin" && status !== "wait_trade" && status !== "done_trade" && status !== "pending_payin" && status !== "pending_payin"

        return (
            <View style={[styles.transaction__col, styles.transaction__col1, { overflow: "visible", marginTop: !statusTmp ? 1 : 0 }]}>
                {
                    amountToView !== index + 1 && transactions.length !== index + 1 ?
                        <View style={{ position: "absolute", top: 3, left: 23, }}>
                            <Dash style={{ width: 2, height: 1000, flexDirection: "column" }} dashColor={"#E3E6E9"} dashGap={3} dashLength={3} />
                        </View> : null
                }
                <Circle style={{...styles.transaction__circle__small, width: 16, height: 16}}>
                    <View style={{ marginLeft: Platform.OS === "ios" ? 1 : 0 }}>
                        <FontAwesome5 name={arrowName} style={{ color: '#f4f4f4', fontSize: 10 }} />
                    </View>
                </Circle>
            </View>
        )
    }

    render(){

        const {
            wayType,
            direction,
            status,
            subContent,
            valueToView,
            isExpanded,
            blockConfirmations,
            fiatValueToView,
            styles,
            show
        } = this.state

        const { transaction } = this.props
        const isStatus = status === "new" || status === "done_payin" || status === "wait_trade" || status === "done_trade" || status === "pending_payin"

        return show ? (
            <View style={styles.transaction}>
                { this.renderStatusCircle(status, transaction.transaction_direction) }
                <View style={[styles.transaction__col, styles.transaction__col2]}>
                    <View style={styles.transaction__top}>
                        <Text style={styles.transaction__top__title}>
                            { strings(`account.transaction.${wayType === null ? direction : wayType.toLowerCase()}`) }
                        </Text>
                        {
                            !isStatus ?
                                <View style={{ marginRight: 4 }}>
                                    <MaterialCommunity name="progress-check" style={styles.transaction__top__type__icon} />
                                </View> : null
                        }
                        <Text style={styles.transaction__top__type}>
                            { isStatus ? strings(`account.transactionStatuses.${status === "confirming" ? "confirming" : "new" }`) : blockConfirmations }
                        </Text>
                        { this.ifTxsTW() }
                    </View>
                    <View style={styles.transaction__content}>
                        <View style={styles.transaction__content__item}>
                            <TouchableOpacity onPress={this.toggleIsExpanded}>
                                <GradientView style={[styles.transaction__item, isExpanded ? styles.transaction__item_active : null ]} array={styles.transaction__item_bg.array} start={styles.transaction__item_bg.start} end={styles.transaction__item_bg.end}>
                                    <View style={styles.transaction__item__content}>
                                        <View style={{ justifyContent: "center" }}>
                                            <Text style={styles.transaction__item__title}>
                                                { valueToView }
                                            </Text>
                                            {
                                                wayType === null ?
                                                    <Text style={styles.transaction__item__subtitle}>
                                                        { fiatValueToView }
                                                    </Text> : null
                                            }
                                        </View>
                                        { this.renderToggleArrow() }
                                    </View>
                                    <View style={styles.line}>
                                        <View style={styles.line__item} />
                                    </View>
                                    {
                                        isExpanded ? subContent.map((item, key) => this.subContentTemplate(item, key)) : null
                                    }
                                </GradientView>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.shadow}>
                            <View style={styles.shadow__item} />
                        </View>
                    </View>
                </View>
            </View>
        ) : <View />
    }
}

export default Transaction


const globalStyles = {
    default: {
        transaction: {
            flexDirection: "row",
        },
        transaction__content: {
            position: "relative",

            marginTop: 8,

            backgroundColor: "#fff",
            borderRadius: 16,
        },
        transaction__content__item: {
            position: "relative",

            backgroundColor: "#fff",
            borderRadius: 16,

            zIndex: 2
        },
        transaction__col1: {
            alignItems: "center",

            width: 48,
            overflow: "hidden"
        },
        transaction__col2: {
            flex: 1,

            paddingBottom: 20,
            marginRight: 16,
        },
        transaction__circle__small: {
            width: 10,
            height: 10,
            border: 0,
        },
        transaction__circle__big: {
            width: 20,
            height: 20,
            border: 3,
            backgroundInnerColor: "#f6f6f6"
        },
        transaction__top: {
            flexDirection: "row",
            alignItems: "center"
        },
        transaction__top__title: {
            marginRight: 8,

            fontFamily: 'Montserrat-Bold',
            fontSize: 12,
            color: "#404040"
        },
        transaction__top__type__icon: {
            marginTop: 2,
            fontSize: 14,

            color: "#5C5C5C"
        },
        transaction__top__type: {
            marginTop: Platform.OS === "android" ? 2.5 : 0.5,

            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: "#5C5C5C"
        },
        transaction__top__confirmation: {

        },
        transaction__item: {
            maxHeight: 62,
            paddingHorizontal: 16,

            borderRadius: 16,

            overflow: "hidden"
        },
        transaction__item_active: {
            maxHeight: 1000,
        },
        transaction__item__content: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",

            height: 62,
        },
        transaction__item_bg: {
            array: ['#fff', '#f2f2f2'],
            start: { x: 1, y: 0 },
            end: { x: 1, y: 1 }
        },
        transaction__item__title: {
            fontFamily: 'Montserrat-Bold',
            fontSize: 18,
        },
        transaction__item__subtitle: {
            fontFamily: 'SFUIDisplay-Semibold',
            fontSize: 12,
            color: "#999999"
        },
        circle: {

        },
        transaction__item__arrow: {
            marginLeft:  Platform.OS === "ios" ? 1 : 0,

            fontSize: 16,
        },
        transaction__item__arrow_up: {
            marginTop: 0.5,
        },
        transaction__item__arrow_down: {
            marginTop: 1.5,
        },
        transaction__item__subcontent: {
            marginBottom: 16,
            paddingHorizontal: 30
        },
        transaction__item__subcontent__title: {
            marginBottom: 4,

            fontFamily: 'Montserrat-Bold',
            fontSize: 14,
            color: "#404040"
        },
        transaction__item__subcontent__text: {
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: "#999999",
        },
        transaction__item__subcontent__text_link: {
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: "#864DD9",
            textDecorationLine: "underline",
            textDecorationStyle: "solid",
            textDecorationColor: "#864DD9"
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

            backgroundColor: "#fff",

            borderRadius: 16,

            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 5,
            },
            shadowOpacity: 0.34,
            shadowRadius: 6.27,

            elevation: 10,
        },
        line: {
            height: 1,
            marginBottom: 11,

            marginHorizontal: 56,

            backgroundColor: "#E3E6E9"
        }
    },
    themes: {
        new: {
            transaction__circle__small: {
                backgroundColor: "#F59E6C"
            },
            transaction__circle__big: {
                backgroundColor: "#F59E6C",
            },
            transaction__item__title: {
                color: "#F59E6C"
            },
            transaction__item__arrow: {
                color: "#F59E6C"
            },
        },
        outcome: {
            transaction__circle__small: {
                backgroundColor: "#E77CA3"
            },
            transaction__circle__big: {
                backgroundColor: "#E77CA3",
            },
            transaction__item__title: {
                color: "#E77CA3"
            },
            transaction__item__arrow: {
                color: "#E77CA3"
            },
        },
        income: {
            transaction__circle__small: {
                backgroundColor: "#864DD9"
            },
            transaction__circle__big: {
                backgroundColor: "#864DD9",
            },
            transaction__item__title: {
                color: "#864DD9"
            },
            transaction__item__arrow: {
                color: "#864DD9"
            },
        }
    }
}
