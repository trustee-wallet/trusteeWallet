/**
 * @version 0.11
 */
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftTransactions from '../../../crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import walletPubScanningDS from '../../appstores/DataSource/Wallet/WalletPubScanning'
import accountScanningDS from '../../appstores/DataSource/Account/AccountScanning'

import AccountTransactionsRecheck from './apputils/AccountTransactionsRecheck'
import accountDS from '../../appstores/DataSource/Account/Account'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import config from '@app/config/config'
import accountBalanceDS from '@app/appstores/DataSource/AccountBalance/AccountBalance'

let CACHE_LAST_TIME = false
const CACHE_VALID_10MIN_TIME = 600000 // 10 minutes
let CACHE_WALLETS_HASH = {}
class UpdateAccountBalanceAndTransactionsHD {

    /**
     * @param {string} callParams.source
     * @param {boolean} callParams.force
     * @returns {Promise<boolean>}
     */
    updateAccountBalanceAndTransactionsHD = async (callParams) => {
        const source = callParams.source || 'FRONT'
        const force = callParams.force || false

        if (!force || source === 'BACK') {
            const setting = await settingsActions.getSetting('scannerCode')
            if (setting === 'none') {
                return false
            } else if (CACHE_LAST_TIME && setting === '10min') {
                const now = new Date().getTime()
                const diff = now - CACHE_LAST_TIME
                if (diff < CACHE_VALID_10MIN_TIME) {
                    Log.daemon('UpdateAccountBalanceAndTransactionsHD skipped by diff ' + diff)
                    return false
                }
            }
        }

        try {
            const params = {
                force
            }
            if (source !== 'BACK') {
                params.walletHash = await settingsActions.getSelectedWallet('UpdateAccountBalanceAndTransactionsHD')
            }

            Log.daemon('UpdateAccountBalanceHD called ' + source + ' ' + JSON.stringify(params))

            const walletPubs = await walletPubScanningDS.getWalletPubsForScan(params)

            if (!walletPubs || walletPubs.length === 0) return false

            this._logNews = {}
            CACHE_WALLETS_HASH = {}
            for (const walletPub of walletPubs) {
                await this._walletRun(walletPub, source)
            }

            if (this._logNews) {
                let key
                for (key in this._logNews) {
                    await appNewsDS.saveAppNews({
                        onlyOne: true, walletHash: key, currencyCode: 'BTC', newsGroup: 'ONE_BY_ONE_SCANNER', newsName: 'HD_SCANNED_LAST_TIME',
                        newsJson: { log: this._logNews[key].substr(0, 50) + '...' }
                    })
                }
            }

            CACHE_LAST_TIME = new Date().getTime()
        } catch (e) {
            Log.errDaemon('UpdateAccountBalanceHD balanceError ' + source + ' ' + e.message)
            return false
        }
        return true
    }

    /**
     * @param {Object} walletPub
     * @param {string} walletPub.id
     * @param {string} walletPub.currencyCode
     * @param {string} walletPub.walletHash
     * @param {string} walletPub.walletPubType
     * @param {string} walletPub.walletPubValue
     * @param {string} walletPub.transactionsScanTime
     * @param {string} walletPub.balance
     * @param {string} walletPub.balanceFix
     * @param {string} walletPub.balanceTxt
     * @param {string} walletPub.unconfirmed
     * @param {string} walletPub.unconfirmedFix
     * @param {string} walletPub.unconfirmedTxt
     * @param {string} walletPub.balanceProvider
     * @param {string} walletPub.balanceScanTime
     * @param {string} walletPub.balanceScanLog
     * @param {string} source
     * @returns {Promise<void>}
     * @private
     */
    async _walletRun(walletPub, source) {
        let newBalance = false
        let balanceError = false
        const addressToScan = walletPub.walletPubValue
        if (config.debug.appErrors) {
            console.log(new Date().toISOString() + ' UpdateAccountBalanceAndTransactionsHD newBalance started ' + walletPub.currencyCode + ' ' + addressToScan)
        }
        try {
            Log.daemon('UpdateAccountBalanceAndTransactionsHD newBalance ' + walletPub.currencyCode + ' ' + addressToScan)
            newBalance = await (BlocksoftBalances.setCurrencyCode(walletPub.currencyCode).setAddress(addressToScan).setWalletHash(walletPub.walletHash)).getBalance('AccountRunHD')
            if (!newBalance || typeof newBalance.balance === 'undefined') {
                balanceError = ' something wrong with balance ' + walletPub.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance)
                Log.daemon('UpdateAccountBalanceAndTransactionsHD newBalance something wrong ' + walletPub.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance))
                if (config.debug.appErrors) {
                    console.log('UpdateAccountBalanceAndTransactionsHD newBalance error ' + balanceError)
                }
            } else {
                balanceError = ' found in one ' + JSON.stringify(newBalance)
            }
        } catch (e) {
            balanceError = ' found balanceError ' + e.message
            if (config.debug.appErrors) {
                console.log('UpdateAccountBalanceAndTransactionsHD newBalance error ' + balanceError)
            }
        }

        Log.daemon('UpdateAccountBalanceAndTransactionsHD newBalance loaded ' + walletPub.currencyCode + ' ' + addressToScan, JSON.stringify(newBalance))
        const updateObj = {
            balanceScanTime: Math.round(new Date().getTime() / 1000)
        }
        if (newBalance) {
            if (newBalance.balance * 1 !== walletPub.balance * 1 || newBalance.unconfirmed * 1 !== walletPub.unconfirmed * 1) {
                if (typeof newBalance.specialMark !== 'undefined' && newBalance.specialMark === 'badServer' && walletPub.balance * 1 > 0) {
                    updateObj.balanceScanLog = 'badServer so not changed, old balance ' + walletPub.balance + ', ' + balanceError
                    if (typeof newBalance.provider !== 'undefined') {
                        updateObj.balanceProvider = newBalance.provider
                    }
                } else {
                    updateObj.balanceFix = newBalance.balance // lets send to db totally not changed big number string
                    updateObj.balanceTxt = newBalance.balance // and string for any case
                    updateObj.unconfirmedFix = newBalance.unconfirmed || 0 // lets send to db totally not changed big number string
                    updateObj.unconfirmedTxt = newBalance.unconfirmed || '' // and string for any case
                    updateObj.balanceProvider = newBalance.provider
                    updateObj.balanceScanLog = 'all ok, new balance ' + newBalance.balance + ', old balance ' + walletPub.balance + ', ' + balanceError

                    const logData = {}
                    logData.walletHash = walletPub.walletHash
                    logData.currencyCode = walletPub.currencyCode
                    logData.address = walletPub.walletPubValue
                    logData.addressShort = walletPub.walletPubValue ? walletPub.walletPubValue.slice(0, 10) : 'none'
                    logData.balanceScanTime = walletPub.balanceScanTime + ''
                    logData.balanceProvider = walletPub.balanceProvider + ''
                    logData.balance = walletPub.balance + ''
                    logData.newBalanceProvider = walletPub.newBalanceProvider + ''
                    logData.newBalance = (newBalance.balance * 1) + ''
                    MarketingEvent.setBalance(logData.walletHash, logData.currencyCode, logData.newBalance, logData)
                }
            } else {
                updateObj.balanceScanLog = 'not changed, old balance ' + walletPub.balance + ', ' + balanceError
                if (typeof newBalance.provider !== 'undefined') {
                    updateObj.balanceProvider = newBalance.provider
                }
            }
            Log.daemon('UpdateAccountBalanceAndTransactionsHD newBalance okPrepared ' + walletPub.currencyCode + ' ' + walletPub.walletPubValue + ' new balance ' + newBalance.balance + ' provider ' + newBalance.provider + ' old balance ' + walletPub.balance, JSON.stringify(updateObj))
        } else {
            updateObj.balanceScanLog = 'no balance, old balance ' + walletPub.balance + ', ' + balanceError
            Log.daemon('UpdateAccountBalanceAndTransactions newBalance notPrepared ' + walletPub.currencyCode + ' ' + walletPub.walletPubValue + ' old balance ' + walletPub.balance, JSON.stringify(updateObj))
        }

        if (typeof CACHE_WALLETS_HASH[walletPub.walletHash] !== 'undefined') {

            const transactionUpdateObj = {
                transactionsScanTime: Math.round(new Date().getTime() / 1000),
                transactionsScanLog: new Date().toISOString() + ' transaction prev scanned by ' +  CACHE_WALLETS_HASH[walletPub.walletHash]
            }
            if (walletPub.transactionsScanLog) {
                transactionUpdateObj.transactionsScanLog += ' ' + walletPub.transactionsScanLog
            }
            await walletPubScanningDS.updateTransactions({ updateObj: transactionUpdateObj }, walletPub)
            return false
        }
        CACHE_WALLETS_HASH[walletPub.walletHash] = walletPub.walletPubValue

        try {
            if (typeof this._logNews[walletPub.walletHash] === 'undefined') {
                this._logNews[walletPub.walletHash] = ''
            }
            this._logNews[walletPub.walletHash] += ' ' + walletPub.walletPubType + ' ' + updateObj.balanceScanLog
            updateObj.balanceScanLog = new Date().toISOString() + ' ' + updateObj.balanceScanLog
            if (walletPub.balanceScanLog) {
                updateObj.balanceScanLog += ' ' + walletPub.balanceScanLog.substr(0, 1000)
            }
            await walletPubScanningDS.updateBalance({ updateObj }, walletPub)
        } catch (e) {
            e.message += ' while accountBalanceDS.updateAccountBalance'
            throw e
        }

        let transactionsError = ' '
        let newTransactions = false

        let addresses = await accountScanningDS.getAddresses({ currencyCode: walletPub.currencyCode, walletHash: walletPub.walletHash, withBalances : true })
        try {
            const addressesBlockchain = await BlocksoftTransactions.getAddresses({
                account : { currencyCode : walletPub.currencyCode, address : walletPub.walletPubValue, walletHash : walletPub.walletHash},
                additional : { walletPub },
                withBalances : true
            }, 'UpdateAccountBalanceAndTransactionsHD addressesBlockchain')

            const sql = []
            const derivations = []
            let count = 0
            if (addressesBlockchain) {
                for (const address in addressesBlockchain) {
                    const path = addressesBlockchain[address].path
                    const balance = addressesBlockchain[address].balance
                    if (typeof addresses[address] !== 'undefined') {
                        if (addresses[address].balanceTxt !== balance) {
                            const updateObj = {
                                balanceScanTime: Math.round(new Date().getTime() / 1000),
                                balanceScanLog: ' newBalance ' + balance,
                                balanceScanError: '',
                                balanceTxt: balance
                            }
                            await accountBalanceDS.updateAccountBalance({ updateObj },
                                { id : addresses[address].id, currencyCode : walletPub.currencyCode, address : walletPub.walletPubValue, walletHash : walletPub.walletHash}
                            )
                        }
                        if (addresses[address].alreadyShown === 1) {
                            // do nothing - can log
                        } else {
                            sql.push(`'` + address + `'`)
                        }
                    } else {
                        if (path.toString().length < 2) continue
                        const tmp = {
                            address,
                            path,
                            alreadyShown: 1,
                            walletPubId: walletPub.id
                        }
                        count++
                        derivations.push(tmp)
                    }
                }
                if (count > 0) {
                    await accountDS.discoverAccountsFromHD({ currencyCode : 'BTC', walletHash: walletPub.walletHash, source, derivations }, source)
                    addresses = await accountScanningDS.getAddresses({ currencyCode: walletPub.currencyCode, walletHash: walletPub.walletHash })
                }
            }
            if (sql.length > 0) {
                await accountDS.massUpdateAccount(`address IN (` + sql.join(',') + ') AND (already_shown IS NULL OR already_shown=0)', 'already_shown=1')
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(' transactionsAddressesError ' + e.message)
            }
            transactionsError = ' found transactionsAddressesError ' + e.message
        }
        try {
            Log.daemon('UpdateAccountBalanceAndTransactionsHD newTransactions ' + walletPub.currencyCode + ' ' + walletPub.walletPubValue)
            newTransactions = await BlocksoftTransactions.getTransactions({
                account : {
                    currencyCode: walletPub.currencyCode,
                    address: walletPub.walletPubValue,
                    walletHash : walletPub.walletHash
                },
                additional : { addresses, walletPub }
            },'AccountRunHD')

            if (!newTransactions || newTransactions.length === 0) {
                transactionsError += ' something wrong with balance ' + walletPub.currencyCode + ' ' + walletPub.walletPubValue + ' => ' + JSON.stringify(newTransactions)
                Log.daemon('UpdateAccountBalanceAndTransactionsHD newTransactions something wrong ' + walletPub.currencyCode + ' ' + walletPub.walletPubValue + ' => ' + JSON.stringify(newTransactions))
            } else {
                transactionsError += ' found transactions ' + newTransactions.length
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(' found transactionsError ' + e.message)
            }
            transactionsError += ' found transactionsError ' + e.message
        }

        Log.daemon('UpdateAccountBalanceAndTransactionsHD newTransactions loaded ' + walletPub.currencyCode + ' ' + addressToScan)

        const transactionUpdateObj = await AccountTransactionsRecheck(newTransactions, walletPub, source)

        try {
            transactionUpdateObj.transactionsScanLog = new Date().toISOString() + ' ' + transactionsError + ' ' + transactionUpdateObj.transactionsScanLog
            if (walletPub.transactionsScanLog) {
                transactionUpdateObj.transactionsScanLog += ' ' + walletPub.transactionsScanLog
            }
            await walletPubScanningDS.updateTransactions({ updateObj: transactionUpdateObj }, walletPub)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(' walletPubScanningDS.updateWalletPub ' + e.message)
            }
            e.message += ' while walletPubScanningDS.updateWalletPub'
            throw e
        }
        if (config.debug.appErrors) {
            console.log(new Date().toISOString() + ' UpdateAccountBalanceAndTransactionsHD newBalance finished ' + walletPub.currencyCode + ' ' + addressToScan)
        }
        return true
    }

}


const singleton = new UpdateAccountBalanceAndTransactionsHD()
export default singleton
