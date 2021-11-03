/**
 * @version 0.31
 * @author yura
 */
import React, { PureComponent } from 'react'
import {
    Platform,
    View,
    Text,
    ScrollView,
    Linking,
    TouchableOpacity
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'

import Log from '@app/services/Log/Log'

import UIDict from '@app/services/UIDict/UIDict'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import TransactionItem from './elements/TransactionItem'

import DaemonCache from '@app/daemons/DaemonCache'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'

import store from '@app/store'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import GradientView from '@app/components/elements/GradientView'
import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import config from '@app/config/config'
import { setLoaderStatus, setSelectedAccount, setSelectedAccountTransactions, setSelectedCryptoCurrency, setSelectedTransaction } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import UpdateAccountPendingTransactions from '@app/daemons/back/UpdateAccountPendingTransactions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import TransactionButton from '../elements/TransactionButton'
import CustomIcon from '@app/components/elements/CustomIcon'

import HeaderTx from './elements/Header'

import { getSelectedAccountData, getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getCashBackLinkFromDataAPi } from '@app/appstores/Stores/CashBack/selectors'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { HIT_SLOP } from '@app/theme/HitSlop'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

import TextInput from '@app/components/elements/new/TextInput'
import { getExplorerLink } from '../helpers'
import ApiV3 from '@app/services/Api/ApiV3'


let CACHE_RESCAN_TX = false

class AccountTransactionScreen extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            account: {},
            transaction: {},
            subContent: [],
            showMoreDetails: false,
            fromToView: null,
            addressToToView: null,
            addressExchangeToView: null,
            commentToView: null,
            commentEditable: false,
            transactionHashToView: false,
            orderIdToView: false,
            transactionsOtherHashesToView: false,
            transactionFeeToView: false,

            linkExplorer: null,

            focused: false,
            notification: false,
            toOpenAccountBack: false,
            uiType: false
        }
    }

    async UNSAFE_componentWillMount() {
        try {
            const data = NavStore.getParamWrapper(this, 'txData')
            const source = NavStore.getParamWrapper(this, 'source')
            console.log('AccountTransactionScreen mount source ' + JSON.stringify(source))

            let { transactionHash, transactionStatus, currencyCode, orderHash, walletHash, transaction, notification, toOpenAccountBack, uiType } = data
            let tx
            let account

            if (!transaction) {
                if (typeof walletHash === 'undefined' || !walletHash) {
                    const wallet = this.props.selectedWallet
                    walletHash = wallet.walletHash
                }
                // @ksu stay only this without selector
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

            let cryptoCurrency = { currencyCode: false }
            for (const tmp of this.props.cryptoCurrencies) {
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
                    toOpenAccountBack,
                    uiType
                }))
            } else {
                this.setState(() => ({
                    transaction: tx,
                    account,
                    cryptoCurrency,
                    toOpenAccountBack,
                    uiType
                }))
            }
        } catch (e) {
            throw new Error(e.message + ' in TransactionScreen.UNSAFE_componentWillMount')
        }

    }

    rescanOnInit = async (cryptoCurrency) => {
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
        this.rescanOnInit(cryptoCurrency)

        Log.log('AccountTransactionScreen.init transaction', transaction)
        try {

            const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

            const fromToView = this.prepareAddressFromToView(transaction)

            const addressToToView = this.prepareAddressToToView(transaction)

            const addressExchangeToView = this.prepareAddressExchangeToView(transaction)

            const commentToView = this.prepareCommentToView(transaction)

            const transactionHashToView = this.prepareTransactionHashToView(transaction, cryptoCurrency)

            const orderIdToView = this.prepareOrderIdToView(transaction)

            const transactionsOtherHashesToView = this.prepareTransactionsOtherHashesToView(transaction, cryptoCurrency)

            const transactionFeeToView = this.prepareTransactionFeeToView(transaction)

            const subContent = []

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

            const transactionNonce = this.prepareTransactionNonce(transaction)
            transactionNonce ? subContent.push(transactionNonce) : null

            const transactionDelegatedNonce = this.prepareTransactionDelegatedNonce(transaction)
            transactionDelegatedNonce ? subContent.push(transactionDelegatedNonce) : null

            this.setState({
                subContent,
                fromToView,
                addressToToView,
                addressExchangeToView,
                commentToView,
                transactionHashToView,
                orderIdToView,
                transactionsOtherHashesToView,
                transactionFeeToView,
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
        if (!transaction.bseOrderData || !transaction.bseOrderData?.depositAddress) return false
        return {
            title: strings(`account.transaction.${transaction.transactionDirection === 'income' ? 'from' : 'to'}`),
            description: transaction.bseOrderData.depositAddress.toString()
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
               trusteeAsyncStorage.setExternalAsked(now + '')
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

    prepareTransactionNonce = (transaction) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.nonce === 'undefined') return null
        return {
            title: strings(`account.transaction.nonce`),
            description: transaction.transactionJson.nonce.toString() || '(none)'
        }
    }

    prepareTransactionDelegatedNonce = (transaction) => {
        if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.delegatedNonce === 'undefined') return null
        return {
            title: strings(`account.transaction.delegatedNonce`),
            description: transaction.transactionJson.delegatedNonce.toString()
        }
    }

    prepareTransactionHashToView = (transaction, cryptoCurrency) => {
        if (!transaction.transactionHash) return null
        if (transaction.wayType === 'BUY' && transaction.bseOrderData !== false && transaction.bseOrderData.status.toUpperCase() !== 'DONE_PAYOUT') return null

        let linkUrl = typeof cryptoCurrency.currencyExplorerTxLink !== 'undefined' ? getExplorerLink(cryptoCurrency.currencyCode, 'hash', transaction.transactionHash) : false
        if (linkUrl && linkUrl.indexOf('?') === -1) {
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
        const tmp = transaction.transactionsOtherHashes.split(',')

        return tmp.map(item => {
            let linkUrl = getExplorerLink(cryptoCurrency.currencyCode, 'hash', item)
            if (linkUrl.indexOf('?') === -1) {
                linkUrl += '?from=trustee'
            }

            return {
                title: strings(`account.transaction.replacedTxHash`),
                description: item,
                isLink: true,
                linkUrl
            }
        })
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

            const tx = {
                ...this.state.transaction,
                ...transaction
            }

            if (transactionJson === null || transactionJson.comment !== comment) {
                await transactionDS.saveTransaction(transaction, updateID, 'onBlurComment')
                setSelectedTransaction(tx, 'AccountTransactionScreen.onBlurComment')
            }
        } catch (e) {
            Log.err(`AccountScreen.Transaction/onBlurComment error ${e.message}; Transaction - ${JSON.stringify(this.state.transaction)}`)
        }
    }

    backAction = async () => {
        if (this.state.uiType === 'TRADE_SEND') {
            NavStore.reset('TabBar')
        } else if (this.state.toOpenAccountBack) {
            setSelectedCryptoCurrency(this.props.cryptoCurrency)
            await setSelectedAccount('AccountTransactionScreen.backAction')
            await setSelectedAccountTransactions('AccountTransactionScreen.backAction')
            NavStore.reset('AccountScreen')
        } else {
            NavStore.goBack()
        }
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
            Log.log('AccountTransactionScreen.renderReplaceByFeeRemove could not remove', { account, transaction })
            return false
        }
        array.push({
            icon: 'canceled', title: strings('account.transactionScreen.removeRbf'), action: async () => {
                try {
                    setLoaderStatus(true)
                    await SendActionsStart.startFromTransactionScreenRemove(account, transaction)
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('AccountTransactionScreen.renderReplaceByFeeRemove error ' + e.message )
                    }
                    Log.err('AccountTransactionScreen.renderReplaceByFeeRemove error ' + e.message )
                    setLoaderStatus(false)
                }
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
        if (!transaction.addressTo || transaction.addressTo === '') {
            transaction.addressTo = transaction.basicAddressTo || account.address
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
                try {
                    setLoaderStatus(true)
                    const disable = await ApiV3.getTBKDisable(transaction.transactionHash)
                    if (disable) {
                        showModal({
                            type: 'INFO_MODAL',
                            icon: null,
                            title: strings('modal.titles.attention'),
                            description: strings('modal.send.noTBKprovider')
                        })
                        setLoaderStatus(false)
                        return false
                    }
                    try {
                        await SendActionsStart.startFromTransactionScreenBoost(account, transaction)
                    } catch (e) {
                        e.message += ' while SendActionsStart.startFromTransactionScreenBoost'
                        throw e
                    }
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('AccountTransactionScreen.renderReplaceByFee error ' + e.message )
                    }
                    Log.err('AccountTransactionScreen.renderReplaceByFee error ' + e.message )
                    setLoaderStatus(false)
                }
            }
        })
        return true
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

    shareTransaction = () => {
        const { transaction, linkExplorer, fromToView, addressToToView } = this.state

        Log.log('AccountTransactionScreen.shareTransaction cashbackLink', this.props.cashBackData.cashbackLink)

        const shareOptions = { message: '' }

        if (transaction.transactionHash) {
            shareOptions.message += `\n${strings('account.transactionScreen.transactionHash')} ${linkExplorer}\n`
        }

        shareOptions.message += `\n${strings('account.transactionScreen.transactionSum')} ${transaction.addressAmountNorm} ${transaction.currencyCode}\n`

        fromToView ? 
            shareOptions.message += `\n${strings('account.transactionScreen.addresFrom')} ${transaction.addressFrom}\n` :
                addressToToView ? 
                    shareOptions.message += `\n${strings('account.transactionScreen.addresTo')} ${transaction.addressTo}\n` : null

        shareOptions.message += `\n${strings('account.transactionScreen.blockConfirmations')} ${transaction.blockConfirmations > 20 ? '20+' : transaction.blockConfirmations}\n`

        if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData) {
            shareOptions.message = strings(`account.transaction.orderId`) `${transaction.bseOrderData.orderHash}\n` + shareOptions.message
        }

        shareOptions.message += `\n${(this.props.cashBackData.cashbackLink ? strings('account.transactionScreen.cashbackLink') + ` ${this.props.cashBackData.cashbackLink}\n` : '\n')}`
        // shareOptions.url = this.props.cashBackData.dataFromApi.cashbackLink
        prettyShare(shareOptions, 'taki_share_transaction')
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 100)
    }

    handleCommentChange = (value) => {
        const { commentToView } = this.state

        this.setState({
            commentToView: {
                ...commentToView,
                description: value
            },
            commentEditable: true
        })
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
                                compRef={ref => this.commentInput = ref}
                                placeholder={strings('account.transactionScreen.commentPlaceholder')}
                                onBlur={() => this.onBlurComment(commentToView)}
                                onChangeText={this.handleCommentChange}
                                onFocus={this.onFocus}
                                value={commentToView !== null ? commentToView.description : commentToView}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                style={{ ...styles.input, color: colors.common.text2 }}
                                placeholderTextColor={colors.common.text2}
                                paste={true}
                                callback={this.handleCommentChange}
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
        if (!buttonsArray.length) return

        const { colors } = this.context

        return (
            <View style={styles.buttonWrapper}>
                {buttonsArray.map(item => {
                    return (
                        // eslint-disable-next-line react/jsx-key
                        <TransactionButton
                            text={item.title}
                            action={item.action}
                            type={item.icon}
                            style={{ ...styles.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
                            textStyle={styles.textButton}
                        />
                    )
                })}
            </View>
        )
    }

    handlerOrderDetails = () => {
        NavStore.reset('MarketScreen', { screen: 'MarketScreen', params: { orderHash: this.state.orderIdToView.description } })
    }

    render() {

        MarketingAnalytics.setCurrentScreen('Account.TransactionScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const { transaction, showMoreDetails, fromToView, addressToToView, addressExchangeToView, subContent,
            linkExplorer, cryptoCurrency, transactionHashToView, orderIdToView, transactionsOtherHashesToView, transactionFeeToView } = this.state

        if (!transaction || typeof transaction === 'undefined') {
            // @yura - its loader when state is initing from notice open - could have some "loader" mark
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        const { transactionJson } = transaction

        const contractCallData = typeof transactionJson !== 'undefined' && transactionJson ? transactionJson.contractCallData : false

        // Log.log()
        // Log.log()
        // Log.log('AccountTransactionScreen.Transaction', JSON.stringify(transaction))

        const dict = new UIDict(typeof cryptoCurrency !== 'undefined' ? cryptoCurrency.currencyCode : '')
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        const buttonsArray = []


        this.renderReplaceByFeeRemove(buttonsArray)
        this.renderReplaceByFee(buttonsArray)

        const prev = '' // @todo NavStore.getPrevRoute().routeName
        return (
            <ScreenWrapper
                leftType={(prev === 'ReceiptScreen' || prev === 'NotificationsScreen' || prev === 'SMSV3CodeScreen') ? null : 'back'}
                leftAction={this.backAction}
                rightType='share'
                rightAction={this.shareTransaction}
                setHeaderHeight={this.setHeaderHeight}
                ExtraView={() => transaction && <HeaderTx
                    transaction={transaction}
                    color={color}
                    cryptoCurrency={cryptoCurrency}
                    notification={this.state.notification}
                />}
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
                        {this.renderButtons(buttonsArray)}

                        {typeof contractCallData !== 'undefined' && contractCallData && contractCallData.infoForUser.map((item) => {
                            return (
                                <TransactionItem
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    iconType={item.iconType}
                                />
                            )
                        })}

                        {orderIdToView && (
                            <TransactionItem
                                title={orderIdToView.title}
                                iconType='bse'
                                bse
                                subtitle={orderIdToView.description}
                                copyAction={() => this.handleSubContentPress({ plain: orderIdToView.description })}
                                orderHandler={this.handlerOrderDetails}
                                textOrder={strings('account.transactionScreen.order')}
                            />
                        )}
                        {fromToView ?
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
                            />
                        )}
                        {this.state.notification && (
                            <TransactionItem
                                title={this.state.notification.subtitle}
                                iconType='exchangeTo'
                            />
                        )}
                        {transactionHashToView && (
                            <TransactionItem
                                title={transactionHashToView.title}
                                iconType='txID'
                                subtitle={`${transactionHashToView.description.slice(0, 8)}...${transactionHashToView.description.slice(-8)}`}
                                copyAction={() => this.handleSubContentPress({ plain: transactionHashToView.linkUrl })}
                            />
                        )}
                        {transactionFeeToView && (
                            <TransactionItem
                                title={transactionFeeToView.title}
                                subtitle={transactionFeeToView.description}
                                iconType='txFee'
                                copyAction={() => this.handleSubContentPress({ plain: transactionFeeToView.description })}
                            />
                        )}
                        {transactionsOtherHashesToView && transactionsOtherHashesToView.length && (
                            <View style={{ ...styles.moreInfo, borderRadius: 16, marginTop: 16, backgroundColor: colors.transactionScreen.backgroundItem }}>
                                <View style={styles.hashesWrapper}>
                                    <CustomIcon name='nonce' color={colors.common.text1} size={20} />
                                    <Text style={[styles.title, { color: colors.common.text2 }]}>{strings(`account.transaction.replacedTxHash`)}</Text>
                                </View>
                                <View style={styles.hashes}>
                                    {transactionsOtherHashesToView.map((item) => {
                                        return (
                                            // eslint-disable-next-line react/jsx-key
                                            <TransactionItem
                                                mainTitle
                                                subtitle={`${item.description.slice(0, 8)}...${item.description.slice(-8)}`}
                                                isLink={item.isLink}
                                                linkUrl={item.linkUrl}
                                                withoutBack={true}
                                                handleLink={this.handleLink}
                                                copyAction={() => this.handleSubContentPress(item)}
                                                colorLink={color}
                                            />
                                        )
                                    }).reverse()}
                                </View>
                            </View>
                        )}
                        <View style={{ marginVertical: GRID_SIZE, marginTop: 0 }}>
                            {this.commentHandler()}
                        </View>
                    </View>
                    <View>
                        {subContent && subContent.length ?
                            <>
                                <TouchableOpacity onPress={this.showMoreDetails} style={styles.showMore} hitSlop={HIT_SLOP}>
                                    <LetterSpacing textStyle={{ ...styles.viewShowMore, color: colors.common.checkbox.bgChecked }}
                                        text={strings('account.showMore').toUpperCase()} letterSpacing={1.5} />
                                    <CustomIcon name={showMoreDetails ? 'up' : 'down'} color={colors.common.checkbox.bgChecked} size={20}
                                        style={{ marginTop: showMoreDetails ? -1 : -4 }} />
                                </TouchableOpacity>
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
                                                    handleLink={item.isLink ? this.handleLink : null}
                                                    copyAction={() => this.handleSubContentPress(item)}
                                                />
                                            )
                                        })}
                                        {linkExplorer !== null ?
                                            <TouchableOpacity onPress={() => this.handleLink(linkExplorer)}>
                                                <LetterSpacing textStyle={{ ...styles.viewExplorer, color: colors.common.checkbox.bgChecked }}
                                                    text={strings('account.transactionScreen.viewExplorer').toUpperCase()} letterSpacing={1.5}
                                                />
                                            </TouchableOpacity> : null}
                                    </View>)}
                            </>
                            : null}
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
        selectedWallet: getSelectedWalletData(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state),
        account: getSelectedAccountData(state),
        cashBackData: getCashBackLinkFromDataAPi(state),
        cryptoCurrencies: getVisibleCurrencies(state),
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountTransactionScreen)

const styles = {
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    moreInfo: {
        backgroundColor: '#F2F2F2',
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
        height: 42,
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
    },
    button: {
        borderRadius: 10,
        borderWidth: 2,
        width: 104,
        height: 60,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        marginLeft: 10,
        marginRight: 10
    },
    buttonWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 6
    },
    textButton: {
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        fontSize: 10,
        lineHeight: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 4
    },
    showMore: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
        textAlign: 'center',
        paddingBottom: 10,
        paddingTop: 20,
    },
    viewShowMore: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        paddingRight: 8,
    },
    hashesWrapper: {
        flexDirection: 'row',
        marginTop: 16
    },
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 14,
        marginTop: 2,
        marginBottom: -10,
        marginLeft: 15
    },
    hashes: {
        paddingLeft: 32
    }
}
