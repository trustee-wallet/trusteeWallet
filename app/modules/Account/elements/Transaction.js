/**
 * @version 0.9
 */
import React, {Component} from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput, Dimensions, PixelRatio
} from 'react-native'
import {BoxShadow} from 'react-native-shadow'

import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'
import Dash from 'react-native-dash'
import AsyncStorage from '@react-native-community/async-storage'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import _ from 'lodash'

import Circle from './Circle'
import GradientView from '../../../components/elements/GradientView'
import CustomIcon from '../../../components/elements/CustomIcon'
import LightButton from '../../../components/elements/LightButton'

import NavStore from '../../../components/navigation/NavStore'

import copyToClipboard from '../../../services/UI/CopyToClipboard/CopyToClipboard'
import Log from '../../../services/Log/Log'
import Toast from '../../../services/UI/Toast/Toast'
import {strings} from '../../../services/i18n'

import transactionDS from '../../../appstores/DataSource/Transaction/Transaction'
import {setExchangeData} from '../../../appstores/Stores/Exchange/ExchangeActions'
import {setSendData} from '../../../appstores/Stores/Send/SendActions'
import {showModal} from '../../../appstores/Stores/Modal/ModalActions'

import UIDict from '../../../services/UIDict/UIDict'

import updateTradeOrdersDaemon from '../../../daemons/back/UpdateTradeOrdersDaemon'
import Ionicons from "react-native-vector-icons/Ionicons";

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
            subContent: [],

            styles: {},

            show: false,
            removed: false,

            commentEditable: false
        }
    }

    componentDidMount() {
        this.init(this.props.transaction)
    }

    init = (transaction) => {

        try {
            const {cryptoCurrency} = this.props

            const subContent = []

            const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)

            const status = this.prepareStatus(transaction.transactionStatus, transaction.status)

            const orderIdToView = this.prepareOrderIdToView(transaction)
            orderIdToView ? subContent.push(orderIdToView) : null

            const statusToView = this.prepareStatusToView(status, transaction)
            statusToView ? subContent.push(statusToView) : null

            const commentToView = this.prepareCommentToView(transaction.transactionJson)
            commentToView ? subContent.push(commentToView) : null

            const outDestinationCardToView = this.prepareOutDestinationCard(transaction)
            outDestinationCardToView ? subContent.push(outDestinationCardToView) : null

            const fromToView = this.prepareAddressFromToView(cryptoCurrency, transaction)
            fromToView ? subContent.push(fromToView) : null

            const addressToToView = this.prepareAddressToToView(cryptoCurrency, transaction, transaction.exchangeWayType)
            addressToToView ? subContent.push(addressToToView) : null

            const date = this.prepareDate(transaction.createdAt)
            subContent.push(date)

            const transactionDestinationTag = this.prepareTransactionDestinationTag(transaction.transactionJson, cryptoCurrency.currencyCode)
            transactionDestinationTag ? subContent.push(transactionDestinationTag) : null

            const transactionNonce = this.prepareTransactionNonce(transaction.transactionJson, cryptoCurrency.currencyCode)
            transactionNonce ? subContent.push(transactionNonce) : null

            const transactionDelegatedNonce = this.prepareTransactionDelegatedNonce(transaction.transactionJson, cryptoCurrency.currencyCode)
            transactionDelegatedNonce ? subContent.push(transactionDelegatedNonce) : null

            const transactionFeeToView = this.prepareTransactionFeeToView(transaction)
            transactionFeeToView ? subContent.push(transactionFeeToView) : null

            const transactionHashToView = this.prepareTransactionHashToView(cryptoCurrency, transaction)
            transactionHashToView ? subContent.push(transactionHashToView) : null

            const transactionsOtherHashesToView = this.prepareTransactionsOtherHashesToView(cryptoCurrency, transaction)
            transactionsOtherHashesToView ? subContent.push(transactionsOtherHashesToView) : null

            const direction = this.prepareType(transaction.transactionDirection)

            const wayType = this.prepareWayType(transaction.exchangeWayType)

            const styles = JSON.parse(JSON.stringify(this.prepareStyles(status, direction)))

            let value, valueToView, currencySymbolToView

            if (transaction.addressAmountSatoshi && (cryptoCurrency.currencyCode === 'BTC' || cryptoCurrency.currencyCode === 'DOGE')) {
                value = this.prepareValue(transaction.addressAmountSatoshi, cryptoCurrency.currencyCode)
                valueToView = this.prepareValueToView(value, 'SAT', direction)
                currencySymbolToView = 'sat'
            } else {
                value = this.prepareValue(transaction.addressAmountPretty, cryptoCurrency.currencyCode)
                valueToView = this.prepareValueToView(value, cryptoCurrency.currencySymbol, direction)
                currencySymbolToView = cryptoCurrency.currencySymbol
            }


            const basicValueToView = transaction.basicCurrencySymbol + ' ' + transaction.basicAmountPretty


            this.setState({
                direction,
                wayType,
                status,
                subContent,
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

    static getDerivedStateFromProps(nextProps, prevState) {

        if (typeof nextProps.transaction !== 'undefined' && typeof prevState.transaction !== 'undefined' && typeof prevState.transaction.prevState !== 'undefined' && typeof nextProps.transaction.block_confirmations !== 'undefined' && nextProps.transaction.block_confirmations !== prevState.transaction.block_confirmations) {
            return {transaction: nextProps.transaction}
        } else return null
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.transaction.blockConfirmations !== this.props.transaction.blockConfirmations) {
            this.init(this.props.transaction)
        }
    }

    prepareAddressToToView = (cryptoCurrency, transaction, exchangeWayType) => {
        if (typeof transaction.addressTo !== 'undefined' && transaction.addressTo && typeof exchangeWayType === 'undefined') {
            return {
                title: strings(`account.transaction.to`),
                description: transaction.addressTo.toString()
            }
        }

        return false
    }

    prepareAddressFromToView = (cryptoCurrency, transaction, exchangeWayType) => {
        if (typeof transaction.addressFrom !== 'undefined' && transaction.addressFrom && transaction.addressFrom.indexOf(',') === -1 && typeof exchangeWayType === 'undefined') {
            return {
                title: strings(`account.transaction.from`),
                description: transaction.addressFrom.toString()
            }
        }

        return false
    }

    prepareOrderIdToView = (transaction) => {

        if (typeof transaction.orderId !== 'undefined') {
            return {
                title: strings(`account.transaction.orderId`),
                description: transaction.orderId.toString()
            }
        }

        return false
    }

    prepareCommentToView = (transactionJson) => {
        if (typeof transactionJson !== 'undefined' && transactionJson !== null && typeof transactionJson.comment !== 'undefined') {
            return {
                title: strings(`send.comment`),
                description: transactionJson.comment,
                config: {
                    isEditable: true
                }
            }
        }

        return null
    }

    prepareOutDestinationCard = (transaction) => {

        if (typeof transaction.outDestination !== 'undefined' && transaction.outDestination !== null && transaction.outDestination.includes('***')) {
            if (transaction.outDestination.includes('+')) {
                return {
                    title: strings(`account.transaction.phoneDestination`),
                    description: transaction.outDestination.toString()
                }
            } else if (transaction.outDestination.substr(0,1) === 'U') {
                return {
                    title: strings(`account.transaction.advAccountDestination`),
                    description: transaction.outDestination.toString()
                }
            } else {
                return {
                    title: strings(`account.transaction.cardNumberDestination`),
                    description: transaction.outDestination.toString()
                }
            }
        }

        return null
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

    prepareTransactionFeeToView = (transaction) => {

        if (!transaction || typeof transaction.transactionFee === 'undefined' || !transaction.transactionFee) return null

        let title = strings(`account.transaction.fee`)
        if (transaction.transactionDirection === 'income') {
            title = strings(`account.transaction.feeIncome`)
        }
        return {
            title,
            description: `${transaction.transactionFeePretty} ${transaction.feesCurrencySymbol} (${transaction.basicFeeCurrencySymbol} ${transaction.basicFeePretty})`
        }

    }

    prepareTransactionDestinationTag = (transactionJson, currencyCode) => {
        if (typeof transactionJson !== 'undefined' && transactionJson !== null && typeof transactionJson.memo !== 'undefined') {
            if (currencyCode === 'XRP') {
                return {
                    title: strings(`account.transaction.destinationTag`),
                    description: transactionJson.memo.toString()
                }
            }
        }

        return null
    }

    prepareTransactionNonce = (transactionJson, currencyCode) => {
        if (typeof transactionJson !== 'undefined' && transactionJson !== null && typeof transactionJson.nonce !== 'undefined') {
            return {
                title: strings(`account.transaction.nonce`),
                description: transactionJson.nonce.toString()
            }
        }

        return null
    }

    prepareTransactionDelegatedNonce = (transactionJson, currencyCode) => {
        if (typeof transactionJson !== 'undefined' && transactionJson !== null && typeof transactionJson.delegatedNonce !== 'undefined') {
            return {
                title: strings(`account.transaction.delegatedNonce`),
                description: transactionJson.delegatedNonce.toString()
            }
        }

        return null
    }

    prepareStatusToView = (status, transaction) => {
        if (transaction.exchangeWayType) {
            return {
                title: strings(`account.transaction.status`),
                description: strings(`exchange.ordersStatus.${transaction.exchangeWayType.toLowerCase()}.${transaction.status}`)
            }
        }

        return {
            title: strings(`account.transaction.status`),
            description: strings(`account.transactionStatuses.${status}`)

            // description: strings(`exchange.ordersStatus.error_order`)
        }
    }

    prepareTransactionHashToView = (cryptoCurrency, transaction) => {

        if (!transaction.transactionHash) return null

        let linkUrl = cryptoCurrency.currencyExplorerTxLink + transaction.transactionHash
        if (linkUrl.indexOf('?') === -1) {
            linkUrl += '?from=trustee'
        }
        return {
            title: strings(`account.transaction.txHash`),
            description: transaction.transactionHash,
            isLink: true,
            linkUrl
        }
    }

    prepareTransactionsOtherHashesToView = (cryptoCurrency, transaction) => {

        if (!transaction.transactionsOtherHashes) return null

        let tmp = transaction.transactionsOtherHashes.split(',')
        tmp = tmp[0]

        let linkUrl = cryptoCurrency.currencyExplorerTxLink + tmp
        if (linkUrl.indexOf('?') === -1) {
            linkUrl += '?from=trustee'
        }
        return {
            title: strings(`account.transaction.replacedTxHash`),
            description: tmp,
            isLink: true,
            linkUrl
        }
    }

    prepareType = (transactionDirection) => {

        return transactionDirection
    }

    prepareWayType = (wayType) => {

        const {transaction} = this.props

        if (typeof transaction.outDestination !== 'undefined' && transaction.outDestination !== null && transaction.outDestination.includes('+')) {
            return 'MOBILE_PHONE'
        }

        return typeof wayType !== 'undefined' ? wayType : null
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

    prepareValueToView = (value, currencySymbol, direction) => `${(direction === 'outcome' || direction === 'self') ? '-' : '+'} ${value}`

    prepareDate = (createdAt) => {

        const tmp = {
            title: strings('account.transaction.date'),
            description: '...'
        }

        if (createdAt)
            tmp.description = new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString()

        return tmp
    }

    prepareBlockConfirmations = (blockConfirmations) => {

        let tmp = 0

        if (typeof blockConfirmations !== 'undefined' && blockConfirmations > 0) {

            tmp = blockConfirmations.toString()

            if (blockConfirmations > 20)
                tmp = '20+'
        }

        return tmp
    }


    toggleIsExpanded = () => this.setState((state) => {
        return {isExpanded: !state.isExpanded}
    })

    handleCopyAll = () => {
        const {valueToView, currencySymbolToView} = this.state
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

    renderToggleArrow = (color) => {

        const {isExpanded, styles} = this.state

        const settings = {}

        settings.style = styles.transaction__item__arrow_down
        settings.arrowName = 'chevron-down'

        if (isExpanded) {
            settings.style = styles.transaction__item__arrow_up
            settings.arrowName = 'chevron-up'
        }

        return (
            // <View style={[styles.transaction__circle__big, globalStyles.themes.outcome.transaction__circle__big.borderColor={color}]}>
            <View style={{...styles.transaction__circle__big, borderColor: color}}>
                <Feather name={settings.arrowName}
                         style={[styles.transaction__item__arrow, settings.style, color = {color}]}/>
            </View>
        )
    }

    onLongPressEditableCallback = () => {
        this.setState({
            commentEditable: true
        })

        this.commentInput.focus()
    }

    onBlurComment = (item) => {
        try {
            this.setState({
                commentEditable: false
            })

            const {id: updateID, transactionJson} = this.props.transaction

            let comment = ''
            if (typeof item.description !== 'undefined') {
                comment = item.description.replace(/[\u2006]/g, '').split('').join('')
                comment = comment.length > 255 ? comment.slice(0, 255) : comment
            }
            const transaction = {
                transactionJson: {
                    ...transactionJson,
                    comment
                }
            }

            if (transactionJson.comment !== comment) {
                transactionDS.saveTransaction(transaction, updateID, 'onBlurComment')
            }
        } catch (e) {
            Log.err(`AccountScreen.Transaction/onBlurComment error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(this.props.transaction)}`)
        }
    }

    subContentTemplate = (item, key) => {
        const {styles, commentEditable} = this.state
        const {cryptoCurrency} = this.props

        const onPressCallback = typeof item.isLink !== 'undefined' && item.isLink ? () => this.handleLink(item.linkUrl) : () => this.handleSubContentPress(item)
        const onLongPressCallback = typeof item.isLink !== 'undefined' && item.isLink ? () => this.handleSubContentPress({description: item.linkUrl}) : () => this.handleSubContentPress(item)

        const descriptionValue = typeof item.description !== 'undefined' ? item.description.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16))) : ''
        // const descriptionValue = typeof item.description !== 'undefined' ? item.description : ''

        // letterSpacing with js
        // const descriptionPrep = typeof item.description !== 'undefined' ? item.description.split('').join(String.fromCodePoint(parseInt('2006', 16))) : ''
        const descriptionPrep = typeof item.description !== 'undefined' ? item.description : ''

        if (typeof item.config !== 'undefined' && item.config.isEditable) {

            const descriptionClean = typeof item.description !== 'undefined' ? item.description.replace(/[\u2006]/g, '').split('').join('') : ''
            const length = descriptionClean.length
            const isTextareaStyle = {}
            const isTextarea = true // can be line dependent
            const lines = Math.ceil(length / 20)
            const height = 22 + 14 * lines
            isTextareaStyle.maxHeight = height * 1.2
            isTextareaStyle.minHeight = height
            isTextareaStyle.paddingVertical = 3
            isTextareaStyle.paddingLeft = 0
            // isTextareaStyle.marginTop = 10
            isTextareaStyle.paddingBottom = 0

            return (
                <TouchableOpacity activeOpacity={.7} onLongPress={this.onLongPressEditableCallback} key={key}>
                    <View style={styles.transaction__item__subcontent}>
                        <View>
                            <Text style={styles.transaction__item__subcontent__title}>
                                {item.title}
                            </Text>
                        </View>
                        <View style={{height: height, marginVertical: 0}}>
                        {/*<View>*/}
                            <TextInput ref={ref => this.commentInput = ref}
                                       style={{...styles.transaction__item__subcontent__text, ...isTextareaStyle}}
                                       // placeholder={strings(`account.transaction.empty`).split('').join(String.fromCodePoint(parseInt('2006', 16)))}
                                       placeholder={strings(`account.transaction.empty`)}
                                       placeholderTextColor='#999999'
                                       editable={commentEditable}
                                       autoFocus={commentEditable}
                                       autoCorrect={false}
                                       spellCheck={false}
                                       selectionColor={'#404040'}
                                       onBlur={() => this.onBlurComment(this.state.subContent[key])}
                                       multiline={isTextarea}
                                       showSoftInputOnFocus={true}
                                       onChangeText={(value) => {

                                           const subContent = this.state.subContent

                                           subContent[key] = {
                                               ...subContent[key],
                                               description: value
                                           }

                                           this.setState({
                                               subContent
                                           })
                                       }}
                                       value={descriptionValue}/>
                            {/* <Text style={[, item.isLink ? styles.transaction__item__subcontent__text_link : null ]}> */}
                            {/*    { item.description.split('').join(String.fromCodePoint(parseInt("2006", 16))) } */}
                            {/* </Text> */}
                        </View>
                    </View>
                </TouchableOpacity>
            )
        }

        // ??? @misha
        // textDecorationColor.settings.colors.mainColor
        // color: UIDict[cryptoCurrency.currencyCode].colors.mainColor
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const textDecorationColor = dict.settings.colors.mainColor
        const color = dict.settings.colors.mainColor

        return (
            <TouchableOpacity onPress={onPressCallback} onLongPress={onLongPressCallback} key={key}>
                <View style={styles.transaction__item__subcontent}>
                    <View>
                        <Text style={styles.transaction__item__subcontent__title}>
                            {item.title}
                        </Text>
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        <Text style={[styles.transaction__item__subcontent__text, item.isLink ? {
                            ...styles.transaction__item__subcontent__text_link,
                            textDecorationColor,
                            color
                        } : null]} numberOfLines={4}>{descriptionPrep}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    renderReplaceByFeeIcon = () => {
        const {cryptoCurrency, transaction} = this.props

        const isETH = cryptoCurrency.currencyCode === 'ETH' || cryptoCurrency.currencyCode.indexOf('ETH_') === 0
        if ((cryptoCurrency.currencyCode === 'BTC' || cryptoCurrency.currencyCode === 'USDT' || isETH) && transaction.transactionStatus === 'new') {

            if (cryptoCurrency.currencyCode === 'BTC' && transaction.addressTo.indexOf('OMNI') !== -1) {
                return
            }

            if (isETH && transaction.transactionDirection === 'income') {
                return
            }

            const icon = (props) => <Feather name='refresh-ccw' {...props} />

            return (
                <View style={{alignItems: 'center'}}>
                    <TouchableOpacity
                        style={{alignItems: 'center', padding: 20, paddingHorizontal: 30, paddingTop: 0}}
                        onPress={this.handleReplaceByFeeBtn}>
                        <LightButton Icon={(props) => icon(props)} iconStyle={{marginHorizontal: 3}}
                                     title={strings('account.transaction.RBF.replaceByFeeBtn')}/>
                    </TouchableOpacity>
                </View>
            )
        }
    }


    handleReplaceByFeeBtn = async () => {

        const {cryptoCurrency, transaction, account} = this.props

        const devMode = await AsyncStorage.getItem('devMode')

        const TmpComponent = () => {
            return (
                <View style={{alignItems: 'center', width: '100%'}}>
                    <TouchableOpacity onPress={() => {
                        Linking.openURL('https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki')
                    }}>
                        <Text style={{
                            paddingTop: 10,
                            paddingHorizontal: 10,
                            fontFamily: 'SFUIDisplay-Semibold',
                            color: '#4AA0EB',
                            textAlign: 'center'
                        }}>https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki</Text>
                    </TouchableOpacity>
                </View>
            )
        }


        try {
            const isETH = cryptoCurrency.currencyCode === 'ETH' || cryptoCurrency.currencyCode.indexOf('ETH_') === 0

            if (devMode && devMode.toString() === '1') {
                if (transaction.transactionDirection === 'outcome' || transaction.transactionDirection === 'self') {
                    if (isETH || (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson && typeof transaction.transactionJson.allowReplaceByFee !== 'undefined' && transaction.transactionJson.allowReplaceByFee)) {
                        showModal({
                            type: 'YES_NO_MODAL',
                            icon: 'WARNING',
                            title: strings(`modal.featureExpectedModal.title`),
                            description: strings(`account.transaction.RBF.willReplaceWithNewFee`)
                        }, async (res) => {

                            try {
                                let memo = ''
                                if (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson) {
                                    memo = transaction.transactionJson.memo || ''
                                }
                                const data = {
                                    memo,
                                    amount: transaction.addressAmountPretty.toString(),
                                    amountRaw: transaction.addressAmount,
                                    address: transaction.addressTo || account.address,
                                    wallet: {walletHash: transaction.walletHash},
                                    cryptoCurrency,
                                    account,
                                    useAllFunds: false,
                                    toTransactionJSON: transaction.transactionJson,
                                    transactionReplaceByFee: transaction.transactionHash,
                                    type: false
                                }

                                NavStore.goNext('ConfirmSendScreen', {
                                    confirmSendScreenParam: data
                                })
                            } catch (e) {
                                Log.err('SendScreen.Transaction.RBF dialog error ' + e.message)
                            }

                        })
                    } else {
                        showModal({
                            type: 'INFO_MODAL',
                            icon: 'INFO',
                            title: strings(`modal.featureExpectedModal.title`),
                            description: strings(`account.transaction.RBF.notAllowed`),
                            component: TmpComponent
                        })
                    }
                } else {
                    showModal({
                        type: 'YES_NO_MODAL',
                        icon: 'WARNING',
                        title: strings(`modal.featureExpectedModal.title`),
                        description: strings(`account.transaction.CPFP.willSpeedUp`),
                    }, async (res) => {

                        const data = {
                            memo: '',
                            amount: transaction.addressAmountPretty.toString(),
                            amountRaw: transaction.addressAmount,
                            address: account.address,
                            wallet: {walletHash: transaction.walletHash},
                            cryptoCurrency,
                            account,
                            useAllFunds: false,
                            transactionSpeedUp: transaction.transactionHash,
                            type: false
                        }

                        NavStore.goNext('ConfirmSendScreen', {
                            confirmSendScreenParam: data
                        })
                    })
                }
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings(`modal.featureExpectedModal.title`),
                    description: strings(`modal.featureExpectedModal.description`),
                    component: TmpComponent
                })
            }
        } catch (e) {
            Log.err('SendScreen.Transaction.handleReplaceByFeeBtn predialog error ' + e.message)
        }

    }

    handleSubContentPress = (item) => {
        copyToClipboard(item.description)
        Toast.setMessage(strings('toast.copied')).show()
    }

    ifTxsTW = () => {

        const {styles} = this.state
        const {transaction} = this.props

        if (transaction.transactionOfTrusteeWallet && transaction.transactionOfTrusteeWallet === 1)
            return <View style={{marginLeft: 'auto', marginRight: 20}}><CustomIcon name="shield"
                                                                                   style={styles.transaction__top__type__icon}/></View>
    }

    renderStatusCircle = (isStatus, status, transactionDirection) => {

        const {styles} = this.state
        const {amountToView, count, transactions, cryptoCurrency} = this.props

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        let arrowIcon = <Feather name={'arrow-up-right'} style={{marginTop: 1, color: '#f7f7f7', fontSize: 15}}/>
        let circleStyle = {}

        if (transactionDirection === 'income') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{marginTop: 1, color: '#f7f7f7', fontSize: 15}}/>
        }
        if (transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name="infinity" style={{marginTop: 1, color: '#f7f7f7', fontSize: 10}}/>
            circleStyle = {backgroundColor: isStatus ? color : '#999999'}
        }
        if (status === 'fail' || status === 'missing'){
            arrowIcon = <Feather name="x" style={{marginTop: 1, color: '#f7f7f7', fontSize: 15}}/>
            circleStyle = {backgroundColor: '#999999'}
        }

        const statusTmp = status !== 'new' && status !== 'confirming' && status !== 'done_payin' && status !== 'wait_trade' && status !== 'done_trade' && status !== 'pending_payin' && status !== 'pending_payin'

        const marginTop = !count ? 50 : 0
        const height = (amountToView === count + 1 && transactions && transactions.length === count + 1) ? 50 : 700

        const {width: SCREEN_WIDTH} = Dimensions.get('window')
        const PIXEL_RATIO = PixelRatio.get()
        if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
            // iphone 5s
            return (
                <View style={[styles.transaction__col, styles.transaction__colOld, {
                    overflow: 'visible',
                    marginTop: !statusTmp ? 1 : 0
                }]}>
                    <View style={{position: 'absolute', top: 3, left: 2}}>

                    </View>
                </View>
            )
        }

        return (
            <View style={[styles.transaction__col, styles.transaction__col1, {
                overflow: 'visible',
                marginTop: !statusTmp ? 1 : 0
            }]}>
                <View style={{position: 'absolute', top: 3, left: 23}}>
                    <Dash style={{
                        width: 2,
                        height: !this.props.dash ? height : transactions.length === 1 ? 0 : 70,
                        marginTop: marginTop,
                        flexDirection: 'column'
                    }}
                          dashColor={'#E3E6E9'}
                          dashGap={3}
                          dashLength={3}/>
                </View>
                <Circle style={{
                    ...styles.transaction__circle__small, ...circleStyle,
                    backgroundColor: isStatus ? color : '#404040',
                    width: 24,
                    height: 24
                }}>
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        borderRadius: 25,
                        backgroundColor: isStatus ? color : '#404040', ...circleStyle,
                        marginLeft: Platform.OS === 'ios'  && transactionDirection !== 'self' ? 1 : 0
                    }}>
                        {arrowIcon}
                    </View>
                </Circle>
            </View>
        )
    }

    renderPayButton = () => {

        const {transaction} = this.props
        const {status, wayType} = this.state

        let icon, onPress

        if (wayType !== null) {
            if (wayType === 'BUY') {
                icon = (props) => <FontAwesome5 color="#864DD9" size={10} name={'money-bill-wave'} {...props} />
                onPress = this.handleBuy
            } else {
                icon = (props) => <FontAwesome5 color="#864DD9" size={10} name={'coins'} {...props} />
                onPress = this.handleSell
            }
        } else {
            icon = (props) => <MaterialIcons color="#864DD9" size={10} name={'content-copy'} {...props} />
            onPress = () => {
            }
        }

        if (typeof status !== 'undefined' && status !== null && status === 'pending_payin' && (wayType === 'BUY' || (
            wayType === 'EXCHANGE' && transaction.transactionDirection === 'outcome'
        ))) {

            const limit = wayType === 'BUY' ? 36 * 100000 : 36 * 1000000
            const diff = new Date().getTime() - transaction.createdAt
            const isPayButtonDisabled = diff > limit || diff < 6000

            if (isPayButtonDisabled || typeof transaction.transactionHash === 'string') {
                return
            }

            return (
                <View style={{alignItems: 'center'}}>
                    <TouchableOpacity
                        style={{alignItems: 'center', padding: 20, paddingHorizontal: 30, paddingTop: 0}}
                        onPress={onPress}>
                        <LightButton Icon={(props) => icon(props)} iconStyle={{marginHorizontal: 3}}
                                     title={strings('account.transaction.pay')}/>
                    </TouchableOpacity>
                </View>
            )
        }
    }

    renderRemoveButton = () => {

        const {transaction} = this.props
        const {status, wayType} = this.state

        if (typeof wayType === 'undefined' || wayType === null || !wayType) {
            return null
        }
        if (typeof status === 'undefined' || status === null || !status) {
            return null
        }

        if (typeof transaction.transactionHash === 'string') {
            return null
        }

        const icon = (props) => <MaterialIcons color="#864DD9" size={10} name={'delete'} {...props} />
        const onPress = this.handleRemove


        return (
            <View style={{alignItems: 'center'}}>
                <TouchableOpacity
                    style={{alignItems: 'center', padding: 20, paddingHorizontal: 30, paddingTop: 0}}
                    onPress={onPress}>
                    <LightButton Icon={(props) => icon(props)} iconStyle={{marginHorizontal: 3}}
                                 title={strings('account.transaction.remove')}/>
                </TouchableOpacity>
            </View>
        )

    }

    handleRemove = async () => {
        try {
            const {transaction} = this.props

            this.setState({removed: true})

            await updateTradeOrdersDaemon.updateTradeOrdersDaemon({
                force: true,
                removeId: transaction.orderId,
                source: 'ACCOUNT_HANDLE_REMOVE'
            })

        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err(`AccountScreen.Transaction/handleRemove error - ${e.message}`)
        }
    }

    handleBuy = async () => {
        try {
            const deviceToken = await AsyncStorage.getItem('pushToken')

            const {transaction, cryptoCurrency, cards} = this.props

            let creditCard

            // @misha maybe orderJson to unify?
            if (typeof transaction.orderJSON !== 'undefined') {
                creditCard = cards.find(item => item.number === transaction.orderJSON.card.cardNumber)
            }

            setExchangeData({})

            const exchangeData = {
                id: transaction.orderId,
                link: transaction.payinUrl,
                deviceToken: deviceToken,
                selectedCryptoCurrency: cryptoCurrency
            }

            if (typeof transaction.orderJSON !== 'undefined') {
                exchangeData.uniqueParams = transaction.orderJSON
            }

            if (typeof creditCard !== 'undefined') {
                exchangeData.cardNumber = creditCard.number
                exchangeData.expirationDate = creditCard.expiration_date
            }

            setExchangeData(exchangeData)

            await updateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, source: 'ACCOUNT_HANDLE_BUY'})

            NavStore.goNext('SMSCodeScreen')
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.infoPayOrder.error.title'),
                description: strings('modal.infoPayOrder.error.description')
            })
            // noinspection ES6MissingAwait
            Log.err(`AccountScreen.Transaction/handleBuy error - ${e.message}`)
        }
    }

    handleSell = async () => {
        try {
            const {transaction, cryptoCurrency, account} = this.props

            const dataToScreen = {
                disabled: true,
                address: transaction.depositAddress,
                value: transaction.addressAmountPretty.toString(),
                account,
                cryptoCurrency,
                description: strings('send.descriptionExchange'),
                useAllFunds: false,
                type: 'TRADE_SEND',
                copyAddress: true,
                toTransactionJSON: {
                    bseOrderID: transaction.orderId
                }
            }

            if (typeof transaction.orderJSON !== 'undefined' && transaction.orderJSON !== null) {
                dataToScreen.destinationTag = transaction.orderJSON.destinationTag !== null ? transaction.orderJSON.destinationTag : ''
            }

            setSendData(dataToScreen)

            await updateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, source: 'ACCOUNT_HANDLE_SELL'})

            NavStore.goNext('SendScreen')
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.infoPayOrder.error.title'),
                description: strings('modal.infoPayOrder.error.description')
            })
            // noinspection ES6MissingAwait
            Log.err(`AccountScreen.Transaction/handleSell error - ${e.message}`)
        }
    }

    measureView(event) {
        this.setState({
            width: Math.ceil(event.nativeEvent.layout.width),
            height: Math.ceil(event.nativeEvent.layout.height - 1)
        })
    }

    render() {

        const {wayType, direction, status, subContent, valueToView, isExpanded, blockConfirmations, basicValueToView, styles, show, currencySymbolToView, removed} = this.state

        if (removed) {
            return <View/>
        }
        const {cryptoCurrency, transaction} = this.props
        const isStatus = status === 'new' || status === 'done_payin' || status === 'wait_trade' || status === 'done_trade' || status === 'pending_payin'

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor
        const subtitle = typeof transaction.subtitle !== 'undefined' && transaction.subtitle ? transaction.subtitle : false

        const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        const subtitleMini = doteSlice && transaction.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
            transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
                transaction.subtitle.slice(doteSlice+1, transaction.subtitle.length) : transaction.subtitle  : transaction.subtitle

        return show ? (
            <View style={styles.transaction}>
                {this.renderStatusCircle(isStatus, status, transaction.transactionDirection)}
                <View style={[styles.transaction__col, styles.transaction__col2]}>
                    <TouchableOpacity style={styles.transaction__top} onLongPress={this.handleCopyAll}>
                        <Text style={styles.transaction__top__title}>
                            {strings(`account.transaction.${wayType === null ? direction : wayType.toLowerCase()}`)}
                        </Text>
                        {
                            !isStatus ?
                                <View style={{marginRight: 4}}>
                                    <MaterialCommunity name="progress-check"
                                                       style={styles.transaction__top__type__icon}/>
                                </View> : null
                        }
                        <Text style={[styles.transaction__top__type, isStatus ? {color: color} : null]}>
                            {isStatus ? strings(`account.transactionStatuses.${status === 'confirming' ? 'confirming' : 'process'}`).toUpperCase() : blockConfirmations}
                        </Text>
                        {this.ifTxsTW()}
                    </TouchableOpacity>
                    <View onLayout={(event) => this.measureView(event)} style={styles.transaction__content}>
                        <View style={styles.transaction__content__item}>
                            <TouchableOpacity onLayout={(event) => this.measureView(event)}
                                              onPress={this.toggleIsExpanded}>
                                <GradientView
                                    style={[styles.transaction__item, isExpanded ? styles.transaction__item_active : null]}
                                    array={styles.transaction__item_bg.array}
                                    start={styles.transaction__item_bg.start}
                                    end={styles.transaction__item_bg.end}>
                                    <View style={{...styles.transaction__item__content, opacity: status === 'fail' || status === 'missing' ? 0.5 : null}}>
                                        <View style={{justifyContent: 'center'}}>
                                            <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                                                <Text style={styles.transaction__item__title}>
                                                    {valueToView}
                                                </Text>
                                                <Text
                                                    style={[styles.transaction__item__title__subtitle, {color: new UIDict(cryptoCurrency.currencyCode).settings.colors.mainColor}]}>
                                                    {currencySymbolToView}
                                                </Text>
                                                {
                                                    subtitle ?
                                                        <>
                                                            <Ionicons name={'ios-arrow-round-up'} size={20}
                                                                      color={'#404040'} style={{transform: [{ rotate: transaction.transactionDirection === 'outcome' ? "90deg" : "-90deg"}], marginHorizontal: 7, marginBottom: Platform.OS === 'ios' ? -1 : null}} />
                                                            <Text style={{...styles.transaction__item__subtitle, marginBottom: Platform.OS === 'ios' ? 2 : null}}>
                                                                {subtitleMini}
                                                            </Text>
                                                        </>
                                                        : null
                                                }
                                            </View>
                                            {wayType !== 'EXCHANGE' && basicValueToView !== 'undefined undefined' ?
                                            <Text style={{...styles.transaction__item__subtitle, color: '#999999'}}>
                                                {basicValueToView}
                                            </Text> : null}
                                        </View>
                                        {this.renderToggleArrow(isStatus ? color : null)}
                                    </View>
                                    <View style={styles.line}>
                                        <View style={styles.line__item}/>
                                    </View>
                                    {
                                        isExpanded ? subContent.map((item, key) => this.subContentTemplate(item, key)) : null
                                    }
                                    {this.renderPayButton()}
                                    {this.renderRemoveButton()}
                                    {this.renderReplaceByFeeIcon()}
                                </GradientView>
                            </TouchableOpacity>
                        </View>
                        { isStatus && Platform.OS !== 'ios' && typeof  this.state.height !== 'undefined' && typeof this.state.width !== 'undefined'?
                            <BoxShadow setting={{
                                ...styles.shadow__item__android, color: color,
                                height: this.state.height, width: this.state.width
                            }} fromTransaction={1}>
                            </BoxShadow> :
                            <View style={styles.shadow}>
                                <View style={{...styles.shadow__item, shadowColor: isStatus ? color : null}}/>
                            </View>}
                    </View>
                </View>
            </View>
        ) : <View/>
    }
}

export default Transaction


const globalStyles = {
    default: {
        transaction: {
            flexDirection: 'row',

            overflow: 'hidden'
        },
        transaction__content: {
            position: 'relative',

            backgroundColor: '#fff',
            borderRadius: 16
        },
        transaction__content__item: {
            position: 'relative',

            backgroundColor: '#fff',
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
            fontSize: 12,
            color: '#404040'
        },
        transaction__top__type__icon: {
            marginTop: 2,
            fontSize: 14,

            color: '#5C5C5C'
        },
        transaction__top__type: {
            marginTop: Platform.OS === 'android' ? 2.5 : 0.5,

            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: '#5C5C5C'
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
            array: ['#fff', '#f2f2f2'],
            start: {x: 1, y: 0},
            end: {x: 1, y: 1}
        },
        transaction__item__title: {
            marginRight: 5,

            fontFamily: 'Montserrat-Medium',
            fontSize: 18
        },
        transaction__item__title__subtitle: {
            marginBottom: 1.8,

            fontFamily: 'Montserrat-SemiBold',
            fontSize: 12,
            color: '#1EB3E4'
        },
        transaction__item__subtitle: {
            fontFamily: 'SFUIDisplay-Semibold',
            fontSize: 12,
            color: '#404040'
        },
        circle: {},
        transaction__item__arrow: {
            marginLeft: .5,

            fontSize: 16
        },
        transaction__item__arrow_up: {
            marginTop: 0.5
        },
        transaction__item__arrow_down: {
            marginTop: 1.5
        },
        transaction__item__subcontent: {
            marginBottom: 16,
            paddingHorizontal: 30
        },
        transaction__item__subcontent__title: {
            marginBottom: 4,
            fontFamily: 'Montserrat-Bold',
            fontSize: 14,
            color: '#404040'
        },
        transaction__item__subcontent__text: {
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            letterSpacing: 2,
            color: '#999999',
            flex: 1,
            flexWrap: 'wrap',
        },
        transaction__item__subcontent__text_link: {
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: '#864DD9',
            textDecorationLine: 'underline',
            textDecorationStyle: 'solid',
            textDecorationColor: '#864DD9'
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

            // borderRadius: 16,

            width: 350,
            height: 63,
            border: 6,
            radius: 16,
            opacity: 0.07,
            x: 0,
            y: 0,
            style: {
                flexDirection: 'row',
                // marginVertical: 5,
                position: 'absolute',
                // margin: 1
            }
        },
        line: {
            height: 1,
            marginBottom: 12,

            marginHorizontal: 56,

            backgroundColor: '#E3E6E9'
        }
    },
    themes: {
        new: {
            transaction__circle__small: {
                backgroundColor: '#404040'
            },
            transaction__circle__big: {
                // backgroundColor: "#404040",
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
                // backgroundColor: "#404040",
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
                // backgroundColor: "#404040",
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
                // backgroundColor: "#404040",
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

