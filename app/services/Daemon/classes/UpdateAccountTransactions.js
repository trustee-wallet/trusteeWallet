import BlocksoftTransactions from '../../../../crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

import accountDS from '../../../appstores/DataSource/Account/Account'

import Update from './Update'
import Log from '../../Log/Log'
import Transaction from '../../../appstores/DataSource/Transaction/Transaction'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'


class UpdateAccountTransactions extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountTransactions
        this._tickCount = 0
    }


    /**
     * @namespace Flow.updateAccountTransactions
     * @return {Promise<boolean>}
     */
    updateAccountTransactions = async () => {

        this._tickCount++
        const params = { derivation_type: 'main' }
        if (this._tickCount > 5) {
            params.derivation_type = false
            this._tickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountTransactions called')

        const { array: accounts } = await accountDS.getAccountsForScanTransactions(params)


        if (!accounts || !accounts.length) return true

        let changedAccounts = []

        for (let account of accounts) {
            try {

                let transactions = false
                let transactionsIsOk = false
                let dbTransactions = {}
                try {
                    transactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address)).getTransactions()
                } catch (e) {
                    let errMsg = 'DMN/UpdateAccountTransactions error 1 ' + account.currencyCode + ' ' + account.address + ' ' + e.message
                    if (typeof e.code !== 'undefined' && e.code === 'ERROR_SILENT') {
                        Log.daemon(errMsg)
                    } else {
                        // actually we need to update scan time even for error addresses thats why
                        Log.errDaemon(errMsg)
                    }
                }
                try {
                    let tmps = false
                    if (transactions) {
                        transactionsIsOk = true
                        tmps = await Transaction.getTransactions({ currency_code: account.currencyCode, wallet_hash: params.wallet_hash, no_order: true })
                    }

                    if (tmps && typeof (tmps.array) !== 'undefined' && tmps.array && tmps.array.length > 0) {
                        for (let tmp of tmps.array) {
                            dbTransactions[tmp.transaction_hash] = tmp
                        }
                    }
                } catch (e) {
                    let errMsg = 'DMN/UpdateAccountTransactions error 2 ' + account.currencyCode + ' ' + account.address + ' ' + e.message
                    if (typeof e.code !== 'undefined' && e.code === 'ERROR_SILENT') {
                        Log.daemon(errMsg)
                    } else {
                        // actually we need to update scan time even for error addresses thats why
                        Log.errDaemon(errMsg)
                    }
                }

                const prepare = {
                    key: {
                        id: account.id
                    },
                    updateObj: {
                        transactionsScanTime: Math.round(new Date().getTime() / 1000)
                    }
                }


                if (transactionsIsOk && transactions && transactions[0]) {
                    let isChanged = false
                    let msg = ''
                    for (let transaction of transactions) {
                        try {
                            let old = dbTransactions[transaction.transaction_hash]

                            if (old) {
                                if (old.transaction_status === transaction.transaction_status &&
                                    old.block_confirmations > 30 && transaction.block_confirmations > 30
                                ) {
                                    msg += '\n\t' + ` HASH ${transaction.transaction_hash} STATUS ${old.transaction_status} BLOCKS ${old.block_confirmations} `
                                    continue
                                }
                                await Transaction.saveTransaction(transaction, old.id)
                            } else {
                                transaction.currency_code = account.currencyCode
                                transaction.wallet_hash = account.walletHash
                                transaction.account_id = account.id
                                transaction.created_at = transaction.block_time // to make created tx more accurate
                                await Transaction.saveTransaction(transaction)
                            }
                            isChanged = true
                        } catch (e) {
                            e.message = ' TX ' + transaction.transaction_hash + ' ' + e.message
                            e.code = 'ERROR_SYSTEM'
                            throw e
                        }
                    }
                    if (isChanged) {
                        changedAccounts.push(account)
                    }
                    if (msg) {
                        Log.daemon('DMN/UpdateAccountTransactions skipped tx', msg)
                    }
                }

                await accountDS.updateAccount(prepare)

                Log.daemon('DMN/UpdateAccountTransactions finished', JSON.stringify(prepare))

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountTransactions error', e)

            }
        }


        if (changedAccounts && changedAccounts.length) {

            try {

                Log.daemon('DMN/UpdateAccountTransactions updateEventHandler will be called')

                await this.updateEventHandler(changedAccounts)

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountTransactions updateEventHandler error ' + e.message)
            }
        } else {

            Log.daemon('DMN/UpdateAccountTransactions updateEventHandler will not be called')

        }

    }
}

export default new UpdateAccountTransactions
