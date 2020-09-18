/**
 * @version 0.9
 */
import store from '../../store'

import transactionDS from '../DataSource/Transaction/Transaction'

import Log from '../../services/Log/Log'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import prettyNumber from '../../services/UI/PrettyNumber/PrettyNumber'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import UpdateAccountsDaemon from '../../services/Daemon/elements/UpdateAccountsDaemon'

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
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     */
    saveTransaction: async (transaction) => {

        try {

            await transactionDS.saveTransaction(transaction)

            const account = JSON.parse(JSON.stringify(store.getState().mainStore.selectedAccount))

            console.log('transaction added', transaction.accountId, transaction.transactionHash, transaction)
            if (transaction.accountId === account.accountId) {

                const prepared = { ...account }
                const tx = JSON.parse(JSON.stringify(transaction))
                transactionActions.preformat(tx, account)
                prepared.transactions.unshift(tx)

                dispatch({
                    type: 'SET_SELECTED_ACCOUNT',
                    selectedAccount: prepared
                })
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

            console.log('transaction updated', transaction)

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
        // @misha review plz all like this to add in one place like here and unified
        try {
            let tmp = 1 * BlocksoftPrettyNumbers.setCurrencyCode(account.currencyCode).makePretty(transaction.addressAmount)
            transaction.addressAmountPretty = parseFloat(tmp.toFixed(5)) === 0 ? parseFloat(tmp.toFixed(10)) : parseFloat(tmp.toFixed(5))
        } catch (e) {
            e.message += ' on addressAmountPretty'
            throw e
        }

        transaction.basicCurrencySymbol = account.basicCurrencySymbol
        transaction.basicAmountPretty = 0

        try {
            if (account.basicCurrencyRate === 1) {
                transaction.basicAmountPretty = prettyNumber(transaction.addressAmountPretty, 2)
            } else {
                transaction.basicAmountPretty = prettyNumber(transaction.addressAmountPretty * account.basicCurrencyRate, 2)
            }
        } catch (e) {
            e.message += ' on basicAmountPretty'
            throw e
        }

        transaction.basicFeePretty = 0
        transaction.basicFeeCurrencySymbol = ''

        let feeRates, feeCurrencyCode
        if (transaction.transactionFeeCurrencyCode && transaction.transactionFeeCurrencyCode !== account.feesCurrencyCode) {
            feeCurrencyCode = transaction.transactionFeeCurrencyCode
            const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(transaction.transactionFeeCurrencyCode)
            transaction.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode
            feeRates = UpdateAccountsDaemon.getCacheRates(transaction.transactionFeeCurrencyCode)
        } else {
            feeCurrencyCode = account.feesCurrencyCode
            transaction.feesCurrencySymbol = account.feesCurrencySymbol
            feeRates = account.feeRates
        }

        if (typeof transaction.transactionFee === 'undefined') {
            Log.log('ACT/Transaction preformat bad transactionFee ' + JSON.stringify(transaction.transactionFee))
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else if (!transaction.transactionFee || transaction.transactionFee === 0) {
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else {
            try {
                const tmp = 1 * BlocksoftPrettyNumbers.setCurrencyCode(feeCurrencyCode).makePretty(transaction.transactionFee)
                transaction.transactionFeePretty = parseFloat(tmp.toFixed(5)) === 0 ? parseFloat(tmp.toFixed(10)) : parseFloat(tmp.toFixed(5))
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
                    transaction.basicFeePretty = prettyNumber(transaction.transactionFeePretty, 2)
                } else {
                    transaction.basicFeePretty = prettyNumber(transaction.transactionFeePretty * feeRates.basicCurrencyRate, 2)
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
