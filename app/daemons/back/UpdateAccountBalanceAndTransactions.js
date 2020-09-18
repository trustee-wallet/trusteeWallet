/**
 * @version 0.11
 */
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftTransactions from '../../../crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import accountScanningDS from '../../appstores/DataSource/Account/AccountScanning'
import accountBalanceDS from '../../appstores/DataSource/AccountBalance/AccountBalance'
import accountDS from '../../appstores/DataSource/Account/Account'

import AccountTransactionsRecheck from './apputils/AccountTransactionsRecheck'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import config from '../../config/config'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'

const CACHE_SCANNING = {}
const CACHE_VALID_TIME = 60000 // 1 minute
const CACHE_VALID_10MIN_TIME = 600000 // 10 minutes
const CACHE_CUSTOM_TIME = {
    'BCH': 60000, // 10 minutes
    'BSV': 60000  // 10 minutes
}
let CACHE_LAST_TIME = false


class UpdateAccountBalanceAndTransactions {

    getTime() {
        if (CACHE_LAST_TIME > 0) {
            return new Date(CACHE_LAST_TIME).toLocaleTimeString()
        }
        return '-'
    }

    /**
     * @param {string} callParams.source
     * @param {boolean} callParams.force
     * @param {boolean} callParams.allWallets
     * @param {string} callParams.currencyCode
     * @returns {Promise<boolean>}
     */
    updateAccountBalanceAndTransactions = async (callParams) => {
        Log.daemon('UpdateAccountBalanceAndTransactions called ' + JSON.stringify(callParams))
        const source = callParams.source || 'FRONT'
        const force = callParams.force || false
        const allWallets = callParams.allWallets || false

        if (!force || source === 'BACK') {
            const setting = await settingsActions.getSetting('scannerCode')
            if (!setting) {
                await settingsActions.setSettings('scannerCode', '1min')
            }
            if (setting === 'none') {
                return false
            } else if (CACHE_LAST_TIME && setting === '10min') {
                const now = new Date().getTime()
                const diff = now - CACHE_LAST_TIME
                if (diff < CACHE_VALID_10MIN_TIME) {
                    Log.daemon('UpdateAccountBalanceAndTransactions skipped by diff ' + diff)
                    return false
                }
            }
        }

        let tmpAction = ''
        try {
            const params = {
                force
            }

            if (!allWallets && source !== 'BACK') {
                params.walletHash = await BlocksoftKeysStorage.getSelectedWallet()
            }

            tmpAction = 'params init'
            if (typeof callParams !== 'undefined' && callParams && typeof callParams.currencyCode !== 'undefined') {
                params.currencyCode = callParams.currencyCode
            }


            Log.daemon('UpdateAccountBalanceAndTransactions called ' + source)

            tmpAction = 'accounts init'
            const accounts = await accountScanningDS.getAccountsForScan(params)

            if (!accounts || accounts.length === 0) {
                Log.daemon('UpdateAccountBalanceAndTransactions called - no account')
                return false
            }

            tmpAction = 'accounts log'
            let account
            for (account of accounts) {
                Log.daemon('UpdateAccountBalanceAndTransactions called - todo account ' + account.id + ' ' + account.currencyCode + ' ' + account.address)
            }

            tmpAction = 'accounts run main'
            let running = 0
            for (account of accounts) {
                if (typeof CACHE_CUSTOM_TIME[account.currencyCode] !== 'undefined') {
                    continue
                }
                tmpAction = 'account run ' + JSON.stringify(account)
                await this._accountRun(account, source, CACHE_VALID_TIME, force)
                running++
            }

            tmpAction = 'accounts run custom'
            for (account of accounts) {
                if (typeof CACHE_CUSTOM_TIME[account.currencyCode] !== 'undefined') {
                    // if its the only ones not updated - lets do them faster
                    await this._accountRun(account, source, running > 0 ? CACHE_CUSTOM_TIME[account.currencyCode] : CACHE_VALID_TIME, force)
                }
            }

            CACHE_LAST_TIME = new Date().getTime()
        } catch (e) {
            Log.errDaemon('UpdateAccountBalanceAndTransactions balanceError ' + source + ' ' + e.message + ' ' + tmpAction)
        }
    }

    async _accountRun(account, source, time, force) {
        let newBalance = false
        let addressToScan = account.address

        Log.daemon('UpdateAccountBalanceAndTransactions _accountRun init ' + account.id + ' ' + account.currencyCode + ' ' + account.address)

        if (account.accountJson && typeof (account.accountJson.addressHex) !== 'undefined') {
            addressToScan = account.accountJson.addressHex
            Log.daemon('UpdateAccountBalanceAndTransactions changing address ' + account.currencyCode + ' ' + account.address + ' => ' + addressToScan)
        }
        const now = new Date().getTime()
        if (!force && typeof CACHE_SCANNING[account.currencyCode + ' ' + addressToScan] !== 'undefined') {
            const diff = now - CACHE_SCANNING[account.currencyCode + ' ' + addressToScan]
            if (diff < time) {
                Log.daemon('UpdateAccountBalanceAndTransactions skipped as running ' + account.currencyCode + ' ' + account.address + ' => diff:' + diff + ' time: ' + time)
                return false
            }
        }
        CACHE_SCANNING[account.currencyCode + ' ' + addressToScan] = now

        const updateObj = {
            balanceScanTime: Math.round(new Date().getTime() / 1000)
        }

        let balanceError
        try {
            Log.daemon('UpdateAccountBalanceAndTransactions newBalance ' + account.currencyCode + ' ' + addressToScan)
            newBalance = await (BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(addressToScan).setAdditional(account.accountJson)).getBalance()
            if (!newBalance || typeof newBalance.balance === 'undefined') {
                if (account.balanceScanBlock === 0 && account.balanceScanTime === 0) {
                    updateObj.balanceScanLog = account.address + ' empty response, old balance ' + account.balance + ', ' + JSON.stringify(newBalance)
                    await accountBalanceDS.updateAccountBalance({ updateObj }, account)
                    return false
                }
                balanceError = ' something wrong with balance ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance)
                Log.daemon('UpdateAccountBalanceAndTransactions newBalance something wrong ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance))
            } else {
                balanceError = ' found in one ' + JSON.stringify(newBalance)
            }
        } catch (e) {
            balanceError = ' found balanceError ' + e.message
        }

        Log.daemon('UpdateAccountBalanceAndTransactions newBalance loaded ' + account.currencyCode + ' ' + addressToScan, JSON.stringify(newBalance))
        let continueWithTx = true
        if (newBalance) {
            if (typeof newBalance.balanceScanBlock !== 'undefined' && newBalance.balanceScanBlock * 1 < account.balanceScanBlock * 1) {
                continueWithTx = false
                updateObj.balanceProvider = newBalance.provider
                updateObj.balanceScanLog = account.address + ' block error, ignored new ' + newBalance.balance + ' block ' + newBalance.balanceScanBlock + ', old balance ' + account.balance + ' block ' + account.balanceScanBlock
            } else if (newBalance.balance * 1 !== account.balance * 1 || newBalance.unconfirmed * 1 !== account.unconfirmed * 1) {
                updateObj.balanceFix = newBalance.balance // lets send to db totally not changed big number string
                updateObj.balanceTxt = newBalance.balance // and string for any case
                updateObj.unconfirmedFix = newBalance.unconfirmed || 0 // lets send to db totally not changed big number string
                updateObj.unconfirmedTxt = newBalance.unconfirmed || '' // and string for any case
                updateObj.balanceProvider = newBalance.provider
                if (typeof newBalance.balanceScanBlock !== 'undefined') {
                    updateObj.balanceScanBlock = newBalance.balanceScanBlock
                }
                updateObj.balanceScanLog = account.address + ' all ok, new balance ' + newBalance.balance + ', old balance ' + account.balance + ', ' + balanceError

                const logData = {}
                logData.walletHash = account.walletHash
                logData.currency = account.currencyCode
                logData.address = account.address
                logData.addressShort = account.address ? account.address.slice(0, 10) : 'none'
                logData.balanceScanTime = account.balanceScanTime + ''
                logData.balanceProvider = account.balanceProvider + ''
                logData.balance = account.balance + ''
                logData.newBalanceProvider = account.newBalanceProvider + ''
                logData.newBalance = account.newBalance + ''
                MarketingEvent.setBalance(logData.walletHash, logData.currency, logData.newBalance, logData)
            } else {
                updateObj.balanceScanLog = account.address + ' not changed, old balance ' + account.balance + ', ' + balanceError
                if (typeof newBalance.provider !== 'undefined') {
                    updateObj.balanceProvider = newBalance.provider
                }
            }
            Log.daemon('UpdateAccountBalanceAndTransactions newBalance ok Prepared ' + account.currencyCode + ' ' + account.address + ' new balance ' + newBalance.balance + ' provider ' + newBalance.provider + ' old balance ' + account.balance, JSON.stringify(updateObj))
        } else {
            updateObj.balanceScanLog = account.address + ' no balance, old balance ' + account.balance + ', ' + balanceError
            Log.daemon('UpdateAccountBalanceAndTransactions newBalance not Prepared ' + account.currencyCode + ' ' + account.address + ' old balance ' + account.balance, JSON.stringify(updateObj))
        }

        await appNewsDS.saveAppNews({
            onlyOne: true, walletHash: account.walletHash, currencyCode: account.currencyCode, newsGroup: 'ONE_BY_ONE_SCANNER', newsName: 'TXS_SCANNED_LAST_TIME',
            newsJson: { log: updateObj.balanceScanLog.substr(0, 50) + '...' }
        })

        if (account.balanceScanLog) {
            updateObj.balanceScanLog += ' ' + account.balanceScanLog
        }

        try {
            updateObj.balanceScanLog = new Date().toISOString() + ' ' + updateObj.balanceScanLog.substr(0, 1000)
            await accountBalanceDS.updateAccountBalance({ updateObj }, account)
        } catch (e) {
            e.message += ' while accountBalanceDS.updateAccountBalance'
            throw e
        }

        if (!continueWithTx) {
            return true // balance error - tx will not be good also
        }

        let transactionsError = ' '
        let newTransactions = false
        try {
            Log.daemon('UpdateAccountBalanceAndTransactions newTransactions ' + account.currencyCode + ' ' + account.address)
            if (account.currencyCode === 'BTC') {
                const addresses = await accountScanningDS.getAddresses({
                    currencyCode: account.currencyCode,
                    walletHash: account.walletHash
                })
                newTransactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address).setAdditional({ addresses })).getTransactions()
            } else {
                newTransactions = await (BlocksoftTransactions.setCurrencyCode(account.currencyCode).setAddress(account.address).setAdditional(account.accountJson)).getTransactions()
            }
            if (!newTransactions || newTransactions.length === 0) {
                transactionsError = ' empty transactions ' + account.currencyCode + ' ' + account.address
            } else {
                transactionsError = ' found transactions ' + newTransactions.length
            }
        } catch (e) {
            if (config.debug.appErrors) {
                Log.errDaemon('UpdateAccountBalanceAndTransactions newTransactions something wrong ' + account.currencyCode + ' ' + account.address + ' => transactionsError ' + e.message)
            }
            transactionsError = ' found transactionsError ' + e.message
        }

        Log.daemon('UpdateAccountBalanceAndTransactions newTransactions loaded ' + account.currencyCode + ' ' + addressToScan)

        let transactionUpdateObj
        try {
            transactionUpdateObj = await AccountTransactionsRecheck(newTransactions, account, source)
        } catch (e) {
            e.message += ' while AccountTransactionsRecheck'
            throw e
        }
        // Log.daemon('res', transactionUpdateObj)
        try {
            transactionUpdateObj.transactionsScanLog = new Date().toISOString() + ' ' + transactionsError + ', ' + transactionUpdateObj.transactionsScanLog
            if (account.transactionsScanLog) {
                transactionUpdateObj.transactionsScanLog += ' ' + account.transactionsScanLog
            }
            await accountDS.updateAccount({ updateObj: transactionUpdateObj }, account)
        } catch (e) {
            e.message += ' while accountDS.updateAccount'
            throw e
        }

        Log.daemon('UpdateAccountBalanceAndTransactions _accountRun finish ' + account.id + ' ' + account.currencyCode + ' ' + account.address)
    }

}


const singleton = new UpdateAccountBalanceAndTransactions()
export default singleton
