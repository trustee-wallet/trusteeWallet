import Update from './Update'

import accountDS from '../../../appstores/DataSource/Account/Account'
import walletDS from '../../../appstores/DataSource/Wallet/Wallet'
import walletPubDS from '../../../appstores/DataSource/WalletPub/WalletPub'

import BlocksoftTransactions from '../../../../crypto/actions/BlocksoftTransactions/BlocksoftTransactions'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import Log from '../../Log/Log'
import Transaction from '../../../appstores/DataSource/Transaction/Transaction'


import updateAccountBalanceDaemon from '../../../services/Daemon/classes/UpdateAccountBalance'

const CACHE_NOW_UPDATING = {}
const CACHE_BTC_ADDRESSES = {}

class UpdateAccountTransactions extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountTransactions
        this.TickCount = 0
        this.tryCounter = []
    }


    /**
     * @namespace Flow.updateAccountTransactions
     * @return {Promise<boolean>}
     */
    updateAccountTransactions = async () => {
        this.TickCount++
        const params = { derivationType: 'main', not_currency_code: 'BTC' }
        if (this.TickCount === 1) {
            params.not_currency_code = false
        } else if (this.TickCount > 5) {
            params.derivationType = false
            params.not_currency_code = false
            this.TickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountTransactions called', JSON.stringify(params))

        let accounts = await accountDS.getAccountsForScanTransactions(params)
        if (!accounts && params.not_currency_code) {
            params.not_currency_code = false
            accounts = await accountDS.getAccountsForScanTransactions(params)
        }

        let isBTC = false
        if (accounts && params.not_currency_code !== 'BTC') {
            let account
            for (account of accounts) {
                if (account.currencyCode === 'BTC') {
                    isBTC = true
                    break
                }
            }
        } else if (!accounts) {
            isBTC = true
        }
        if (isBTC) {
            const wallet = await walletDS.getWalletByHash(params.wallet_hash)
            if (wallet.wallet_is_hd) {
                Log.daemon('DMN/UpdateAccountTransactions called BTC HD', JSON.stringify(params))
                await this._updateAccountTransactionsPub(params.wallet_hash, 'BTC', 'BASIC')
                return false
            }
        }
        await this._updateAccountTransactions(accounts, 'BASIC')
    }

    _updateAccountTransactionsPub = async (walletHash, currencyCode, source = 'BASIC') => {
        const xpubs = await walletPubDS.getWalletPubs({ walletHash, currencyCode })
        Log.daemon('DMN/UpdateAccountTransactions called BTC XPUBS ' + JSON.stringify(xpubs))
        if (typeof xpubs['btc.44'] === 'undefined' || typeof xpubs['btc.84'] === 'undefined') {
            await updateAccountBalanceDaemon._updateAccountBalancePub({ walletHash, currencyCode, source: 'TRANSACTIONS' })
            return false // will be updated in balance
        }

        const keys = [{
            key: 'btc.44'
        }, {
            key: 'btc.84'
        }]

        let key
        for (key of keys) {
            const xpub = xpubs[key.key]
            const addresses = await this._btcAdditionalAddresses({ currency_code: currencyCode, wallet_hash: walletHash })
            if (!addresses) {
                continue // will be updated in balance
            }
            Log.daemon('DMN/UpdateAccountTransactions additional addresses Pub', addresses)
            const transactions = await (BlocksoftTransactions.setCurrencyCode('BTC').setAddress(xpub.walletPubValue).setAdditional({addresses})).getTransactions()

            const tmp = await this._updateAccountTransactionsPrepOne({ walletHash, currencyCode, id: 0 }, transactions)


            if (tmp) {
                const updateAddresses = []
                let address
                for (address in addresses) {
                    if (addresses[address] === 1) continue
                    if (typeof tmp.vouts[address] === 'undefined') continue
                    updateAddresses.push(`'${address}'`)
                }

                if (updateAddresses.length > 0) {
                    console.log('DEBUG!!! updateAddresses => already_shown', updateAddresses)
                    await accountDS.massUpdateAccount(updateAddresses, 'address', `already_shown=1`)
                    tmp.isChanged = 1
                }

                if (tmp.isChanged) {
                    await this.updateEventHandler([{ walletHash, currencyCode, id: 0 }])
                }
                if (tmp.doUpdateBalances && source === 'BASIC') {
                    await updateAccountBalanceDaemon._updateAccountBalancePub({ walletHash, xpubKey: key.key, currencyCode, source: 'TRANSACTIONS' })
                }
            }
        }
    }

    _btcAdditionalAddresses = async (params) => {
        const tmps = await accountDS.getAccountsForScanPub(params)
        if (!tmps) {
            return false
        }
        const addresses = {}
        let tmp
        for (tmp of tmps) {
            addresses[tmp.address] = tmp.alreadyShown
        }
        return addresses
    }

    _updateAccountTransactions = async (accounts, source = 'BASIC') => {

        if (!accounts || !accounts.length) return true

        const changedAccounts = []
        const addressesToUpdate = {}

        let account
        for (account of accounts) {

            Log.daemon('DMN/UpdateAccountTransactions called ' + source + ' account ' + account.currencyCode + ' ' + account.address + ' wallet ' + account.walletHash)
            if (
                typeof (CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address]) !== 'undefined'
                && CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] > 0
            ) {
                Log.daemon('DMN/UpdateAccountTransactions will be skipped as already scanning')
                continue
            }
            CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] = 1
            try {

                let transactions = false

                if (typeof (this.tryCounter[account.currencyCode]) === 'undefined') {
                    this.tryCounter[account.currencyCode] = 0
                }

                const prepare = {
                    key: {
                        id: account.id
                    },
                    updateObj: {
                        transactionsScanTime: Math.round(new Date().getTime() / 1000)
                    }
                }

                try {
                    if (account.currencyCode === 'BTC') {
                        let addresses
                        if (typeof CACHE_BTC_ADDRESSES[account.walletHash] !== 'undefined') {
                            addresses = CACHE_BTC_ADDRESSES[account.walletHash]
                        } else {
                            addresses = await this._btcAdditionalAddresses({ currency_code: account.currencyCode, wallet_hash: account.walletHash })
                            CACHE_BTC_ADDRESSES[account.walletHash] = addresses
                        }
                        Log.daemon('DMN/UpdateAccountTransactions additional addresses usual', addresses)
                        transactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address).setAdditional({ addresses })).getTransactions()
                    } else {
                        transactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address).setAdditional(account.accountJson)).getTransactions()
                    }
                    this.tryCounter[account.currencyCode] = 0
                    prepare.updateObj.transactionsScanLog = 'scanned ok'
                } catch (e) {
                    const errMsg = account.currencyCode + ' ' + account.address + ' ' + e.message
                    if (Log.isNetworkError(e.message) && this.tryCounter[account.currencyCode] < 10) {
                        this.tryCounter[account.currencyCode]++
                        Log.daemon('DMN/UpdateAccountTransactions network try ' + this.tryCounter[account.currencyCode] + ' ' + e.message + ' ' + errMsg)
                        prepare.updateObj.transactionsScanLog = 'scanned network error ' + errMsg
                    } else if (typeof e.code !== 'undefined' && e.code === 'ERROR_SILENT') {
                        Log.daemon('DMN/UpdateAccountTransactions error 1.1 ' + errMsg)
                        prepare.updateObj.transactionsScanLog = 'scanned silent error ' + errMsg
                    } else {
                        // actually we need to update scan time even for error addresses thats why
                        Log.errDaemon('DMN/UpdateAccountTransactions error 1.2 ' + errMsg)
                        prepare.updateObj.transactionsScanLog = 'scanned error ' + errMsg
                    }
                }

                const tmp = await this._updateAccountTransactionsPrepOne(account, transactions)

                if (tmp) {
                    prepare.updateObj.transactionsScanLog = 'transactions are changed ' + prepare.updateObj.transactionsScanLog
                    Log.daemon('DMN/UpdateAccountTransactions finished', JSON.stringify(prepare))

                    if (tmp.isChanged) {
                        changedAccounts.push(account)
                    }

                    if (tmp.doUpdateBalances) {
                        addressesToUpdate[account.address] = account
                    }
                }

                await accountDS.updateAccount(prepare)

                CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] = 0

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

    _updateAccountTransactionsPrepOne = async (account, transactions) => {
        if (!transactions || !transactions[0]) {
            return false
        }
        const dbTransactions = {}
        try {
            const tmps = await Transaction.getTransactions({
                currency_code: account.currencyCode,
                wallet_hash: account.walletHash,
                no_order: true
            })
            if (tmps && tmps.length > 0) {
                let tmp
                for (tmp of tmps) {
                    dbTransactions[tmp.transaction_hash] = tmp
                }
            }
        } catch (e) {
            const errMsg = 'DMN/UpdateAccountTransactions error 2 ' + account.currencyCode + ' ' + account.address + ' ' + e.message
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_SILENT') {
                Log.daemon(errMsg)
            } else {
                // actually we need to update scan time even for error addresses thats why
                Log.errDaemon(errMsg)
            }
        }

        let msg1 = ''
        let msg2 = ''
        let msg3 = ''


        let isChanged = false
        let doUpdateBalances = false
        let transaction
        const vouts = {}
        for (transaction of transactions) {
            if (transaction.vout && transaction.vout.length > 0) {
                let vout
                for (vout of transaction.vout) {
                    vouts[vout] = 1
                }
            }
            try {
                const old = dbTransactions[transaction.transaction_hash]
                let tmpMsg = ''

                let newAddressTo = transaction.address_to
                if (typeof newAddressTo === 'undefined' || newAddressTo === '') {
                    newAddressTo = false
                }

                let newAmount = transaction.address_amount.toString()
                if (newAmount.length > 10) {
                    newAmount = newAmount.substring(0, 10)
                }
                if (newAmount === '000000000') {
                    newAmount = 0
                }

                if (old) {
                    let oldAmount = old.address_amount.toString()
                    if (oldAmount.length > 10) {
                        oldAmount = oldAmount.substring(0, 10)
                    }
                    if (oldAmount === '000000000') {
                        oldAmount = 0
                    }


                    let oldAddressTo = old.address_to
                    if (typeof oldAddressTo === 'undefined' || !oldAddressTo) {
                        oldAddressTo = ''
                    }

                    if (old.transaction_of_trustee_wallet > 0) {
                        let transactionPart = {
                            transaction_status : transaction.transaction_status,
                            block_confirmations : transaction.block_confirmations
                        }
                        if (old.transaction_status !== transaction.transaction_status || !old.created_at) {
                            doUpdateBalances = true
                            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by STATUS NEW ${transaction.transaction_status} OLD ${old.transaction_status} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        } else if (old.block_confirmations === transaction.block_confirmations || (old.block_confirmations > 50 && transaction.block_confirmations > 50)) {
                            msg3 += '\n\t' + ` TWALLET SKIP ${account.currencyCode} HASH ${transaction.transaction_hash} CONF ${transaction.block_confirmations} OLD CONF ${old.block_confirmations} STATUS ${old.transaction_status}`
                            transactionPart = false
                            tmpMsg = 'SKIP'
                            continue
                        } else {
                            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by CONF NEW ${transaction.block_confirmations} OLD ${old.block_confirmations} STATUS ${transaction.transaction_status} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        }
                        if (!old.created_at) {
                            transactionPart.created_at = transaction.block_time
                        }
                        transactionPart.transactions_scan_time = Math.round(new Date().getTime() / 1000)
                        transactionPart.transactions_scan_log = tmpMsg
                        await Transaction.saveTransaction(transactionPart, old.id)
                        Log.daemon('DMN/UpdateAccountTransactions old 1', tmpMsg, transactionPart)
                    } else if (account.currencyCode === 'BTC' && !newAddressTo) {
                        msg3 += '\n\t' + ` SKIP ${account.currencyCode} HASH ${transaction.transaction_hash} by NO TO ${JSON.stringify(transaction)} OLD ${oldAddressTo}`
                        tmpMsg = 'SKIP'
                        Log.daemon('DMN/UpdateAccountTransactions skipped 1', transaction)
                        continue
                    } else {
                        if (old.transaction_status !== transaction.transaction_status || !old.created_at) {
                            doUpdateBalances = true
                            tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by STATUS NEW ${transaction.transaction_status} OLD ${old.transaction_status} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        } else if (oldAmount !== newAmount) {
                            doUpdateBalances = true
                            tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by AMOUNT NEW ${newAmount} OLD ${oldAmount} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        } else if (oldAddressTo !== newAddressTo) {
                            doUpdateBalances = true
                            tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by ADDRESS_TO ${newAddressTo} OLD ${oldAddressTo} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        } else if (old.address_from !== transaction.address_from) {
                            doUpdateBalances = true
                            tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by ADDRESS_FROM ${transaction.address_from} OLD ${old.address_from} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        } else if (old.block_confirmations === transaction.block_confirmations || (old.block_confirmations > 50 && transaction.block_confirmations > 50)) {
                            msg3 += '\n\t' + ` SKIP ${account.currencyCode} HASH ${transaction.transaction_hash} CONF ${transaction.block_confirmations} OLD CONF ${old.block_confirmations} STATUS ${old.transaction_status}`
                            tmpMsg = 'SKIP'
                            continue
                        } else {
                            tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transaction_hash} by CONF NEW ${transaction.block_confirmations} OLD ${old.block_confirmations} STATUS ${transaction.transaction_status} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                            msg1 += '\n\t' + tmpMsg
                        }

                        if (!old.created_at) {
                            transaction.created_at = transaction.block_time
                        }
                        transaction.transactions_scan_time = Math.round(new Date().getTime() / 1000)
                        transaction.transactions_scan_log = tmpMsg
                        await Transaction.saveTransaction(transaction, old.id)
                        Log.daemon('DMN/UpdateAccountTransactions old 2', tmpMsg, transaction)
                    }

                } else if (account.currencyCode === 'BTC' && !newAddressTo && newAmount === 0) {
                    msg3 += '\n\t' + ` SKIP INSERT ${account.currencyCode} HASH ${transaction.transaction_hash} by NO TO ${JSON.stringify(transaction)}`
                    tmpMsg = 'SKIP'
                    Log.daemon('DMN/UpdateAccountTransactions skipped 2', transaction)
                    continue
                } else {
                    tmpMsg = ` INSERT ${account.currencyCode} HASH ${transaction.transaction_hash} CONF ${transaction.block_confirmations} AMOUNT ${transaction.address_amount} FROM ${transaction.address_from} TO ${transaction.address_to}`
                    msg2 += '\n\t' + tmpMsg
                    transaction.currency_code = account.currencyCode
                    transaction.wallet_hash = account.walletHash
                    transaction.account_id = account.id
                    transaction.created_at = transaction.block_time // to make created tx more accurate
                    transaction.transactions_scan_time = Math.round(new Date().getTime() / 1000)
                    transaction.transactions_scan_log = tmpMsg
                    await Transaction.saveTransaction(transaction)
                    Log.daemon('DMN/UpdateAccountTransactions new', tmpMsg, transaction)
                }

                isChanged = true
            } catch (e) {
                e.message = ' TX ' + transaction.transaction_hash + ' ' + e.message
                e.code = 'ERROR_SYSTEM'
                throw e
            }
        }

        /*
        if (msg1) {
            Log.daemon('DMN/UpdateAccountTransactions updated tx ' + msg1)
        }
        if (msg2) {
            Log.daemon('DMN/UpdateAccountTransactions inserted tx ' + msg2)
        }
        if (msg3) {
            Log.daemon('DMN/UpdateAccountTransactions skipped tx ' + msg3)
        }
        */
        return { isChanged, doUpdateBalances, vouts }
    }
}

const singleton = new UpdateAccountTransactions
export default singleton
