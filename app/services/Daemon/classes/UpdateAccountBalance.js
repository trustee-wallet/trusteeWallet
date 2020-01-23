import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import accountBalanceDS from '../../../appstores/DataSource/AccountBalance/AccountBalance'
import accountDS from '../../../appstores/DataSource/Account/Account'


import Update from './Update'
import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import updateAccountTransactionsDaemon from '../../../services/Daemon/classes/UpdateAccountTransactions'

class UpdateAccountBalance extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountBalance
        this.nowUpdating = {}
        this._tickCount = 0
    }


    /**
     * @namespace Flow.updateAccountBalance
     * @return {Promise<boolean>}
     */
    updateAccountBalance = async () => {
        this._tickCount++
        const params = { derivation_type: 'main', not_currency_code : 'BTC' }
        if (this._tickCount === 1) {
            params.not_currency_code = false
        } else if (this._tickCount > 5) {
            params.derivation_type = false
            params.not_currency_code = false
            this._tickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountBalance called', JSON.stringify(params))

        const { array: accounts } = await accountDS.getAccountsForScan(params)

        await this._updateAccountBalance(accounts, 'BASIC')
    }

    _updateAccountBalance = async (accounts, source = 'BASIC') => {
        if (!accounts || !accounts.length) return true
        let changedAccounts = []
        let msg = ''

        let addressesToUpdate = {}
        for (let account of accounts) {
            Log.daemon('DMN/UpdateAccountBalance called ' + source + ' account ' + account.currencyCode + ' ' + account.address + ' wallet ' + account.walletHash)
            if (
                typeof(this.nowUpdating[account.currencyCode + '_' + account.address]) !== 'undefined'
                && this.nowUpdating[account.currencyCode + '_' + account.address] > 0
            ) {
                Log.daemon('DMN/UpdateAccountBalance will be skipped as already scanning')
                continue
            }
            this.nowUpdating[account.currencyCode + '_' + account.address] = 1

            try {
                let newBalance = false
                let balanceIsOk = false
                let addressToScan = account.address
                try {
                    Log.daemon('DMN/UpdateAccountBalance checking address ' + account.currencyCode + ' ' + account.address, account.accountJSON)
                    if (account.accountJSON && typeof (account.accountJSON.addressHex) !='undefined') {
                        addressToScan = account.accountJSON.addressHex
                        Log.daemon('DMN/UpdateAccountBalance changing address ' + account.currencyCode + ' ' + account.address + ' => ' + addressToScan)
                    }
                    newBalance = await ( BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(addressToScan).setAdditional(account.accountJSON) ).getBalance()
                    if (!newBalance || typeof newBalance.balance === 'undefined') {
                        Log.log('DMN/UpdateAccountBalance something wrong with balance ' + account.currencyCode + ' ' + addressToScan + ' => ' + JSON.stringify(newBalance))
                    } else {
                        balanceIsOk = true
                    }
                } catch (e) {
                    // actually we need to update scan time even for error addresses thats why
                }
                Log.daemon('DMN/UpdateAccountBalance got balance account ' + account.currencyCode + ' ' + addressToScan, JSON.stringify(newBalance))

                const prepare = {
                    key: {
                        account_id: account.id
                    },
                    updateObj: {
                        balanceScanTime: Math.round(new Date().getTime() / 1000)
                    }
                }

                let balanceIsChanging = false

                if (balanceIsOk && newBalance && newBalance.balance*1 !== account.balance*1) {
                    prepare.updateObj.balanceFix = newBalance.balance // lets send to db totally not changed big number string
                    prepare.updateObj.balanceTxt = newBalance.balance // and string for any case
                    prepare.updateObj.balanceProvider = newBalance.provider
                    balanceIsChanging = true
                    addressesToUpdate[account.address] = account

                }

                Log.daemon('DMN/UpdateAccountBalance prepared for ' + account.currencyCode + ' ' + account.address + ' new balance ' + newBalance.balance + ' provider ' + newBalance.provider + ' old balance ' + account.balance , JSON.stringify(prepare))

                await accountBalanceDS.updateAccountBalance(prepare, account)

                if (balanceIsChanging) {
                    account.newBalance = newBalance.balance
                    account.newBalanceProvider = newBalance.provider
                    changedAccounts.push(account)
                    msg += account.currencyCode + ' ' + account.address + ' ' + account.balance + ' => ' + account.newBalance + ' ' + account.newBalanceProvider + '\n'
                    const logData = {}
                    logData.walletHash = account.walletHash
                    logData.currency = account.currencyCode
                    logData.address = account.address
                    logData.balanceScanTime = account.balanceScanTime +''
                    logData.balanceProvider = account.balanceProvider + ''
                    logData.balance = account.balance +''
                    logData.newBalanceProvider = account.newBalanceProvider + ''
                    logData.newBalance = account.newBalance + ''
                    MarketingEvent.setBalance(logData.walletHash, logData.currency, logData.newBalance, logData)
                }

                this.nowUpdating[account.currencyCode + '_' + account.address] = 0

                Log.daemon('DMN/UpdateAccountBalance finished')

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountBalance error ' + e.message)

            }
        }


        if (changedAccounts && changedAccounts.length) {
            try {

                Log.daemon('DMN/UpdateAccountBalance updateEventHandler will be called ', msg )

                await this.updateEventHandler(changedAccounts)

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountBalance updateEventHandler error' + e.message)

            }

            if (addressesToUpdate) {
                await updateAccountTransactionsDaemon._updateAccountTransactions(Object.values(addressesToUpdate), 'BALANCES')
            }

        } else {

            Log.daemon('DMN/UpdateAccountBalance updateEventHandler will not be called ', changedAccounts )

        }

    }
}

let singleton = new UpdateAccountBalance
export default singleton
