/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import {
    Platform,
    View,
    Text,
    ScrollView,
    Linking,
    TextInput,
    TouchableOpacity
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import AsyncStorage from '@react-native-community/async-storage'

import Log from '@app/services/Log/Log'

import UIDict from '@app/services/UIDict/UIDict'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import TransactionItem from './elements/TransactionItem'

import Buttons from '@app/components/elements/new/buttons/Buttons'

import { Pages } from 'react-native-pages'

import DaemonCache from '@app/daemons/DaemonCache'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'

import { capitalize } from '@app/services/UI/Capitalize/Capitalize'

import store from '@app/store'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import GradientView from '@app/components/elements/GradientView'
import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import config from '@app/config/config'
import { setLoaderStatus, setSelectedAccount, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import UpdateAccountPendingTransactions from '@app/daemons/back/UpdateAccountPendingTransactions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'


let CACHE_DELETE_ORDER_ID = ''
let CACHE_RESCAN_TX = false

class AccountTransactionScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            account: {},
            transaction: {},
            subContent: [],
            showMoreDetails: false,
            outDestinationCardToView: null,
            fromToView: null,
            addressToToView: null,
            addressExchangeToView: null,
            commentToView: null,
            commentEditable: false,

            linkExplorer: null,

            focused: false,
            notification: false,
            toOpenAccountBack: false
        }
    }

    async UNSAFE_componentWillMount() {
        try {
            const data = NavStore.getParamWrapper(this, 'txData')

            let { transactionHash, transactionStatus, currencyCode, orderHash, walletHash, transaction, notification, toOpenAccountBack } = data
            let tx
            let account

            if (!transaction) {
                if (typeof walletHash === 'undefined' || !walletHash) {
                    const wallet = store.getState().mainStore.selectedWallet
                    walletHash = wallet.walletHash
                }

                account = store.getState().accountStore.accountList[walletHash]
                if (transactionHash) {
                    try {
                        const searchParams = {
                            walletHash,
                            transactionHash
                        }
                        if (typeof currencyCode !== 'undefined' && currencyCode) {
                            searchParams.currencyCode = currencyCode
                        }
                        let tmp = await transactionDS.getTransactions(searchParams, 'AccountTransactionScreen.init with transactionHash ' + transactionHash)
                        if (!tmp && currencyCode) {
                            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({
                                force: true,
                                currencyCode: currencyCode,
                                source: 'TRANSACTION_PUSH'
                            })
                            tmp = await transactionDS.getTransactions(searchParams, 'AccountTransactionScreen.init with transactionHash ' + transactionHash)
                        }
                        if (tmp) {
                            // if you need = add also transactionActions.preformat for basic rates
                            currencyCode = tmp[0].currencyCode
                            account = account[currencyCode]
                            if (transactionStatus) {
                                tmp[0].transactionStatus = transactionStatus
                                notification = false
                            }
                            tx = transactionActions.preformatWithBSEforShow(transactionActions.preformat(tmp[0], { account }), tmp[0].bseOrderData, currencyCode)
                        } else {
                            tx = transactionActions.preformatWithBSEforShow(false, { orderHash, createdAt: notification.createdAt }, currencyCode)
                        }
                    } catch (e) {
                        Log.log('AccountTransactionScreen.init with transactionHash error  ' + e)
                    }
                } else if (orderHash) {
                    try {
                        const tmp = await transactionDS.getTransactions({
                            bseOrderHash: orderHash
                        }, 'AccountTransactionScreen.init with orderHash ' + orderHash)
                        if (tmp) {
                            // if you need = add also transactionActions.preformat for basic rates
                            currencyCode = tmp[0].currencyCode
                            account = account[currencyCode]
                            tx = transactionActions.preformatWithBSEforShow(transactionActions.preformat(tmp[0], { account }), tmp[0].bseOrderData, currencyCode)
                        } else {
                            const exchangeOrder = await UpdateTradeOrdersDaemon.fromApi(walletHash, orderHash)
                            if (exchangeOrder) {
                                // basic object for order without transaction
                                tx = transactionActions.preformatWithBSEforShow(false, exchangeOrder, currencyCode)
                            } else {
                                // do some alert as nothing found
                            }
                        }
                    } catch (e) {
                        Log.log('AccountTransactionScreen.init with orderHash error  ' + e)
                    }
                } else {
                    Log.log('WTF?')
                }
                Log.log('AccountTransactionScreen.tx search result ', JSON.parse(JSON.stringify(tx)))
            } else {
                tx = transaction
                currencyCode = transaction.currencyCode
            }

            const { cryptoCurrencies } = store.getState().currencyStore
            let cryptoCurrency = { currencyCode: false }
            for (const tmp of cryptoCurrencies) {
                if (tmp.currencyCode === currencyCode) {
                    cryptoCurrency = tmp
                }
            }

            this.init(tx, cryptoCurrency)

            if (typeof notification !== 'undefined' && notification) {
                this.setState(() => ({
                    transaction: tx,
                    account,
                    notification,
                    cryptoCurrency,
                    toOpenAccountBack
                }))
            } else {
                this.setState(() => ({
                    transaction: tx,
                    account,
                    cryptoCurrency,
                    toOpenAccountBack
                }))
            }
        } catch (e) {
            throw new Error(e.message + ' in TransactionScreen.UNSAFE_componentWillMount')
        }

    }

    rescanOnInit = async (transaction, cryptoCurrency) => {
        try {
            if (CACHE_RESCAN_TX) {
                return false
            }
            CACHE_RESCAN_TX = true
            if (cryptoCurrency.currencyCode === 'TRX' || (typeof cryptoCurrency.tokenBlockchain !== 'undefined' && cryptoCurrency.tokenBlockchain === 'TRON')) {
                const needRescanBalance = await UpdateAccountPendingTransactions.updateAccountPendingTransactions()
                if (needRescanBalance) {
                    await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: 'TRX', onlyBalances: true })
                }
            }
            CACHE_RESCAN_TX = false
        } catch (e) {
            CACHE_RESCAN_TX = false
            if (config.debug.appErrors) {
                console.log('AccountTransactionScreen.rescanOnInit error ' + e.message)
            }
        }
    }

    init = (transaction, cryptoCurrency) => {
        this.rescanOnInit(transaction, cryptoCurrency)

        Log.log('init transaction transaction', transaction)
        try {

            const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

            const outDestinationCardToView = this.prepareOutDestinationCard(transaction)

            const fromToView = this.prepareAddressFromToView(transaction)

            const addressToToView = this.prepareAddressToToView(transaction)

            const addressExchangeToView = this.prepareAddressExchangeToView(transaction)

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

            const transactionStatus = this.prepareStatusToView(transaction)
            transactionStatus ? subContent.push(transactionStatus) : null

            const blockTime = this.prepareDate(transaction.blockTime)
            blockTime ? subContent.push(blockTime) : null

            const blockConfirmations = this.prepareBlockConfirmations(transaction.blockConfirmations)
            blockConfirmations ? subContent.push(blockConfirmations) : null

            const blockNumber = this.prepareBlockNumber(transaction.blockNumber)
            blockNumber && blockNumber !== -1 ? subContent.push(blockNumber) : null

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
                commentToView,
                linkExplorer: transactionHashToView !== null ? transactionHashToView.linkUrl : null
            })

        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('AccountTransactionScreen init error ', e)
            }
            Log.err(`TransactionScreen init error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(transaction)}`)
        }
    }

    prepareAddressToToView = (transaction) => {
        if (transaction.bseOrderData) return false // added wrapper in preformatWithBSEforShow
        if (transaction.wayType === 'self') return false
        if (typeof transaction.addressTo === 'undefined' || !transaction.addressTo) return false
        return {
            title: strings(`account.transaction.to`),
            description: transaction.addressTo.toString()
        }

    }

    prepareAddressFromToView = (transaction) => {
        if (transaction.bseOrderData) return false
        if (typeof transaction.addressFrom === 'undefined' || !transaction.addressFrom) return false
        if (transaction.addressFrom.indexOf(',') !== -1) {
            return {
                title: strings(`account.transaction.from`),
                description: transaction.addressFrom.toString().slice(0, transaction.addressFrom.indexOf(','))
            }
        } else {
            return {
                title: strings(`account.transaction.from`),
                description: transaction.addressFrom.toString()
            }
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
        if (typeof transaction.transactionJson === 'undefined') return null
        // @ksu check this
        if (transaction.transactionJson === null) {
            return {
                title: strings(`send.comment`),
                description: ''
            }
        }

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

        const now = new Date().getTime()
        const diff = now - this.props.cacheAsked * 1
        if (!this.props.cacheAsked || diff > 10000) {
            showModal({
                type: 'YES_NO_MODAL',
                title: strings('account.externalLink.title'),
                icon: 'WARNING',
                description: strings('account.externalLink.description')
            }, () => {
                AsyncStorage.setItem('asked', now + '')
                this.props.cacheAsked = now
                this.openLink(link)
            })
        } else {
            this.openLink(link)
        }

        // NavStore.goNext('WebViewScreen', { url: link, title: strings('account.transactionScreen.explorer') })
    }

    openLink = (link) => {
        try {
            let linkUrl = link
            if (linkUrl.indexOf('?') === -1) {
                linkUrl += '?from=trustee'
            }
            Linking.openURL(linkUrl)
        } catch (e) {
            Log.err('Account.AccountScreen open URI error ' + e.message + ' ' + link)
        }

    }

    prepareTransactionFeeToView = (transaction) => {
        if (typeof transaction.transactionFee === 'undefined' || !transaction.transactionFee) return null
        const title = strings(`account.transaction.fee`)
        if (transaction.transactionDirection === 'income') {
            // not my txs no fees to show
            // title = strings(`account.transaction.feeIncome`)
            return null
        }

        const fiatFee = Number(transaction.basicFeePretty) < 0.01 ? `< ${transaction.basicFeeCurrencySymbol} 0.01` : `${transaction.basicFeeCurrencySymbol} ${transaction.basicFeePretty}`

        return {
            title,
            description: `${transaction.transactionFeePretty} ${transaction.feesCurrencySymbol} (${fiatFee})`
        }

    }

    prepareTransactionDestinationTag = (transaction, currencyCode) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.memo === 'undefined') return null
        let txt = transaction.transactionJson.memo
        if (!txt || txt === null) return null
        txt = txt.toString().trim()
        if (txt === '') return null
        if (currencyCode === 'XRP' || currencyCode === 'XLM' || currencyCode === 'BNB') {
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
            return {
                title: strings(`account.transaction.status`),
                description: strings(`account.transactionStatuses.${transaction.transactionVisibleStatus.toLowerCase()}`)
            }
        }
        return {
            title: strings(`account.transaction.status`),
            description: strings(`exchange.ordersStatus.${transaction.bseOrderData.exchangeWayType.toLowerCase()}.${transaction.bseOrderData.status.toLowerCase()}`)
        }
    }

    prepareTransactionHashToView = (transaction, cryptoCurrency) => {
        if (!transaction.transactionHash) return null
        if (transaction.wayType === 'BUY' && transaction.bseOrderData !== false && transaction.bseOrderData.status.toUpperCase() !== 'DONE_PAYOUT') return null
        let linkUrl = typeof cryptoCurrency.currencyExplorerTxLink !== 'undefined' ? cryptoCurrency.currencyExplorerTxLink + transaction.transactionHash : ''

        if (linkUrl.length !== 0 && linkUrl.indexOf('?') === -1) {
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
        if (blockConfirmations === '' || blockConfirmations === false) {
            return false
        }
        if (typeof blockConfirmations !== 'undefined' && blockConfirmations > 0) {
            tmp = blockConfirmations.toString()
            if (blockConfirmations > 20) {
                tmp = '20+'
            }
        }
        return {
            title: strings(`account.transaction.confirmations`),
            description: tmp.toString()
        }
    }

    prepareBlockNumber = (blockNumber) => {
        if (typeof blockNumber === 'undefined' || !blockNumber || blockNumber === null || blockNumber === -1) return false
        return {
            title: strings(`account.transaction.blockNumber`),
            description: blockNumber.toString()
        }
    }

    onLongPressEditableCallback = () => {
        this.setState({
            commentEditable: true
        })

        setTimeout(() => {
            try {
                this.commentInput.focus()
            } catch (e) {
            }
        }, 500)

    }

    onBlurComment = async (item) => {
        try {
            this.setState({
                commentEditable: false,
                focused: false
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

            // @ksu check this plz
            if (transactionJson === null || transactionJson.comment !== comment) {
                await transactionDS.saveTransaction(transaction, updateID, 'onBlurComment')
            }
        } catch (e) {
            Log.err(`AccountScreen.Transaction/onBlurComment error ${e.message}; Transaction - ${JSON.stringify(this.state.transaction)}`)
        }
    }

    backAction = async () => {
        if (this.state.toOpenAccountBack) {
            const { cryptoCurrency } = this.props
            setSelectedCryptoCurrency(cryptoCurrency)
            await setSelectedAccount()
            NavStore.reset('AccountScreen')
        } else {
            NavStore.goBack()
        }
    }

    closeAction = () => {
        NavStore.reset('HomeScreen')
    }

    getTransactionDate(transaction) {
        const datetime = new Date(transaction.createdAt)
        return datetime.toTimeString().slice(0, 8) + ' ' +
            (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '/' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + '/' + datetime.getFullYear()
    }

    prepareStatusHeaderToView = (status) => {
        return strings(`account.transactionScreen.header.status.${status.toLowerCase()}`).toUpperCase()
    }

    headerTrx = (transaction, color, cryptoCurrency) => {

        if (Object.keys(transaction).length === 0) {
            return (
                <View></View>
            )
        }

        const { colors, isLight, GRID_SIZE } = this.context

        const { transactionStatus, transactionDirection, addressAmountPretty, addressAmountPrettyPrefix, wayType, transactionVisibleStatus } = transaction

        const currencySymbol = typeof cryptoCurrency !== 'undefined' ? cryptoCurrency.currencySymbol : ''

        let status = transactionVisibleStatus

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ color: colors.common.text1, fontSize: 17 }} />

        if (transactionDirection === 'income' || transactionDirection === 'claim' || transactionDirection === 'swap_income') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ color: colors.common.text1, fontSize: 17 }} />
        }
        if (transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name='infinity' style={{ color: colors.common.text1, fontSize: 17 }} />
        }
        // if (transactionStatus === 'fail' || transactionStatus === 'missing' || transactionStatus === 'replaced') {
        //     arrowIcon = <Feather name='x' style={{ color: colors.common.text1, fontSize: 17 }} />
        // }

        let amountTxt = addressAmountPrettyPrefix + ' ' + addressAmountPretty
        let statusTxt = strings('account.transaction.' + wayType.toLowerCase())
        if (addressAmountPretty === '?') {
            if (transaction.bseOrderData) {
                amountTxt = '#' + transaction.bseOrderData.orderHash
            }
            if (this.state.notification && this.state.notification.title) {
                statusTxt = this.state.notification.title
                if (this.state.notification.newsName === 'ORDER_SUCCESS') {
                    status = 'SUCCESS' // @hard fix todo remove
                }
            }
        }
        return (
            <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={{ ...styles.txDirection, color: colors.common.text1 }}>
                        {capitalize(statusTxt)}
                    </Text>
                    <View>
                        {arrowIcon}
                    </View>
                </View>
                <View style={{ paddingVertical: 8 }}>
                    <Text
                        style={styles.date}>{this.getTransactionDate(transaction)}</Text>
                </View>
                <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: GRID_SIZE }}>
                    <View style={{ ...styles.statusLine, borderBottomColor: color }} />
                    <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                        <View style={{ ...styles.statusBlock, backgroundColor: color }}>
                            <LetterSpacing text={this.prepareStatusHeaderToView(status)}
                                textStyle={{ ...styles.status, color: colors.transactionScreen.status }} letterSpacing={1.5} />
                        </View>
                    </View>
                </View>
                <View style={styles.topContent__title}>
                    <>
                        <Text style={{ ...styles.amount, color: colors.common.text1 }}>
                            {amountTxt}
                        </Text>
                        <Text style={{ ...styles.code, color: color }}>{currencySymbol}</Text>
                    </>
                </View>

            </View>
        )
    }

    renderReplaceByFeeRemove = (array) => {
        let { account } = this.props
        const { transaction } = this.state
        if (typeof account === 'undefined' || !account) {
            account = this.state.account
        }
        if (!account) {
            return false
        }
        if (transaction.transactionDirection === 'income') {
            return false
        }
        if (transaction.transactionBlockchainStatus !== 'new' && transaction.transactionBlockchainStatus !== 'missing') {
            return false
        }
        if (!BlocksoftTransfer.canRBF(account, transaction, 'REMOVE')) {
            Log.log('AccountTransactionScreen.renderReplaceByFee could not remove', { account, transaction })
            return false
        }
        array.push({
            icon: 'canceled', title: strings('account.transactionScreen.removeRbf'), action: async () => {
                await SendActionsStart.startFromTransactionScreenRemove(account, transaction)
            }
        })
        return true

    }

    renderRemoveButton = (array) => {
        const { transaction } = this.state
        if (!transaction.bseOrderData) {
            return false
        }
        if (typeof transaction.bseOrderData.canBeDeleted === 'undefined' || !transaction.bseOrderData.canBeDeleted) {
            return false
        }
        array.push({
            icon: 'delete', title: strings('account.transactionScreen.remove'), action: async () => {
                // called 3 times on one click!!!
                if (CACHE_DELETE_ORDER_ID === transaction.bseOrderData.orderId) return false
                CACHE_DELETE_ORDER_ID = transaction.bseOrderData.orderId
                setLoaderStatus(true)
                try {
                    await UpdateTradeOrdersDaemon.removeId(transaction.bseOrderData.orderId)
                } catch (e) {
                    CACHE_DELETE_ORDER_ID = false
                    Log.err('AccountTransactionScreen.removeButton error ' + e.message)
                }
                setLoaderStatus(false)
            }
        })
        return true
    }

    renderReplaceByFee = (array) => {
        let { account } = this.props
        const { transaction } = this.state
        if (typeof account === 'undefined' || !account) {
            account = this.state.account
        }
        if (!account || typeof account.currencyCode === 'undefined') {
            return false
        }
        if (transaction.transactionHash === 'undefined' || !transaction.transactionHash || transaction.transactionHash === '') {
            return false
        }
        if (transaction.transactionBlockchainStatus !== 'new' && transaction.transactionBlockchainStatus !== 'missing') {
            return false
        }
        if (account.currencyCode === 'BTC' && transaction.addressTo.indexOf('OMNI') !== -1) {
            return false
        }
        if (!BlocksoftTransfer.canRBF(account, transaction, 'REPLACE')) {
            Log.log('AccountTransactionScreen.renderReplaceByFee could not replace', { account, transaction })
            return false
        }
        array.push({
            icon: 'rbf', title: strings('account.transactionScreen.booster'), action: async () => {
                if (transaction.bseOrderData && typeof transaction.bseOrderData.disableTBK !== 'undefined') {
                    if (transaction.bseOrderData.disableTBK) {
                        showModal({
                            type: 'INFO_MODAL',
                            icon: null,
                            title: strings('modal.titles.attention'),
                            description: strings('modal.send.noTBKprovider')
                        })
                        return false
                    }
                }
                await SendActionsStart.startFromTransactionScreenBoost(account, transaction)
            }
        })
        return true
    }

    renderCheckV3 = (array) => {
        const { transaction } = this.state
        if (!transaction.bseOrderData) { // simplified
            return false
        }
        if (typeof transaction.bseOrderData.uiApiVersion !== 'undefined' && transaction.bseOrderData.uiApiVersion === 'v2') {
            return false
        }
        array.push({
            icon: 'check',
            title: strings('account.transactionScreen.check'),
            action: async () => NavStore.goNext('AccountTransactionCheckScreen', { orderHash: transaction.bseOrderData.orderHash })
        })
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

    shareTransaction = (transaction, linkUrl) => {
        const shareOptions = { message: '' }
        if (transaction.transactionHash) {
            shareOptions.message += strings('account.transactionScreen.transactionHash') + ` ${linkUrl}\n`
        }
        shareOptions.message += strings('account.transactionScreen.cashbackLink') + ` ${this.props.cashBackStore.dataFromApi.cashbackLink}\n` + strings('account.transactionScreen.thanks')
        if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData) {
            shareOptions.message = strings(`account.transaction.orderId`) + ` ${transaction.bseOrderData.orderHash}\n` + shareOptions.message
        }
        // shareOptions.url = this.props.cashBackStore.dataFromApi.cashbackLink
        prettyShare(shareOptions, 'taki_share_transaction')
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 20 })
            } catch (e) {
            }
        }, 100)
    }

    commentHandler = () => {

        const { commentToView, commentEditable } = this.state

        const { colors } = this.context

        return (
            <>
                {commentToView ?
                    !commentEditable ?
                        <TouchableOpacity onPress={this.onLongPressEditableCallback}>
                            <TransactionItem
                                title={commentToView.title}
                                iconType='notes'
                                subtitle={commentToView.description}
                            />
                        </TouchableOpacity> :
                        <View style={{ ...styles.textInputWrapper, backgroundColor: colors.transactionScreen.comment }}>
                            <TextInput
                                ref={ref => this.commentInput = ref}
                                placeholder={strings('account.transactionScreen.commentPlaceholder')}
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
                                onFocus={this.onFocus}
                                value={commentToView !== null ? commentToView.description : commentToView}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                style={{ ...styles.input, color: colors.common.text2 }}
                                placeholderTextColor={colors.common.text2}
                            />
                        </View>
                    :
                    null
                }
            </>
        )
    }

    handleSubContentPress = (item) => {
        if (typeof item.plain !== 'undefined') {
            copyToClipboard(item.plain)
        } else if (item.isLink) {
            copyToClipboard(item.linkUrl)
        } else {
            copyToClipboard(item.title + ': ' + item.description)
        }
        Toast.setMessage(strings('toast.copied')).show()
    }

    renderButtons = (buttonsArray) => {
        return (
            <View style={{ height: 120, paddingTop: 20 }}>
                {buttonsArray[1].length === 0 ?
                    <Buttons
                        data={buttonsArray[0]}
                        title={true}
                    /> :
                    <Pages indicatorColor={'#5C5C5C'}>
                        {buttonsArray.map((item) => {
                            return (
                                // eslint-disable-next-line react/jsx-key
                                <Buttons
                                    data={item}
                                    title={true}
                                />
                            )
                        })}
                    </Pages>}
            </View>
        )
    }


    render() {

        MarketingAnalytics.setCurrentScreen('Account.TransactionScreen')

        const { colors, GRID_SIZE, isLight } = this.context
        // const { cryptoCurrency } = this.props

        const { transaction, showMoreDetails, outDestinationCardToView, fromToView, addressToToView, addressExchangeToView, subContent, linkExplorer, focused, cryptoCurrency } = this.state
        if (!transaction || typeof transaction === 'undefined') {
            // @yura - its loader when state is initing from notice open - could have some "loader" mark
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        // Log.log()
        // Log.log()
        // Log.log('AccountTransactionScreen.Transaction', JSON.stringify(transaction))

        const dict = new UIDict(typeof cryptoCurrency !== 'undefined' ? cryptoCurrency.currencyCode : '')
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        const descriptionValue = typeof transaction.description !== 'undefined' ? transaction.description.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16))) : ''

        const buttonsArray = [
            [
                { icon: 'share', title: strings('account.transactionScreen.share'), action: () => this.shareTransaction(transaction, linkExplorer) },
                { icon: showMoreDetails ? 'close' : 'details', title: strings('account.transactionScreen.details'), action: () => this.showMoreDetails() }
            ], []]


        if (transaction.addressAmountPretty === '?') {
            buttonsArray[0].splice(2, 1)
        }

        this.renderCheckV3(buttonsArray[1])
        const rbf1 = this.renderReplaceByFeeRemove(buttonsArray[1])
        const rbf2 = this.renderReplaceByFee(buttonsArray[1])
        if (!rbf1 && !rbf2) {
            this.renderRemoveButton(buttonsArray[1])
        }

        const prev = '' // @todo NavStore.getPrevRoute().routeName
        return (
            <ScreenWrapper
                leftType={(prev === 'ReceiptScreen' || prev === 'NotificationsScreen'
                    || prev === 'SMSCodeScreen' || prev === 'SMSV3CodeScreen') ? null : 'back'}
                leftAction={this.backAction}
                rightType='close'
                rightAction={(prev === 'ReceiptScreen' || prev === 'NotificationsScreen') ? () => NavStore.reset('HomeScreen') : this.closeAction}
                setHeaderHeight={this.setHeaderHeight}
                ExtraView={() => transaction ? this.headerTrx(transaction, color, cryptoCurrency) : null}
            >
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
                        paddingBottom: GRID_SIZE * 2,
                    }}
                >
                    <View>
                        {outDestinationCardToView ?
                            <TransactionItem
                                title={outDestinationCardToView.title}
                                iconType='card'
                                subtitle={outDestinationCardToView.description}
                                copyAction={() => this.handleSubContentPress({ plain: outDestinationCardToView.description })}
                            /> : fromToView ?
                                <TransactionItem
                                    title={fromToView.title}
                                    iconType='addressFrom'
                                    subtitle={fromToView.description}
                                    copyAction={() => this.handleSubContentPress({ plain: fromToView.description })}
                                /> : addressToToView ?
                                    <TransactionItem
                                        title={addressToToView.title}
                                        iconType='addressTo'
                                        subtitle={addressToToView.description}
                                        copyAction={() => this.handleSubContentPress({ plain: addressToToView.description })}
                                    /> : addressExchangeToView ?
                                        <TransactionItem
                                            title={addressExchangeToView.title}
                                            iconType='exchangeTo'
                                            subtitle={addressExchangeToView.description}
                                            copyAction={() => this.handleSubContentPress({ plain: addressExchangeToView.description })}
                                        /> : null
                        }
                        {transaction.wayType === 'self' && (
                            <TransactionItem
                                title={strings('account.transactionScreen.self')}
                                iconType='self'
                            // subtitle={'self'}
                            />
                        )}
                        {this.state.notification && (
                            <TransactionItem
                                title={this.state.notification.subtitle}
                                iconType='exchangeTo'
                            // subtitle={addressExchangeToView.description}
                            />
                        )}
                        <View style={{ marginVertical: GRID_SIZE, marginTop: 6 }}>
                            {this.commentHandler()}
                        </View>
                    </View>
                    <View>
                        {this.renderButtons(buttonsArray)}
                        {showMoreDetails && (
                            <View style={{ ...styles.moreInfo, borderRadius: 16, marginBottom: 20, backgroundColor: colors.transactionScreen.backgroundItem }}>
                                {subContent.map((item) => {
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
                                {linkExplorer !== null ?
                                    <TouchableOpacity onPress={() => this.handleLink(linkExplorer)}>
                                        <LetterSpacing textStyle={{ ...styles.viewExplorer, color: color }} text={strings('account.transactionScreen.viewExplorer').toUpperCase()} letterSpacing={1.5}
                                        />
                                    </TouchableOpacity> : null}
                            </View>)}
                    </View>
                </ScrollView>
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient}
                    start={styles.containerBG.start} end={styles.containerBG.end} />
            </ScreenWrapper>
        )
    }
}

AccountTransactionScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        settingsStore: state.settingsStore,
        cashBackStore: state.cashBackStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountTransactionScreen)

const styles = {
    txDirection: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        paddingRight: 4
    },
    date: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 14,
        color: '#999999'
    },
    amount: {
        fontSize: 32,
        fontFamily: 'Montserrat-Medium'
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
        maxWidth: 180
    },
    status: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12
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
        marginBottom: -6,
        marginTop: 6
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
        paddingBottom: 10,
        marginTop: 20,

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
        height: 62,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    viewExplorer: {
        flex: 1,
        textAlign: 'center',
        paddingBottom: 10,
        paddingTop: 20,

        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        textDecorationLine: 'underline'
    },
    input: {
        flex: 1,
        borderRadius: 10,
        padding: 16,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.3,
        paddingTop: 15
    },
    textInputWrapper: {
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
        },
        marginTop: 16
    }
}
