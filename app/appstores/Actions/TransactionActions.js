import store from '../../store'

import transactionDS from '../DataSource/Transaction/Transaction'

import Log from '../../services/Log/Log'

const {dispatch} = store

const transactionActions = {

    /**
     * @param {object} transaction
     * @param {string} transaction.currency_code
     * @param {string} transaction.wallet_hash
     * @param {string} transaction.account_id
     * @param {string} transaction.transaction_hash
     * @param {string} transaction.transaction_status
     * @param {string} transaction.address_to
     * @param {string} transaction.address_from
     * @param {string} transaction.address_amount
     * @param {string} transaction.transaction_fee
     * @param {integer} transaction.transaction_of_trustee_wallet
     * @param {string} transaction.created_at: new Date().toISOString(),
     * @param {string} transaction.updated_at: new Date().toISOString()
     */
    saveTransaction: async (transaction) => {

        try {

            await transactionDS.saveTransaction(transaction)

            const account = store.getState().mainStore.selectedAccount

            if (transaction.account_id === account.account_id) {

                const prepared = {...account}
                prepared.transactions.unshift(transaction)

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
     * @param accountId
     * @return {Promise<Array>}
     */
    getTransactions: async (accountId) => {

        let transactions = []

        try {

            const {array} = await transactionDS.getTransactions({account_id: accountId})

            transactions = array

        } catch (e) {

            Log.err('ACT/Transaction getTransactions ' + e.message)
        }

        return transactions
    }


}

export default transactionActions
