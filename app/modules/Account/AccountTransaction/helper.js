/**
 * @version 0.53
 * @author yura
 */

import {
    Linking
} from 'react-native'

import transactionActions from '@app/appstores/Actions/TransactionActions'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { setLoaderStatus, setSelectedTransaction } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import store from '@app/store'

import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import DaemonCache from '@app/daemons/DaemonCache'

import NavStore from '@app/components/navigation/NavStore'

import Log from '@app/services/Log/Log'
import { strings } from '@app/services/i18n'
import ApiV3 from '@app/services/Api/ApiV3'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

import config from '@app/config/config'

import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

import { getExplorerLink } from '../helpers'


export async function _onLoad() {
    try {
        const data = NavStore.getParamWrapper(this, 'txData')
        const source = NavStore.getParamWrapper(this, 'source')
        Log.log('AccountTransactionScreen.helper mount source ' + JSON.stringify(source))

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
                    let tmp = await transactionDS.getTransactions(searchParams, 'AccountTransactionScreen.helper.init with transactionHash ' + transactionHash)
                    if (!tmp && currencyCode) {
                        await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({
                            force: true,
                            currencyCode: currencyCode,
                            source: 'TRANSACTION_PUSH'
                        })
                        tmp = await transactionDS.getTransactions(searchParams, 'AccountTransactionScreen.helper.init with transactionHash ' + transactionHash)
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
                    Log.log('AccountTransactionScreen.helper.init with transactionHash error  ' + e)
                }
            } else if (orderHash) {
                try {
                    const tmp = await transactionDS.getTransactions({
                        bseOrderHash: orderHash
                    }, 'AccountTransactionScreen.helper.init with orderHash ' + orderHash)
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
                    Log.log('AccountTransactionScreen.helper.init with orderHash error  ' + e)
                }
            } else {
                Log.log('WTF?')
            }
            Log.log('AccountTransactionScreen.helper.tx search result ', JSON.parse(JSON.stringify(tx)))
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

        init.call(this, tx, cryptoCurrency)

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
        throw new Error(e.message + ' in AccountTransactionScreen.componentDidMount')
    }
}

export function init(transaction, cryptoCurrency) {
    this.rescanOnInit(cryptoCurrency)

    Log.log('AccountTransactionScreen.helper.init transaction', transaction)
    try {

        const fioMemo = DaemonCache.getFioMemo(cryptoCurrency.currencyCode)

        const fromToView = prepareAddressFromToView.call(this, transaction)

        const addressToToView = prepareAddressToToView.call(this, transaction)

        const addressExchangeToView = prepareAddressExchangeToView.call(this, transaction)

        const commentToView = prepareCommentToView.call(this, transaction)

        const transactionHashToView = prepareTransactionHashToView.call(this, transaction, cryptoCurrency)

        const orderIdToView = prepareOrderIdToView.call(this, transaction)

        const transactionsOtherHashesToView = prepareTransactionsOtherHashesToView.call(this, transaction, cryptoCurrency)

        const transactionFeeToView = prepareTransactionFeeToView.call(this, transaction)

        const subContent = []

        const blockTime = prepareDate.call(this, transaction.blockTime)
        blockTime ? subContent.push(blockTime) : null

        const blockConfirmations = prepareBlockConfirmations.call(this, transaction.blockConfirmations)
        blockConfirmations ? subContent.push(blockConfirmations) : null

        const blockNumber = prepareBlockNumber.call(this, transaction.blockNumber)
        blockNumber && blockNumber !== -1 ? subContent.push(blockNumber) : null

        const fioMemoToView = prepareFioMemoToView.call(this, fioMemo[transaction.transactionHash])
        fioMemoToView ? subContent.push(fioMemoToView) : null

        const transactionDestinationTag = prepareTransactionDestinationTag.call(this, transaction, cryptoCurrency.currencyCode)
        transactionDestinationTag ? subContent.push(transactionDestinationTag) : null

        const transactionNonce = prepareTransactionNonce.call(this, transaction)
        transactionNonce ? subContent.push(transactionNonce) : null

        const transactionDelegatedNonce = prepareTransactionDelegatedNonce.call(this, transaction)
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
            Log.log('AccountTransactionScreen.helper init error ', e)
        }
        Log.err(`AccountTransactionScreen.helper init error - ${JSON.stringify(e)} ; Transaction - ${JSON.stringify(transaction)}`)
    }
}

export function renderReplaceByFeeRemove(array) {
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

    if (transaction?.transactionFilterType !== 'walletConnect' && transaction?.wayType === 'fee') {
        return false
    }
    if (!BlocksoftTransfer.canRBF(account, transaction, 'REMOVE')) {
        Log.log('AccountTransactionScreen.helper.renderReplaceByFeeRemove could not remove', { account, transaction })
        return false
    }
    array.push({
        icon: 'canceled', title: strings('account.transactionScreen.removeRbf'), action: async () => {
            try {
                setLoaderStatus(true)
                await SendActionsStart.startFromTransactionScreenRemove(account, transaction)
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('AccountTransactionScreen.helper.renderReplaceByFeeRemove error ' + e.message)
                }
                Log.err('AccountTransactionScreen.helper.renderReplaceByFeeRemove error ' + e.message)
                setLoaderStatus(false)
            }
        }
    })
    return true

}

export function renderReplaceByFee(array) {
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


    if (transaction?.transactionFilterType !== 'walletConnect' && transaction?.wayType === 'fee') {
        return false
    }

    if (!BlocksoftTransfer.canRBF(account, transaction, 'REPLACE')) {
        Log.log('AccountTransactionScreen.helper.renderReplaceByFee could not replace', { account, transaction })
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
                    console.log('AccountTransactionScreen.helper.renderReplaceByFee error ' + e.message)
                }
                Log.err('AccountTransactionScreen.helper.renderReplaceByFee error ' + e.message)
                setLoaderStatus(false)
            }
        }
    })
    return true
}

function prepareAddressToToView(transaction) {
    if (transaction.bseOrderData) return false // added wrapper in preformatWithBSEforShow
    if (transaction.wayType === 'self') return false
    if (typeof transaction.addressTo === 'undefined' || !transaction.addressTo) return false
    return {
        title: strings(`account.transaction.to`),
        description: transaction.addressTo.toString()
    }

}

function prepareAddressFromToView(transaction) {
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

function prepareAddressExchangeToView(transaction) {
    if (!transaction.bseOrderData || !transaction.bseOrderData?.depositAddress) return false
    return {
        title: strings(`account.transaction.${transaction.transactionDirection === 'income' ? 'from' : 'to'}`),
        description: transaction.bseOrderData.depositAddress.toString()
    }
}

function prepareOrderIdToView(transaction) {
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

function prepareCommentToView(transaction) {
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

function prepareFioMemoToView(fioMemo) {
    if (typeof fioMemo === 'undefined' || fioMemo === null) return null
    return {
        title: strings(`send.fio_memo`),
        description: fioMemo
    }
}

export function handleLink(link) {

    const now = new Date().getTime()
    const diff = now - this.props.cacheAsked * 1
    if (!this.props.cacheAsked || diff > 10000) {
        showModal({
            type: 'YES_NO_MODAL',
            title: strings('account.externalLink.title'),
            icon: 'WARNING',
            description: strings('account.externalLink.description'),
            reverse: true
        }, () => {
            trusteeAsyncStorage.setExternalAsked(now + '')
            this.props.cacheAsked = now
            openLink.call(this, link)
        })
    } else {
        openLink.call(this, link)
    }

    // NavStore.goNext('WebViewScreen', { url: link, title: strings('account.transactionScreen.explorer') })
}

function openLink(link) {
    try {
        const linkUrl = BlocksoftPrettyStrings.makeFromTrustee(link)
        Linking.openURL(linkUrl)
    } catch (e) {
        Log.err('Account.AccountTransactionScreen.helper open URI error ' + e.message, link)
    }

}

function prepareTransactionFeeToView(transaction) {
    if (transaction.addressAmount * 1 <= 0) return null

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

function prepareTransactionDestinationTag(transaction, currencyCode) {
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

function prepareTransactionNonce(transaction) {
    if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.nonce === 'undefined') return null
    return {
        title: strings(`account.transaction.nonce`),
        description: transaction.transactionJson.nonce.toString() || '(none)'
    }
}

function prepareTransactionDelegatedNonce(transaction) {
    if (typeof transaction.transactionJson === 'undefined' || transaction.transactionJson === null || !transaction.transactionJson || typeof transaction.transactionJson.delegatedNonce === 'undefined') return null
    return {
        title: strings(`account.transaction.delegatedNonce`),
        description: transaction.transactionJson.delegatedNonce.toString()
    }
}

function prepareTransactionHashToView(transaction, cryptoCurrency) {
    if (!transaction.transactionHash) return null
    if (transaction.wayType === 'BUY' && transaction.bseOrderData !== false && transaction.bseOrderData.status.toUpperCase() !== 'DONE_PAYOUT') return null

    let linkUrl = typeof cryptoCurrency.currencyExplorerTxLink !== 'undefined' ? getExplorerLink(cryptoCurrency.currencyCode, 'hash', transaction.transactionHash) : false
    linkUrl = BlocksoftPrettyStrings.makeFromTrustee(linkUrl)

    return {
        title: strings(`account.transaction.txHash`),
        description: transaction.transactionHash,
        isLink: true,
        linkUrl
    }
}

function prepareTransactionsOtherHashesToView(transaction, cryptoCurrency) {
    if (!transaction.transactionsOtherHashes) return null
    const tmp = transaction.transactionsOtherHashes.split(',')

    return tmp.map(item => {
        let linkUrl = getExplorerLink(cryptoCurrency.currencyCode, 'hash', item)
        linkUrl = BlocksoftPrettyStrings.makeFromTrustee(linkUrl)

        return {
            title: strings(`account.transaction.replacedTxHash`),
            description: item,
            isLink: true,
            linkUrl
        }
    })
}

function prepareDate(createdAt) {
    if (!createdAt) return false
    const tmp = {
        title: strings('account.transaction.date'),
        description: '...'
    }
    tmp.description = new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString()
    return tmp
}

function prepareBlockConfirmations(blockConfirmations) {
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

function prepareBlockNumber(blockNumber) {
    if (typeof blockNumber === 'undefined' || !blockNumber || blockNumber === null || blockNumber === -1) return false
    return {
        title: strings(`account.transaction.blockNumber`),
        description: blockNumber.toString()
    }
}

export async function onBlurComment(item) {
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

export function shareTransaction() {
    const { transaction, linkExplorer, fromToView, addressToToView } = this.state

    Log.log('AccountTransactionScreen.helper.shareTransaction cashbackLink', this.props.cashBackData.cashbackLink)

    const shareOptions = { message: '' }

    if (transaction.transactionHash) {
        shareOptions.message += `\n${strings('account.transactionScreen.transactionHash')} ${linkExplorer}\n`
    }

    shareOptions.message += `\n${strings('account.transactionScreen.transactionSum')} ${transaction.addressAmountNorm} ${transaction.currencyCode}\n`

    fromToView ?
        shareOptions.message += `\n${strings('account.transactionScreen.addressFrom')} ${transaction.addressFrom}\n` :
        addressToToView ?
            shareOptions.message += `\n${strings('account.transactionScreen.addressTo')} ${transaction.addressTo}\n` : null

    shareOptions.message += `\n${strings('account.transactionScreen.blockConfirmations')} ${transaction.blockConfirmations > 20 ? '20+' : transaction.blockConfirmations}\n`

    if (typeof transaction.bseOrderData !== 'undefined' && transaction.bseOrderData) {
        shareOptions.message = strings(`account.transaction.orderId`) + ': ' + `${transaction?.bseOrderData?.orderHash || transaction?.bseOrderData?.orderId}\n` + shareOptions.message
    }

    shareOptions.message += `\n${(this.props.cashBackData.cashbackLink ? strings('account.transactionScreen.cashbackLink') + ` ${this.props.cashBackData.cashbackLink}\n` : '\n')}`
    // shareOptions.url = this.props.cashBackData.dataFromApi.cashbackLink
    prettyShare(shareOptions, 'taki_share_transaction')
}