/**
 * @version 0.9
 */
import store from '../../store'

import transactionDS from '../DataSource/Transaction/Transaction'

import Log from '../../services/Log/Log'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import DaemonCache from '../../daemons/DaemonCache'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

const { dispatch } = store

const transactionActions = {

    /**
     * @param {object} transaction
     * @param {string} transaction.currencyCode
     * @param {string} transaction.walletHash
     * @param {string} transaction.accountId
     * @param {string} transaction.transactionHash
     * @param {string} transaction.transactionStatus
     * @param {string} transaction.addressTo
     * @param {string} transaction.addressFrom
     * @param {string} transaction.addressAmount
     * @param {string} transaction.transactionFee
     * @param {string} transaction.transactionOfTrusteeWallet
     * @param {string} transaction.transactionJson
     * @param {string} transaction.transactionJson.bseOrderID
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     */
    saveTransaction: async (transaction) => {

        try {
            await transactionDS.saveTransaction(transaction)

            const account = JSON.parse(JSON.stringify(store.getState().mainStore.selectedAccount))

            if (transaction.accountId === account.accountId) {

                const prepared = { ...account }
                const tx = JSON.parse(JSON.stringify(transaction))
                transactionActions.preformat(tx, account)
                prepared.transactions[tx.transactionHash] = tx

                dispatch({
                    type: 'SET_SELECTED_ACCOUNT',
                    selectedAccount: prepared
                })
            }

            if (typeof transaction.transactionJson.bseOrderID !== 'undefined') {
                UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true })
            }

        } catch (e) {

            Log.err('ACT/Transaction saveTransaction ' + e.message)
        }

    },

    /**
     *
     * @param transaction.accountId
     * @param transaction.transactionHash
     * @param transaction.transactionUpdateHash
     * @param transaction.transactionsOtherHashes
     * @param transaction.transactionJson
     * @returns {Promise<void>}
     */
    updateTransaction: async (transaction) => {
        try {

            await transactionDS.updateTransaction(transaction)

            const account = JSON.parse(JSON.stringify(store.getState().mainStore.selectedAccount))

            if (transaction.accountId === account.accountId) {

                const prepared = { ...account }

                let tx
                for (tx of prepared.transactions) {
                    if (tx.transactionHash === transaction.transactionUpdateHash) {
                        tx.transactionHash = transaction.transactionUpdateHash
                        tx.transactionsOtherHashes = transaction.transactionsOtherHashes
                        tx.transactionJson = transaction.transactionJson
                    }
                }

                dispatch({
                    type: 'SET_SELECTED_ACCOUNT',
                    selectedAccount: prepared
                })
            }

        } catch (e) {

            Log.err('ACT/Transaction updateTransaction ' + e.message)
        }
    },

    preformat(transaction, account) {
        if (!transaction) return

        let addressAmountSatoshi = false

        try {
            transaction.addressAmountNorm = BlocksoftPrettyNumbers.setCurrencyCode(account.currencyCode).makePretty(transaction.addressAmount)
            const res = BlocksoftPrettyNumbers.makeCut(transaction.addressAmountNorm)
            if (res.isSatoshi) {
                addressAmountSatoshi = '...' + transaction.addressAmount
                transaction.addressAmountPretty = res.cutted
            } else {
                transaction.addressAmountPretty = res.separated
            }
        } catch (e) {
            e.message += ' on addressAmountPretty'
            throw e
        }

        transaction.basicCurrencySymbol = account.basicCurrencySymbol
        transaction.basicAmountPretty = 0

        transaction.addressAmountSatoshi = addressAmountSatoshi
        if (!addressAmountSatoshi) {
            try {
                if (account.basicCurrencyRate === 1) {
                    transaction.basicAmountNorm = transaction.addressAmountNorm
                } else {
                    transaction.basicAmountNorm = transaction.addressAmountNorm * account.basicCurrencyRate
                }
                transaction.basicAmountPretty = BlocksoftPrettyNumbers.makeCut(transaction.basicAmountNorm, 2).separated
            } catch (e) {
                e.message += ' on basicAmountPretty ' + transaction.addressAmountPretty
                throw e
            }
        }

        transaction.basicFeePretty = 0
        transaction.basicFeeCurrencySymbol = ''

        let feeRates, feeCurrencyCode
        if (transaction.transactionFeeCurrencyCode && transaction.transactionFeeCurrencyCode !== account.feesCurrencyCode) {
            feeCurrencyCode = transaction.transactionFeeCurrencyCode
            const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(transaction.transactionFeeCurrencyCode)
            transaction.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode
            feeRates = DaemonCache.getCacheRates(transaction.transactionFeeCurrencyCode)
        } else {
            feeCurrencyCode = account.feesCurrencyCode
            transaction.feesCurrencySymbol = account.feesCurrencySymbol
            feeRates = account.feeRates
        }

        let getBasic = true

        if (typeof transaction.transactionFee === 'undefined') {
            Log.log('ACT/Transaction preformat bad transactionFee ' + JSON.stringify(transaction.transactionFee))
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else if (!transaction.transactionFee || transaction.transactionFee === 0) {
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else {
            try {
                const tmp = BlocksoftPrettyNumbers.setCurrencyCode(feeCurrencyCode).makePretty(transaction.transactionFee)
                const tmp2 = BlocksoftUtils.fromENumber(tmp*1)
                const res = BlocksoftPrettyNumbers.makeCut(tmp2, 7)
                if (res.isSatoshi) {
                    getBasic = false
                    transaction.transactionFeePretty =  '...' + transaction.transactionFee
                    if (transaction.feesCurrencySymbol === 'ETH') {
                        transaction.feesCurrencySymbol = 'wei'
                    } else if (transaction.feesCurrencySymbol === 'BTC' || transaction.feesCurrencySymbol === 'BTC') {
                        transaction.feesCurrencySymbol = 'sat'
                    }
                } else {
                    transaction.transactionFeePretty = res.cutted
                }
            } catch (e) {
                e.message += ' on transactionFeePretty with tx ' + JSON.stringify(transaction)
                throw e
            }
        }

        try {
            if (!transaction.transactionFee) {
                transaction.transactionFee = 0
            }
            if (feeRates) {
                transaction.basicFeeCurrencySymbol = feeRates.basicCurrencySymbol
                if (feeRates.basicCurrencyRate === 1) {
                    transaction.basicFeePretty = BlocksoftPrettyNumbers.makeCut(transaction.transactionFeePretty, 2).justCutted
                } else if (getBasic) {
                    transaction.basicFeePretty = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.mul(transaction.transactionFeePretty, feeRates.basicCurrencyRate), 2).justCutted
                } else {
                    transaction.basicFeePretty = '0'
                }
            }
        } catch (e) {
            e.message += ' on basicFeePretty'
            throw e
        }

    },

    /**
     * @param {string} account.walletHash
     * @param {string} account.currencyCode
     * @return {Promise<Array>}
     */
    getTransactions: async (account) => {

        let transactions = []

        try {

            transactions = await transactionDS.getTransactions({
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            })

        } catch (e) {

            Log.err('ACT/Transaction getTransactions ' + e.message)
        }

        return transactions
    }

}

export default transactionActions
