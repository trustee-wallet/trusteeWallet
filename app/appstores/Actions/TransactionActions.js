import store from '../../store'

import transactionDS from '../DataSource/Transaction/Transaction'

import Log from '../../services/Log/Log'

const { dispatch } = store

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
     * @param {string} transaction.created_at: new Date().toISOString(),
     * @param {string} transaction.updated_at: new Date().toISOString()
     */
    saveTransaction: async (transaction) => {

        try {

           await transactionDS.saveTransaction(transaction)

        } catch (e) {

            Log.err('ACT/Transaction saveTransaction', e)
        }

    },


    /**
     * @param accountId
     * @return {Promise<Array>}
     */
    getTransactions: async (accountId) => {

        let transactions = []

        try {

            const { array } = await transactionDS.getTransactions({account_id : accountId})

            transactions = array

        } catch (e) {

            Log.err('ACT/Transaction getTransactions', e)
        }

        return transactions
    }


}

export default transactionActions
