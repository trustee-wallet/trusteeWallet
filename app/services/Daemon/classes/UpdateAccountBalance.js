import Update from './Update'

import accountBalanceDS from '../../../appstores/DataSource/AccountBalance/AccountBalance'
import accountDS from '../../../appstores/DataSource/Account/Account'
import walletDS from '../../../appstores/DataSource/Wallet/Wallet'
import walletPubDS from '../../../appstores/DataSource/WalletPub/WalletPub'

import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import updateAccountTransactionsDaemon from '../../../services/Daemon/classes/UpdateAccountTransactions'

import settingsActions from '../../../appstores/Actions/SettingsActions'
import { setSelectedAccount } from '../../../appstores/Actions/MainStoreActions'

const CACHE_NOW_UPDATING = {}

class UpdateAccountBalance extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountBalance
        this._tickCount = 0
    }


    /**
     * @namespace Flow.updateAccountBalance
     * @return {Promise<boolean>}
     */
    updateAccountBalance = async () => {
        this._tickCount++
        const params = { derivation_type: 'main', not_currency_code: 'BTC' }
        if (this._tickCount === 1) {
            params.not_currency_code = false
        } else if (this._tickCount > 5) {
            params.derivation_type = false
            params.not_currency_code = false
            this._tickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountBalance called', JSON.stringify(params))

        let accounts = await accountDS.getAccountsForScan(params)
        if (!accounts && params.not_currency_code) {
            params.not_currency_code = false
            accounts = await accountDS.getAccountsForScan(params)
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
                Log.daemon('DMN/UpdateAccountBalance called BTC HD', JSON.stringify(params))
                await this._updateAccountBalancePub({ walletHash: params.wallet_hash, currencyCode: 'BTC', source: 'BASIC' })
                return false
            }
        }
        await this._updateAccountBalance(accounts, 'BASIC')
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.source
     * @param {string} params.xpubKey
     * @returns {Promise<void>}
     * @private
     */
    _updateAccountBalancePub = async (params) => {
        const walletHash = params.walletHash
        const currencyCode = params.currencyCode
        let source = 'BASIC'
        if (params.source) {
            source = params.source
        }
        let xpubKey = false
        if (params.xpubKey) {
            xpubKey = params.xpubKey
        }

        const xpubs = await walletPubDS.getOrGenerate(params)
        Log.daemon('DMN/UpdateAccountBalance called ' + source + ' ' + currencyCode + ' XPUBS ' + JSON.stringify(xpubs))

        const keys = [{
            key: 'btc.44',
            currencyCode: currencyCode,
            setting: 'legacy'
        }, {
            key: 'btc.84',
            currencyCode: currencyCode + '_SEGWIT',
            setting: 'segwit'
        }]

        const changedAccounts = []
        const addressesToUpdate = {}

        let msg = ''
        let key
        let setting = await settingsActions.getSetting('btc_legacy_or_segwit')
        if (!setting) {
            setting = 'segwit'
        }
        for (key of keys) {
            if (xpubKey && xpubKey !== key.key) {
                continue
            }
            const xpub = xpubs[key.key]
            const balances = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(xpub.walletPubValue)).getBalance()
            const params = {
                currency_code: currencyCode,
                wallet_hash: walletHash,
                derivation_path: xpub.walletPubType === 'btc.44' ? 'm/44' : 'm/84'
            }
            const accounts = await accountDS.getAccountsForScanPub(params)
            if (!accounts) {
                continue
            }
            const updateAllPub = []
            let account
            let derivationIndex = 0
            for (account of accounts) {
                const newBalance = { balance: 0, provider: balances.provider }
                let error = 'not found in xpub'
                if (typeof balances.addresses[account.address] !== 'undefined') {
                    newBalance.balance = balances.addresses[account.address].balance
                    balances.addresses[account.address].found = true
                    error = 'found in xpub ' + JSON.stringify(balances.addresses[account.address])
                    if (account.walletPubId !== xpub.id || (!account.alreadyShown && balances.addresses[account.address].transactions > 0)) {
                        updateAllPub.push(`'${account.address}'`)
                    }
                }
                const tmp = await this._updateAccountBalancePrepOne(account, newBalance, error)
                if (tmp) {
                    msg += tmp.msg
                    changedAccounts.push(tmp.account)
                    addressesToUpdate[account.address] = account
                }
                if (account.derivationIndex > derivationIndex) {
                    derivationIndex = account.derivationIndex
                }
            }

            let address
            let toSearchAddressesLength = 0
            const toSearchAddresses = {}
            for (address in balances.addresses) {
                const balance = balances.addresses[address]
                if (typeof balance.found !== 'undefined') {
                    continue
                }
                toSearchAddresses[address] = address
                toSearchAddressesLength++
            }

            if (updateAllPub && updateAllPub.length > 0) {
                // console.log('DEBUG!!! updatedBalanced => already_shown', updateAllPub)
                await accountDS.massUpdateAccount(updateAllPub, 'address', `already_shown=1, wallet_pub_id=${xpub.id}`)
            }

            if (toSearchAddressesLength > 0) {
                // console.log('DEBUG!!! updateBalanced need to find addresses ', toSearchAddresses)
                walletPubDS.discoverNewAddressesForXpub(xpub, toSearchAddresses)
            }

            walletPubDS.discoverMoreAccountsForXpub(xpub, derivationIndex * 1, function() {
                if (key.setting === setting) {
                    // console.log('DEBUG!!! discovered and checked')
                    setSelectedAccount(setting)
                }
            })
        }

        if (changedAccounts && changedAccounts.length) {
            try {
                Log.daemon('DMN/UpdateAccountBalance updateEventHandler will be called ', msg)
                await this.updateEventHandler(changedAccounts)
            } catch (e) {
                Log.errDaemon('DMN/UpdateAccountBalance updateEventHandler error' + e.message)
            }
            if (addressesToUpdate) {
                await updateAccountTransactionsDaemon._updateAccountTransactionsPub(walletHash, 'BTC', 'BALANCES')
            }
        } else {
            Log.daemon('DMN/UpdateAccountBalance updateEventHandler will not be called ', changedAccounts)
        }
    }

    _updateAccountBalance = async (accounts, source = 'BASIC') => {
        if (!accounts || !accounts.length) return true
        const changedAccounts = []
        const addressesToUpdate = {}
        let msg = ''
        let account
        for (account of accounts) {
            Log.daemon('DMN/UpdateAccountBalance called ' + source + ' account ' + account.currencyCode + ' ' + account.address + ' wallet ' + account.walletHash)
            if (
                typeof (CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address]) !== 'undefined'
                && CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] > 0
            ) {
                Log.daemon('DMN/UpdateAccountBalance will be skipped as already scanning')
                continue
            }
            CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] = 1

            try {
                let newBalance = false
                let addressToScan = account.address
                let error = ''
                try {
                    Log.daemon('DMN/UpdateAccountBalance checking address ' + account.currencyCode + ' ' + account.address, account.accountJSON)
                    if (account.accountJSON && typeof (account.accountJSON.addressHex) !== 'undefined') {
                        addressToScan = account.accountJSON.addressHex
                        Log.daemon('DMN/UpdateAccountBalance changing address ' + account.currencyCode + ' ' + account.address + ' => ' + addressToScan)
                    }
                    newBalance = await (BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(addressToScan).setAdditional(account.accountJSON)).getBalance()
                    if (!newBalance || typeof newBalance.balance === 'undefined') {
                        error = ' something wrong with balance ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance)
                        Log.log('DMN/UpdateAccountBalance something wrong with balance ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance))
                    } else {
                        error = ' found in one ' + JSON.stringify(newBalance)
                    }
                } catch (e) {
                    error = 'catched error ' + e.message
                    // actually we need to update scan time even for error addresses thats why
                }
                Log.daemon('DMN/UpdateAccountBalance got balance account ' + account.currencyCode + ' ' + addressToScan, JSON.stringify(newBalance))

                const tmp = await this._updateAccountBalancePrepOne(account, newBalance, error)
                if (tmp) {
                    msg += tmp.msg
                    changedAccounts.push(tmp.account)
                    addressesToUpdate[account.address] = account
                }

                CACHE_NOW_UPDATING[account.currencyCode + '_' + account.address] = 0

                Log.daemon('DMN/UpdateAccountBalance finished', JSON.stringify(tmp))
            } catch (e) {
                Log.errDaemon('DMN/UpdateAccountBalance error ' + e.message)
            }
        }


        if (changedAccounts && changedAccounts.length) {
            try {
                Log.daemon('DMN/UpdateAccountBalance updateEventHandler will be called ', msg)
                await this.updateEventHandler(changedAccounts)
            } catch (e) {
                Log.errDaemon('DMN/UpdateAccountBalance updateEventHandler error' + e.message)
            }
            if (addressesToUpdate) {
                await updateAccountTransactionsDaemon._updateAccountTransactions(Object.values(addressesToUpdate), 'BALANCES')
            }
        } else {
            Log.daemon('DMN/UpdateAccountBalance updateEventHandler will not be called ', changedAccounts)
        }
    }

    _updateAccountBalancePrepOne = async (account, newBalance, error = 'default error message') => {
        const prepare = {
            key: {
                account_id: account.id
            },
            updateObj: {
                balanceScanTime: Math.round(new Date().getTime() / 1000)
            }
        }

        let balanceIsChanging = false

        if (newBalance && newBalance.balance * 1 !== account.balance * 1) {
            prepare.updateObj.balanceFix = newBalance.balance // lets send to db totally not changed big number string
            prepare.updateObj.balanceTxt = newBalance.balance // and string for any case
            prepare.updateObj.balanceProvider = newBalance.provider
            prepare.updateObj.balanceScanLog = 'all ok, new balance ' + newBalance.balance + ', old balance ' + account.balance + ', ' + error
            balanceIsChanging = true
        } else {
            prepare.updateObj.balanceScanLog = 'not changed, old balance ' + account.balance + ', ' + error
        }

        Log.daemon('DMN/UpdateAccountBalance prepared for ' + account.currencyCode + ' ' + account.address + ' new balance ' + newBalance.balance + ' provider ' + newBalance.provider + ' old balance ' + account.balance, JSON.stringify(prepare))

        await accountBalanceDS.updateAccountBalance(prepare, account)

        if (!balanceIsChanging) return false

        account.newBalance = newBalance.balance
        account.newBalanceProvider = newBalance.provider

        const msg = account.currencyCode + ' ' + account.address + ' ' + account.balance + ' => ' + account.newBalance + ' ' + account.newBalanceProvider + '\n'
        const logData = {}
        logData.walletHash = account.walletHash
        logData.currency = account.currencyCode
        logData.address = account.address
        logData.address_short = account.address ? account.address.slice(0, 10) : 'none'
        logData.balanceScanTime = account.balanceScanTime + ''
        logData.balanceProvider = account.balanceProvider + ''
        logData.balance = account.balance + ''
        logData.newBalanceProvider = account.newBalanceProvider + ''
        logData.newBalance = account.newBalance + ''
        MarketingEvent.setBalance(logData.walletHash, logData.currency, logData.newBalance, logData)

        return { msg, account }
    }
}

const singleton = new UpdateAccountBalance
export default singleton
