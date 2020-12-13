/**
 * @version 0.30
 */
import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    ScrollView, Linking, TextInput,
    TouchableOpacity
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '../../services/i18n'
import Header from '../../components/elements/new/Header'
import NavStore from '../../components/navigation/NavStore'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import firebase from 'react-native-firebase'
import Log from '../../services/Log/Log'

import UIDict from '../../services/UIDict/UIDict'

import LetterSpacing from '../../components/elements/LetterSpacing'
import Loader from '../../components/elements/LoaderItem'
import TransactionItem from './elements/TransactionItem'

import Buttons from './elements/buttons'

import { Pages } from 'react-native-pages'

import DaemonCache from '../../daemons/DaemonCache'

import prettyShare from '../../services/UI/PrettyShare/PrettyShare'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Api from '../../services/Api/ApiV3'
import transactionDS from '../../appstores/DataSource/Transaction/Transaction'
import transactionActions from '../../appstores/Actions/TransactionActions'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import { capitalize } from '../../services/UI/Capitalize/Capitalize'

import store from '../../store'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import Toast from '../../services/UI/Toast/Toast'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import InsertShadow from 'react-native-inset-shadow'
import GradientView from '../../components/elements/GradientView'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import config from '../../config/config'


class TransactionScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            transaction: {},
            subContent: [],
            showMoreDetails: false,
            outDestinationCardToView: null,
            fromToView: null,
            addressToToView: null,
            addressExchangeToView: null,
            commentToView: null,
            commentEditable: false
        }
    }

    // @ksu this is bugplace plz see
    async UNSAFE_componentWillMount() {
        const data = this.props.navigation.getParam('txData')

        let { transactionHash, orderHash, walletHash, transaction } = data
        let tx

        if (!transaction) {
            if (typeof walletHash === 'undefined' || !walletHash) {
                const wallet = store.getState().mainStore.selectedWallet
                walletHash = wallet.walletHash
            }
            if (transactionHash) {
                try {
                    const tmp = await transactionDS.getTransactions({
                        walletHash,
                        transactionHash
                    }, 'TransactionScreen.init with transactionHash ' + transactionHash)
                    if (tmp) {
                        // if you need = add also transactionActions.preformat for basic rates
                        tx = transactionActions.preformatWithBSEforShow(tmp[0], tmp[0].bseOrderData)
                    } else {
                        console.log('WTF? something wrong need rescan daemon')
                    }
                } catch (e) {
                    console.log('TransactionScreen.init with transactionHash error  ' + e)
                }
            } else if (orderHash) {
                try {
                    const tmp = await transactionDS.getTransactions({
                        bseOrderHash: orderHash
                    }, 'TransactionScreen.init with orderHash ' + orderHash)
                    if (tmp) {
                        // if you need = add also transactionActions.preformat for basic rates
                        tx = transactionActions.preformatWithBSEforShow(tmp[0], tmp[0].bseOrderData)
                    } else {
                        const exchangeOrder = await UpdateTradeOrdersDaemon.fromApi(walletHash, orderHash)
                        if (exchangeOrder) {
                            // basic object for order without transaction
                            tx = transactionActions.preformatWithBSEforShow(false, exchangeOrder)
                        } else {
                            // do some alert as nothing found
                        }
                    }
                } catch (e) {
                    console.log('TransactionScreen.init with orderHash error  ' + e)
                }
            } else {
                console.log('WTF?')
            }
            console.log('TransactionScreen.tx search result ', JSON.parse(JSON.stringify(tx)))
        } else {
            tx = transaction
        }

        this.init(tx)

        this.setState(() => ({
            transaction: tx
        }))
    }

    init = (transaction) => {
        console.log('transaction', transaction)
        try {
            const { cryptoCurrency } = this.props

            const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

            const outDestinationCardToView = this.prepareOutDestinationCard(transaction)

            const fromToView = this.prepareAddressFromToView(transaction)

            const addressToToView = this.prepareAddressToToView(transaction)

            const addressExchangeToView = this.prepareAddressExchangeToView(transaction)

            const status = this.prepareStatus(transaction.transactionStatus, transaction.bseOrderData ? transaction.bseOrderData.status : null)

            const commentToView = this.prepareCommentToView(transaction)

            const subContent = []

            const transactionHashToView = this.prepareTransactionHashToView(transaction, cryptoCurrency)
            transactionHashToView ? subContent.push(transactionHashToView) : null

            const transactionsOtherHashesToView = this.prepareTransactionsOtherHashesToView(transaction, cryptoCurrency)
            transactionsOtherHashesToView ? subContent.push(transactionsOtherHashesToView) : null

            const transactionFeeToView = this.prepareTransactionFeeToView(transaction)
            transactionFeeToView ? subContent.push(transactionFeeToView) : null

            const orderIdToView = this.prepareOrderIdToView(transaction)
            orderIdToView ? subContent.push(orderIdToView) : null

            const blockTime = this.prepareDate(transaction.blockTime)
            blockTime ? subContent.push(blockTime) : null

            const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)
            blockConfirmations ? subContent.push(blockConfirmations) : null

            const blockNumber = this.prepareBlockNumber(transaction.blockNumber)
            blockNumber ? subContent.push(blockNumber) : null

            const fioMemoToView = this.prepareFioMemoToView(fioMemo[transaction.transactionHash])
            fioMemoToView ? subContent.push(fioMemoToView) : null

            const transactionDestinationTag = this.prepareTransactionDestinationTag(transaction, cryptoCurrency.currencyCode)
            transactionDestinationTag ? subContent.push(transactionDestinationTag) : null

            const transactionNonce = this.prepareTransactionNonce(transaction, cryptoCurrency.currencyCode)
            transactionNonce ? subContent.push(transactionNonce) : null

            const transactionDelegatedNonce = this.prepareTransactionDelegatedNonce(transaction, cryptoCurrency.currencyCode)
            transactionDelegatedNonce ? subContent.push(transactionDelegatedNonce) : null

            this.setState({
                subContent,
                outDestinationCardToView,
                fromToView,
                addressToToView,
                addressExchangeToView,
                commentToView
            })

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('TransactionScreen init error ', e)
            }
            Log.err(`TransactionScreen init error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(transaction)}`)
        }
    }

    prepareAddressToToView = (transaction) => {
        if (transaction.bseOrderData) return false // added wrapper in preformatWithBSEforShow
        if (typeof transaction.addressTo === 'undefined' || !transaction.addressTo) return false
        return {
            title: strings(`account.transaction.to`),
            description: transaction.addressTo.toString()
        }

    }

    prepareAddressFromToView = (transaction) => {
        if (transaction.bseOrderData) return false
        if (typeof transaction.addressFrom === 'undefined' || !transaction.addressFrom || transaction.addressFrom.indexOf(',') !== -1) return false
        return {
            title: strings(`account.transaction.from`),
            description: transaction.addressFrom.toString()
        }

    }

    prepareAddressExchangeToView = (transaction) => {
        if (!transaction.bseOrderData) return false
        if (transaction.wayType !== 'EXCHANGE') return false
        if (transaction.transactionDirection === 'income') {
            return {
                title: strings(`account.transaction.from`),
                description: transaction.bseOrderData.depositAddress.toString()
            }
        } else {
            return {
                title: strings(`account.transaction.to`),
                description: transaction.bseOrderData.outDestination.toString()
            }
        }
    }

    prepareOrderIdToView = (transaction) => {
        // bseOrderID will be for created from this wallet orders
        if (typeof transaction.bseOrderID !== 'undefined' && transaction.bseOrderID) {
            return {
                title: strings(`account.transaction.orderId`),
                description: transaction.bseOrderID
            }
        }

        if (!transaction.bseOrderData) return false
        if (typeof transaction.bseOrderData.orderId === 'undefined') return false
        return {
            title: strings(`account.transaction.orderId`),
            description: transaction.bseOrderData.orderId.toString()
        }
    }

    prepareCommentToView = (transaction) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null) return null

        if (transaction.transactionStatus.toUpperCase() !== 'SUCCESS') return null

        if (typeof transaction.transactionJson.comment !== 'undefined') {
            return {
                title: strings(`send.comment`),
                description: transaction.transactionJson.comment
            }
        } else {
            return {
                title: strings(`send.comment`),
                description: ''
            }
        }
    }

    prepareFioMemoToView = (fioMemo) => {
        if (typeof fioMemo === 'undefined' || fioMemo === null) return null
        return {
            title: strings(`send.fio_memo`),
            description: fioMemo
        }
    }

    prepareOutDestinationCard = (transaction) => {
        if (!transaction.bseOrderData) return null
        if (typeof transaction.bseOrderData.outDestination === 'undefined' || transaction.bseOrderData.outDestination === null || !transaction.bseOrderData.outDestination.includes('***')) return null
        if (transaction.bseOrderData.outDestination.includes('+')) {
            return {
                title: strings(`account.transaction.phoneDestination`),
                description: transaction.bseOrderData.outDestination.toString()
            }
        } else if (transaction.bseOrderData.outDestination.substr(0, 1) === 'U') {
            return {
                title: strings(`account.transaction.advAccountDestination`),
                description: transaction.bseOrderData.outDestination.toString()
            }
        } else {
            return {
                title: strings(`account.transaction.cardNumberDestination`),
                description: transaction.bseOrderData.outDestination.toString()
            }
        }
    }

    handleLink = (link) => {
        NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
    }

    prepareTransactionFeeToView = (transaction) => {
        if (typeof transaction.transactionFee === 'undefined' || !transaction.transactionFee) return null
        const title = strings(`account.transaction.fee`)
        if (transaction.transactionDirection === 'income') {
            // not my txs no fees to show
            // title = strings(`account.transaction.feeIncome`)
            return null
        }
        return {
            title,
            description: `${transaction.transactionFeePretty} ${transaction.feesCurrencySymbol} (${transaction.basicFeeCurrencySymbol} ${transaction.basicFeePretty})`
        }

    }

    prepareTransactionDestinationTag = (transaction, currencyCode) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.memo === 'undefined') return null
        let txt = transaction.transactionJson.memo
        if (!txt || txt === null) return null
        txt = txt.toString().trim()
        if (txt === '') return null
        if (currencyCode === 'XRP') {
            return {
                title: strings(`account.transaction.destinationTag`),
                description: txt
            }
        } else if (currencyCode === 'XMR') {
            return {
                title: strings(`account.transaction.paymentId`),
                description: txt
            }
        }
    }

    prepareTransactionNonce = (transaction, currencyCode) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.nonce === 'undefined') return null
        return {
            title: strings(`account.transaction.nonce`),
            description: transaction.transactionJson.nonce.toString() || '(none)'
        }
    }

    prepareTransactionDelegatedNonce = (transaction, currencyCode) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.delegatedNonce === 'undefined') return null
        return {
            title: strings(`account.transaction.delegatedNonce`),
            description: transaction.transactionJson.delegatedNonce.toString()
        }
    }

    prepareStatusToView = (transaction) => {
        if (!transaction.bseOrderData || typeof transaction.bseOrderData.exchangeWayType === 'undefined' || !transaction.bseOrderData.exchangeWayType) {
            return strings(`account.transactionStatuses.${transaction.transactionStatus.toLowerCase()}`)
        }
        return strings(`exchange.ordersStatus.${transaction.bseOrderData.exchangeWayType.toLowerCase()}.${transaction.bseOrderData.status.toLowerCase()}`)
    }

    prepareTransactionHashToView = (transaction, cryptoCurrency) => {
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

    prepareTransactionsOtherHashesToView = (transaction, cryptoCurrency) => {
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

    prepareStatus = (transactionStatus) => {
        // orderStatus => transactionStatus moved to preformatWithBSEforShow - also this one could be as doubles with element/Transaction
        const transactionStatusTmp = typeof (transactionStatus) !== 'undefined' ? transactionStatus : 'new'
        return !transactionStatusTmp ? 'new' : transactionStatusTmp
    }

    prepareDate = (createdAt) => {
        if (!createdAt) return false
        const tmp = {
            title: strings('account.transaction.date'),
            description: '...'
        }
        tmp.description = new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString()
        return tmp
    }

    prepareBlockConfirmations = (blockConfirmations) => {
        let tmp = 0
        if (typeof blockConfirmations !== 'undefined' && blockConfirmations > 0) {
            tmp = blockConfirmations.toString()
        }
        return {
            title: strings(`account.transaction.confirmations`),
            description: tmp.toString()
        }
    }

    prepareBlockNumber = (blockNumber) => {
        if (typeof blockNumber === 'undefined') return false
        return {
            title: strings(`account.transaction.blockNumber`),
            description: blockNumber.toString()
        }
    }

    onLongPressEditableCallback = () => {
        this.setState({
            commentEditable: true
        })

        this.commentInput.focus()
    }

    onBlurComment = async (item) => {
        try {
            this.setState({
                commentEditable: false
            })

            const { id: updateID, transactionJson } = this.state.transaction

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
                await transactionDS.saveTransaction(transaction, updateID, 'onBlurComment')
            }
        } catch (e) {
            Log.err(`AccountScreen.Transaction/onBlurComment error ${e.message}; Transaction - ${JSON.stringify(this.state.transaction)}`)
        }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    getTransactionDate(transaction) {
        const datetime = new Date(transaction.createdAt)
        return datetime.toTimeString().slice(0, 8) + ' ' +
            (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '/' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + '/' + datetime.getFullYear()
    }

    getTransactionStatus = (status) => {
        switch (status.toUpperCase()) {
            case 'DONE_PAYOUT':
            case 'SUCCESS':
                return 'SUCCESS'
            case 'CANCELED_PAYOUT':
            case 'CANCELED_PAYIN':
            case 'FAIL':
                return 'CANCELED'
            default:
                return 'PENDING'
        }
    }

    headerTrx = (transaction, color, currencyCode) => {

        if (Object.keys(transaction).length === 0) {
            return (
                <View></View>
            )
        }

        const { colors, isLight } = this.context

        const { cryptoCurrency } = this.props

        const { transactionStatus, transactionDirection, addressAmountPretty, addressAmountPrettyPrefix, wayType } = transaction

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ color: '#404040', fontSize: 17 }} />

        if (transactionDirection === 'income' || transactionDirection === 'claim' || transactionDirection === 'income') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ color: '#404040', fontSize: 17 }} />
        }
        if (transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name='infinity' style={{ color: '#404040', fontSize: 17 }} />
        }
        if (transactionStatus === 'fail' || transactionStatus === 'missing' || transactionStatus === 'replaced') {
            arrowIcon = <Feather name='x' style={{ color: '#404040', fontSize: 17 }} />
        }

        return (
            <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.txDirection}>
                        {capitalize(strings('account.transaction.' + wayType.toLowerCase()))}
                    </Text>
                    <View>
                        {arrowIcon}
                    </View>
                </View>
                <View style={{ paddingVertical: 8 }}>
                    <Text
                        style={styles.date}>{this.getTransactionDate(transaction)}</Text>
                </View>
                <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row' }}>
                    <View style={{ ...styles.statusLine, borderBottomColor: color }} />
                    <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                        <View style={{ ...styles.statusBlock, backgroundColor: color }}>
                            <LetterSpacing text={this.prepareStatusToView(transaction)} textStyle={styles.status} letterSpacing={1.5} />
                        </View>
                    </View>
                </View>
                <View style={styles.topContent__title}>
                    {/* {(trx.status ? trx.status.toUpperCase() !== 'PENDING_PAYIN' : false) || (status ? status.toUpperCase() !== 'PENDING' : false) ? */}
                    <>
                        <Text style={styles.amount}>
                            {addressAmountPrettyPrefix  + ' ' + addressAmountPretty}
                        </Text>
                        <Text style={{ ...styles.code, color: color }}>{cryptoCurrency.currencySymbol}</Text>
                    </>
                    {/* :
                        <Loader size={20} color={colors.accountScreen.loaderColor} />
                    } */}
                </View>

            </View>
        )
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
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

        // const status = typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null ? transaction.bseOrderData.status : null
        // const exchangeWayType = typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData !== null ? transaction.bseOrderData.exchangeWayType : null

        // if (typeof exchangeWayType === 'undefined' || exchangeWayType === null || !exchangeWayType) {
        //     return null
        // }
        // if (typeof status === 'undefined' || status === null || !status) {
        //     return null
        // }


        // @ksu need this?
        // if (typeof transaction.transactionHash === 'string') {
        //     return null
        // }

        array.push({ icon: 'pinCode', title: 'Remove', action: () => this.renderRemove() })
    }

    handlerReplaceByFee = (array) => {
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
        array.push({ icon: 'accounts', title: 'Booster', action: () => this.handlerRbf() })
    }

    handlerCheckV3 = (array) => {
        const { transaction } = this.state
        if (typeof transaction.bseOrderData === 'undefined' || typeof transaction.orderId === 'undefined' || transaction.bseOrderData === null) {
            return false
        }
        array.push({
            icon: 'pinCode',
            title: 'Check',
            action: async () => NavStore.goNext('CheckV3DataScreen', { orderHash: transaction.bseOrderData.orderHash })
        })
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

    showMoreDetails = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 100)

        this.setState({
            showMoreDetails: !this.state.showMoreDetails
        })

    }

    shareTransaction = (transaction) => {
        const shareOptions = {}
        shareOptions.message = `${transaction.transactionHash}\nThank you for choosing Trustee Wallet`
        shareOptions.url = this.props.cashBackStore.dataFromApi.cashbackLink
        prettyShare(shareOptions, 'yura_share_transaction')
    }

    shareSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'TRANSACTION' })
        NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
    }

    commentHandler = () => {

        const { commentToView, commentEditable } = this.state

        const { colors, GRID_SIZE } = this.context

        return (
            <>
                {commentToView ?
                    !commentEditable ?
                        <TouchableOpacity onLongPress={this.onLongPressEditableCallback}>
                            <TransactionItem
                                title={commentToView.title}
                                iconType='pinCode'
                                subtitle={commentToView.description}
                            />
                        </TouchableOpacity> :
                        <View style={{
                            ...styles.inputWrapper,
                            marginTop: 20,
                            marginBottom: GRID_SIZE,
                            backgroundColor: '#f5f5f5'
                        }}>
                            <TextInput
                                ref={ref => this.commentInput = ref}
                                name={'None (optional)'}
                                placeholder={'None (optional)'}
                                onBlur={() => this.onBlurComment(commentToView)}
                                multiline={true}
                                onChangeText={(value) => {
                                    this.setState({
                                        commentToView: {
                                            ...commentToView,
                                            description: value
                                        },
                                        commentEditable: true
                                    })
                                }}
                                value={commentToView !== null ? commentToView.description : commentToView}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                tintColor={'#7127ac'}
                            />
                        </View>
                    :
                    null
                }
            </>
        )
    }

    handleSubContentPress = (item) => {
        if (item.isLink) {
            copyToClipboard(item.title + ': ' + item.linkUrl)
        } else {
            copyToClipboard(item.title + ': ' + item.description)
        }
        Toast.setMessage(strings('toast.copied')).show()
    }


    render() {

        firebase.analytics().setCurrentScreen('Account.TransactionScreen')

        const { colors, GRID_SIZE, isLight } = this.context
        const { cryptoCurrency } = this.props

        const { headerHeight, transaction, showMoreDetails, outDestinationCardToView, fromToView, addressToToView, addressExchangeToView } = this.state

        if (!transaction || typeof transaction === 'undefined') {
            // @yura - its loader when state is initing from notice open - could have some "loader" mark
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        // console.log()
        // console.log()
        // console.log('TransactionScreen.Transaction', JSON.stringify(transaction))

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        const descriptionValue = typeof transaction.description !== 'undefined' ? transaction.description.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16))) : ''

        const buttonsArray = [
            [
                { icon: 'pinCode', title: 'Share', action: () => this.shareTransaction(transaction) },
                { icon: 'accounts', title: 'Support', action: () => this.shareSupport() },
                { icon: showMoreDetails ? 'x' : 'wallet', title: 'Details', action: () => this.showMoreDetails() }
            ], []]

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType='close'
                    rightAction={this.closeAction}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={() => transaction ? this.headerTrx(transaction, color, cryptoCurrency.currencyCode) : null}
                    anime={false}
                />
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2
                    }}
                >
                    <View style={{ marginTop: headerHeight }}>
                        <View>
                            {outDestinationCardToView ?
                                <TransactionItem
                                    title={outDestinationCardToView.title}
                                    iconType='pinCode'
                                    subtitle={outDestinationCardToView.description}
                                /> : fromToView ?
                                    <TransactionItem
                                        title={fromToView.title}
                                        iconType='pinCode'
                                        subtitle={fromToView.description}
                                    /> : addressToToView ?
                                        <TransactionItem
                                            title={addressToToView.title}
                                            iconType='pinCode'
                                            subtitle={addressToToView.description}
                                        /> : addressExchangeToView ?
                                            <TransactionItem
                                                title={addressExchangeToView.title}
                                                iconType='pinCode'
                                                subtitle={addressExchangeToView.description}
                                            /> : null
                            }
                        </View>
                        <View style={{ marginVertical: GRID_SIZE, marginTop: 6 }}>
                            {this.commentHandler()}
                        </View>
                    </View>
                    {this.handlerCheckV3(buttonsArray[1])}
                    {this.handlerReplaceByFeeRemove(buttonsArray[1])}
                    {this.handlerReplaceByFee(buttonsArray[1])}
                    {this.handlerRemoveButton(buttonsArray[1])}
                    <View style={{ height: 120, paddingTop: 20 }}>
                        {buttonsArray[1].length === 0 ?
                            this.renderButton(buttonsArray[0])
                            :
                            <Pages indicatorColor={'#5C5C5C'}>
                                {buttonsArray.map(this.renderButton)}
                            </Pages>}
                    </View>
                    {showMoreDetails && (
                        <View style={{ marginTop: 20, borderRadius: 16 }}>
                            <InsertShadow containerStyle={{
                                ...styles.moreInfo,
                                flex: 1,
                                borderRadius: 16,
                                backgroundColor: '#F2F2F2'
                            }} shadowRadius={9} shadowColor={'#999999'}>
                                {this.state.subContent.map((item) => {
                                    return (
                                        // eslint-disable-next-line react/jsx-key
                                        <TransactionItem
                                            title={item.title}
                                            subtitle={item.description}
                                            isLink={item.isLink}
                                            linkUrl={item.linkUrl}
                                            withoutBack={true}
                                            handleLink={this.handleLink}
                                            copyAction={() => this.handleSubContentPress(item)}
                                        />
                                    )
                                })}
                            </InsertShadow>
                            {/* <View style={styles.shadow}>
                                <View style={styles.shadowItem} />
                            </View> */}
                        </View>)}
                </ScrollView>
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient}
                              start={styles.containerBG.start} end={styles.containerBG.end} />
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
        marginTop: 16
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
        // borderRadius: 16,
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

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 72,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    }
}