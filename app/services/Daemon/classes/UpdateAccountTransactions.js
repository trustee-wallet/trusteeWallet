import BlocksoftTransactions from '../../../../crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

import accountDS from '../../../appstores/DataSource/Account/Account'

import Update from './Update'
import Log from '../../Log/Log'
import Transaction from '../../../appstores/DataSource/Transaction/Transaction'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import updateAccountBalanceDaemon from '../../../services/Daemon/classes/UpdateAccountBalance'

class UpdateAccountTransactions extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountTransactions
        this.nowUpdating = {}
        this._tickCount = 0
        this.tryCounter = []
    }


    /**
     * @namespace Flow.updateAccountTransactions
     * @return {Promise<boolean>}
     */
    updateAccountTransactions = async () => {
        this._tickCount++
        const params = { derivation_type: 'main', not_currency_code : 'BTC'  }
        if (this._tickCount > 5) {
            params.derivation_type = false
            params.not_currency_code = false
            this._tickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountTransactions called', JSON.stringify(params))

        const { array: accounts } = await accountDS.getAccountsForScanTransactions(params)

        await this._updateAccountTransactions(accounts, 'BASIC')
    }

    _updateAccountTransactions = async (accounts, source = 'BASIC') => {
        if (!accounts || !accounts.length) return true

        let changedAccounts = []
        let addressesToUpdate = {}

        for (let account of accounts) {

            Log.daemon('DMN/UpdateAccountTransactions called ' + source + ' account ' + account.currencyCode + ' ' + account.address + ' wallet ' + account.walletHash)
            if (
                typeof (this.nowUpdating[account.currencyCode + '_' + account.address]) !== 'undefined'
                && this.nowUpdating[account.currencyCode + '_' + account.address] > 0
            ) {
                Log.daemon('DMN/UpdateAccountTransactions will be skipped as already scanning')
                continue
            }
            this.nowUpdating[account.currencyCode + '_' + account.address] = 1
            try {
                let transactions = false
                let transactionsIsOk = false
                let dbTransactions = {}

                if (typeof (this.tryCounter[account.currencyCode]) === 'undefined') {
                    this.tryCounter[account.currencyCode] = 0
                }

                try {
                    transactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address).setAdditional(account.accountJson)).getTransactions()
                    this.tryCounter[account.currencyCode] = 0
                } catch (e) {
                    let errMsg = account.currencyCode + ' ' + account.address + ' ' + e.message
                    if (Log.isNetworkError(e.message) !== -1 && this.tryCounter[account.currencyCode] < 10) {
                        this.tryCounter[account.currencyCode]++
                        Log.daemon('DMN/UpdateAccountTransactions network try ' + this.tryCounter[account.currencyCode] + ' ' + e.message)
                    } else if (typeof e.code !== 'undefined' && e.code === 'ERROR_SILENT') {
                        Log.daemon('DMN/UpdateAccountTransactions error 1.1 ' + errMsg)
                    } else {
                        // actually we need to update scan time even for error addresses thats why
                        Log.errDaemon('DMN/UpdateAccountTransactions error 1.2 ' + errMsg)
                    }

                }
                try {
                    let tmps = false
                    if (transactions) {
                        transactionsIsOk = true
                        tmps = await Transaction.getTransactions({
                            currency_code: account.currencyCode,
                            wallet_hash: account.walletHash,
                            no_order: true
                        })
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

                let msg1 = '', msg2 = '', msg3 = ''

                if (transactionsIsOk && transactions && transactions[0]) {
                    let isChanged = false

                    for (let transaction of transactions) {
                        try {
                            let old = dbTransactions[transaction.transaction_hash]
                            let doUpdateBalances = true
                            if (old) {
                                let old_amount = old.address_amount.toString()
                                let new_amount =  transaction.address_amount.toString()
                                if (old_amount.length > 10) {
                                    old_amount = old_amount.substring(0, 10)
                                }
                                if (old_amount === '000000000') {
                                    old_amount = 0
                                }
                                if (new_amount.length > 10) {
                                    new_amount = new_amount.substring(0, 10)
                                }
                                if (new_amount === '000000000') {
                                    new_amount = 0
                                }

                                let old_address_to = old.address_to
                                let new_address_to = transaction.address_to
                                if (typeof old_address_to === 'undefined' || !old_address_to) {
                                    old_address_to = ''
                                }
                                if (typeof new_address_to === 'undefined' || !new_address_to ) {
                                    new_address_to = ''
                                }
                                if (old.transaction_status !== transaction.transaction_status) {
                                    msg1 += '\n\t' + ` UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by STATUS NEW ${transaction.transaction_status} OLD ${old.transaction_status}`
                                } else if (old_amount != new_amount) {
                                    msg1 += '\n\t' + ` UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by AMOUNT NEW ${new_amount} OLD ${old_amount}`
                                } else if (old_address_to != old_address_to) {
                                    msg1 += '\n\t' + ` UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by ADDRESS_TO NEW ${new_address_to} OLD ${old_address_to}`
                                } else if (old.address_from !== transaction.address_from) {
                                    msg1 += '\n\t' + ` UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by ADDRESS_FROM NEW ${transaction.address_from} OLD ${old.address_from}`
                                } else if (old.block_confirmations === transaction.block_confirmations || (old.block_confirmations > 30 && transaction.block_confirmations > 30)) {
                                    msg3 += '\n\t' + ` SKIP ${account.currencyCode} HASH ${transaction.transaction_hash} CONF ${transaction.block_confirmations} OLD CONF ${old.block_confirmations} STATUS ${old.transaction_status}`
                                    continue
                                } else {
                                    doUpdateBalances = false
                                    msg1 += '\n\t' + ` UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by CONF NEW ${transaction.block_confirmations} OLD ${old.block_confirmations} STATUS ${transaction.transaction_status}`
                                }
                                await Transaction.saveTransaction(transaction, old.id)
                            } else {
                                msg2 += '\n\t' + ` INSERT ${account.currencyCode} HASH ${transaction.transaction_hash} CONF ${transaction.block_confirmations} AMOUNT ${transaction.address_amount}`
                                transaction.currency_code = account.currencyCode
                                transaction.wallet_hash = account.walletHash
                                transaction.account_id = account.id
                                transaction.created_at = transaction.block_time // to make created tx more accurate
                                await Transaction.saveTransaction(transaction)
                            }

                            if (doUpdateBalances) {
                                addressesToUpdate[account.address] = account
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
                    if (msg1) {
                        Log.daemon('DMN/UpdateAccountTransactions updated tx', msg1)
                    }
                    if (msg2) {
                        Log.daemon('DMN/UpdateAccountTransactions inserted tx', msg2)
                    }
                    if (msg3) {
                        Log.daemon('DMN/UpdateAccountTransactions skipped tx', msg3)
                    }
                }

                await accountDS.updateAccount(prepare)

                this.nowUpdating[account.currencyCode + '_' + account.address] = 0

                Log.daemon('DMN/UpdateAccountTransactions finished', JSON.stringify(prepare))

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountTransactions error 3 ' + e.message)

            }
        }


        if (changedAccounts && changedAccounts.length) {

            try {

                Log.daemon('DMN/UpdateAccountTransactions updateEventHandler will be called')

                await this.updateEventHandler(changedAccounts)

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountTransactions updateEventHandler error ' + e.message)
            }

            if (addressesToUpdate && source === 'BASIC') {
                await updateAccountBalanceDaemon._updateAccountBalance(Object.values(addressesToUpdate), 'TRANSACTIONS')
            }

        } else {

            Log.daemon('DMN/UpdateAccountTransactions updateEventHandler will not be called')

        }

    }
}

let singleton = new UpdateAccountTransactions
export default singleton
