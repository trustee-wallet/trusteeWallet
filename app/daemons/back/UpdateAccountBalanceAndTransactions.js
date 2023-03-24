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
import { getFioObtData, resolveCryptoCodes } from '../../../crypto/blockchains/fio/FioUtils'
import DaemonCache from '../DaemonCache'
import store from '@app/store'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

const CACHE_SCANNING = {}
const CACHE_VALID_TIME = 60000 // 1 minute
const CACHE_VALID_10MIN_TIME = 600000 // 10 minutes
const CACHE_CUSTOM_TIME = {
    'BCH': 60000, // 10 minutes
    'BSV': 60000  // 10 minutes
}
let CACHE_LAST_TIME = false
let CACHE_ONE_ACCOUNTS = {}

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
     * @param {boolean} callParams.onlyBalances
     * @param {string} callParams.currencyCode
     * @returns {Promise<boolean>}
     */
    updateAccountBalanceAndTransactions = async (callParams) => {
        const source = callParams.source || 'FRONT'
        const force = callParams.force || false
        const allWallets = callParams.allWallets || false
        const onlyBalances = callParams.onlyBalances || false
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
                params.walletHash = await settingsActions.getSelectedWallet('UpdateAccountBalanceAndTransactions')
            }

            tmpAction = 'params init'
            if (typeof callParams !== 'undefined' && callParams && typeof callParams.currencyCode !== 'undefined') {

                if (force) {
                    if (callParams.currencyCode.indexOf('TRX') === 0) {
                        params.currencyFamily = 'TRX'
                    } else if (callParams.currencyCode.indexOf('ETH') === 0) {
                        params.currencyFamily = 'ETH'
                    } else {
                        params.currencyCode = callParams.currencyCode
                    }
                } else {
                    params.currencyCode = callParams.currencyCode
                }
            }


            Log.daemon('UpdateAccountBalanceAndTransactions called ' + source)

            tmpAction = 'accounts init'

            let accounts = await accountScanningDS.getAccountsForScan({ ...params, force: false })

            if (force) {
                if (!accounts || accounts.length === 0) {
                    accounts = await accountScanningDS.getAccountsForScan(params)
                }
            }

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
            CACHE_ONE_ACCOUNTS = {}
            let shouldUpdateBalance = false
            for (account of accounts) {
                if (typeof CACHE_CUSTOM_TIME[account.currencyCode] !== 'undefined') {
                    continue
                }
                if (typeof CACHE_ONE_ACCOUNTS[account.currencyCode + '_' + account.address] !== 'undefined') {
                    continue
                }
                tmpAction = 'account run ' + JSON.stringify(account)
                if (await this._accountRun(account, accounts, source, CACHE_VALID_TIME, force, onlyBalances)) {
                    shouldUpdateBalance = true
                }
                running++
            }

            tmpAction = 'accounts run custom'

            for (account of accounts) {
                if (typeof CACHE_ONE_ACCOUNTS[account.currencyCode + '_' + account.address] !== 'undefined') {
                    continue
                }
                if (typeof CACHE_CUSTOM_TIME[account.currencyCode] !== 'undefined') {
                    // if its the only ones not updated - lets do them faster
                    if (await this._accountRun(account, accounts, source, running > 0 ? CACHE_CUSTOM_TIME[account.currencyCode] : CACHE_VALID_TIME, force, onlyBalances)) {
                        shouldUpdateBalance = true
                    }
                }
            }

            CACHE_LAST_TIME = new Date().getTime()
            if (shouldUpdateBalance) {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, source: 'SHOULD_UPDATE_BALANCE' })
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountBalanceAndTransactions balance error ' + source + ' ' + e.message, e)
            }
            Log.errDaemon('UpdateAccountBalanceAndTransactions balance error ' + source + ' ' + e.message + ' ' + tmpAction)
            return false
        }
        return true
    }

    loadFioData = async (currencyCode) => {
        const currencies = store.getState().currencyStore.cryptoCurrencies
        let foundFio = false
        for (const tmp of currencies) {
            if (tmp.currencyCode === 'FIO' && !tmp.maskedHidden) {
                foundFio = true
                break
            }
        }
        if (!foundFio) return false
        Log.daemon('UpdateAccountBalanceAndTransactions loadFioData ' + currencyCode)
        try {
            // eslint-disable-next-line camelcase
            const { token_code } = resolveCryptoCodes(currencyCode)
            const result = await getFioObtData(token_code)
            if (result && result['obt_data_records']) {
                const fioData = result['obt_data_records'].reduce((res, item) => {
                    if (!item.content?.memo) {
                        return res
                    }

                    return !item.content?.obt_id ? res : {
                        ...res,
                        [item.content?.obt_id]: item.content?.memo
                    }
                }, {})

                DaemonCache.CACHE_FIO_MEMOS[currencyCode] = {
                    ...DaemonCache.getFioMemo(currencyCode),
                    ...fioData
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('UpdateAccountBalanceAndTransactions error on loadFioData ' + e.message, e)
            }
            Log.errDaemon('UpdateAccountBalanceAndTransactions error on loadFioData ' + e.message)
        }
    }

    async _accountRun(account, accounts, source, time, force, onlyBalances = false) {

        let newBalance = false
        let addressToScan = account.address

        Log.daemon('UpdateAccountBalanceAndTransactions _accountRun init ' + account.id + ' ' + account.currencyCode + ' ' + account.address)

        if (account.accountJson && typeof account.accountJson.addressHex !== 'undefined') {
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

            if (account.currencyCode === 'BTC') {
                const additional = {}
                if (account.walletIsHd && account.derivationPath !== 'm/49quote/0quote/0/1/0') {
                    updateObj.balanceScanLog = account.address + ' should be HD '
                    updateObj.balanceScanError = ''
                    await accountBalanceDS.updateAccountBalance({ updateObj }, account)
                    return false
                } else {
                    newBalance = await (BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(addressToScan).setAdditional(additional).setWalletHash(account.walletHash)).getBalance('AccountRunBalancesBtc')
                }
            } else {
                newBalance = await (BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(addressToScan).setAdditional(account.accountJson).setWalletHash(account.walletHash)).getBalance('AccountRunBalances')
            }
            if (!newBalance || typeof newBalance.balance === 'undefined') {
                if (account.balanceScanBlock === 0 && account.balanceScanTime === 0) {
                    updateObj.balanceScanLog = account.address + ' empty response, old balance ' + account.balance + ', ' + JSON.stringify(newBalance)
                    updateObj.balanceScanError = 'account.balanceBadNetwork'
                    await accountBalanceDS.updateAccountBalance({ updateObj }, account)
                    return false
                }
                balanceError = ' something wrong with balance ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance)
                Log.daemon('UpdateAccountBalanceAndTransactions newBalance something wrong ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance))
            } else {
                balanceError = ' found in one ' + JSON.stringify(newBalance)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountBalanceAndTransactions newBalance from ' + source + ' loaded ' + account.currencyCode + ' ' + addressToScan + ' error ' + e.message)
            }
            balanceError = ' found balanceError ' + e.message
        }

        Log.daemon('UpdateAccountBalanceAndTransactions newBalance from ' + source + ' loaded ' + account.currencyCode + ' ' + addressToScan, JSON.stringify(newBalance))
        let continueWithTx = true
        let shouldUpdateBalance = false
        try {

            if (newBalance && typeof newBalance.balance !== 'undefined') {

                if (typeof account.balance === 'undefined') {
                    shouldUpdateBalance = true
                } else if (newBalance.balance.toString() !== account.balance.toString()  || newBalance.unconfirmed.toString() !== account.unconfirmed.toString() ) {
                    shouldUpdateBalance = true
                } else if (typeof newBalance.balanceStaked !== 'undefined') {
                    if (typeof account.balanceStaked === 'undefined') {
                        shouldUpdateBalance = true
                    } else if (newBalance.balanceStaked * 1 !== account.balanceStaked * 1) { // toString here somehow do undefined sometimes
                        shouldUpdateBalance = true
                    }
                }

                if (typeof newBalance.balanceScanBlock !== 'undefined' && (typeof account.balanceScanBlock === 'undefined' || newBalance.balanceScanBlock * 1 < account.balanceScanBlock * 1)) {
                    continueWithTx = false
                    updateObj.balanceProvider = newBalance.provider
                    updateObj.balanceScanLog = account.address + ' block error, ignored new ' + newBalance.balance + ' block ' + newBalance.balanceScanBlock + ', old balance ' + account.balance + ' block ' + account.balanceScanBlock
                    updateObj.balanceScanError = 'account.balanceBadBlock'
                } else if (shouldUpdateBalance) {
                    updateObj.balanceFix = newBalance.balance // lets send to db totally not changed big number string
                    updateObj.balanceTxt = newBalance.balance.toString() // and string for any case
                    updateObj.unconfirmedFix = newBalance.unconfirmed || 0 // lets send to db totally not changed big number string
                    updateObj.unconfirmedTxt = newBalance.unconfirmed || '' // and string for any case
                    updateObj.balanceStakedTxt = newBalance.balanceStaked || '0'
                    updateObj.balanceProvider = newBalance.provider
                    if (typeof newBalance.balanceScanBlock !== 'undefined') {
                        updateObj.balanceScanBlock = newBalance.balanceScanBlock
                    }
                    updateObj.balanceScanLog = account.address + ' all ok, new balance ' + newBalance.balance + ', old balance ' + account.balance + ', ' + balanceError
                    updateObj.balanceScanError = ''
                    const logData = {}
                    logData.walletHash = account.walletHash
                    logData.currencyCode = account.currencyCode
                    logData.address = account.address
                    logData.addressShort = account.address ? account.address.slice(0, 10) : 'none'
                    logData.balanceScanTime = account.balanceScanTime + ''
                    logData.balanceProvider = account.balanceProvider + ''
                    logData.balance = account.balance + ''
                    logData.newBalanceProvider = account.newBalanceProvider + ''
                    logData.newBalance = (newBalance.balance * 1) + ''
                    MarketingEvent.setBalance(logData.walletHash, logData.currencyCode, logData.newBalance, logData)
                } else {
                    updateObj.balanceScanLog = account.address + ' not changed, old balance ' + account.balance + ', ' + balanceError
                    updateObj.balanceScanError = ''
                    if (typeof newBalance.provider !== 'undefined') {
                        updateObj.balanceProvider = newBalance.provider
                    }
                }
                Log.daemon('UpdateAccountBalanceAndTransactions newBalance ok Prepared ' + account.currencyCode + ' ' + account.address + ' new balance ' + newBalance.balance + ' provider ' + newBalance.provider + ' old balance ' + account.balance, JSON.stringify(updateObj))
            } else {
                updateObj.balanceScanLog = account.address + ' no balance, old balance ' + account.balance + ', ' + balanceError
                updateObj.balanceScanError = 'account.balanceBadNetwork'
                Log.daemon('UpdateAccountBalanceAndTransactions newBalance not Prepared ' + account.currencyCode + ' ' + account.address + ' old balance ' + account.balance, JSON.stringify(updateObj))
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountBalanceAndTransactions newBalance from ' + source + ' loaded ' + account.currencyCode + ' ' + addressToScan + ' format error ' + e.message)
            }
            e.message += ' while accountBalanceDS.updateAccountBalance formatting'
            throw e
        }

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

        if (!continueWithTx || onlyBalances) {
            return shouldUpdateBalance // balance error - tx will not be good also
        }
        try {
            let transactionsError = ' '
            let newTransactions = false
            try {
                Log.daemon('UpdateAccountBalanceAndTransactions newTransactions ' + account.currencyCode + ' ' + account.address)
                if (account.currencyCode === 'BTC' || account.currencyCode === 'LTC') {
                    const additional = {... account.accountJson}
                    additional.addresses = await accountScanningDS.getAddresses({
                        currencyCode: account.currencyCode,
                        walletHash: account.walletHash
                    })
                    if (account.walletIsHd && account.currencyCode !== 'LTC') {
                        additional.walletPub = true // actually not needed pub - just flag
                    }
                    newTransactions = await BlocksoftTransactions.getTransactions({ account, additional },  'AccountRunTransactionsBtc')
                } else {
                    newTransactions = await BlocksoftTransactions.getTransactions({ account, additional: account.accountJson }, 'AccountRunTransactions')
                }
                if (!newTransactions || newTransactions.length === 0) {
                    transactionsError = ' empty transactions ' + account.currencyCode + ' ' + account.address
                } else {
                    transactionsError = ' found transactions ' + newTransactions.length
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateAccountBalanceAndTransactions newTransactions something wrong ' + account.currencyCode + ' ' + account.address + ' => transactionsError ' + e.message, e)
                }
                Log.errDaemon('UpdateAccountBalanceAndTransactions newTransactions something wrong ' + account.currencyCode + ' ' + account.address + ' => transactionsError ' + e.message)

                transactionsError = ' found transactionsError ' + e.message
            }

            Log.daemon('UpdateAccountBalanceAndTransactions newTransactions loaded ' + account.currencyCode + ' ' + addressToScan)

            let transactionUpdateObj
            try {
                transactionUpdateObj = await AccountTransactionsRecheck(newTransactions, account, 'RECHECK ' + source)
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
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountBalanceAndTransactions newTransactions something wrong ' + account.currencyCode + ' ' + account.address + ' => transactionsError2 ' + e.message, e)
            }
            Log.errDaemon('UpdateAccountBalanceAndTransactions newTransactions something wrong ' + account.currencyCode + ' ' + account.address + ' => transactionsError2 ' + e.message)
        }

        CACHE_ONE_ACCOUNTS[account.currencyCode + '_' + account.address] = 1

        if (account.currencyCode === 'TRX') {
            for (const sub of accounts) {
                if (sub.currencyCode === 'TRX_USDT') {
                    if (await this._accountRun(sub, accounts, source + ' GONE INNER', CACHE_VALID_TIME, true)) {
                        shouldUpdateBalance = true
                    }
                    break
                }
            }
            for (const sub of accounts) {
                if (sub.currencyCode !== 'TRX_USDT' && sub.currencyCode.indexOf('TRX_') === 0) {
                    if (await this._accountRun(sub, accounts, source + ' GONE INNER2', CACHE_VALID_TIME, true)) {
                        shouldUpdateBalance = true
                    }
                }
            }
        }

        await this.loadFioData(account.currencyCode)

        Log.daemon('UpdateAccountBalanceAndTransactions _accountRun finish ' + account.id + ' ' + account.currencyCode + ' ' + account.address)

        return shouldUpdateBalance
    }

}


const singleton = new UpdateAccountBalanceAndTransactions()
export default singleton
