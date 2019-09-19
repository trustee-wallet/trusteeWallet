import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import accountBalanceDS from '../../../appstores/DataSource/AccountBalance/AccountBalance'
import accountDS from '../../../appstores/DataSource/Account/Account'


import Update from './Update'
import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

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
        const params = { derivation_type: 'main' }
        if (this._tickCount > 5) {
            params.derivation_type = false
            this._tickCount = 0
        }
        params.wallet_hash = await BlocksoftKeysStorage.getSelectedWallet()

        Log.daemon('DMN/UpdateAccountBalance called', JSON.stringify(params))

        const { array: accounts } = await accountDS.getAccountsForScan(params)

        if (!accounts || !accounts.length) return true

        let changedAccounts = []
        let msg = ''
        for (let account of accounts) {
            try {
                let balance = false
                let balanceIsOk = false
                try {
                    balance = await ( BlocksoftBalances.setCurrencyCode(account.currencyCode).setAddress(account.address) ).getBalance()
                    balanceIsOk = true
                } catch (e) {
                    // actually we need to update scan time even for error addresses thats why
                }

                const prepare = {
                    key: {
                        account_id: account.id
                    },
                    updateObj: {
                        balanceScanTime: Math.round(new Date().getTime() / 1000)
                    }
                }

                if (balanceIsOk && balance*1 !== account.balance*1) {
                    prepare.updateObj.balance = balance // lets send to db totally not changed big number string
                }

                Log.daemon('DMN/UpdateAccountBalance prepared for ' + account.currencyCode + ' ' + account.address + ' new balance ' + balance + ' old balance ' + account.balance , JSON.stringify(prepare))

                await accountBalanceDS.updateAccountBalance(prepare)

                if (balanceIsOk && balance*1 !== account.balance*1) {
                    account.newBalance = balance
                    changedAccounts.push(account)
                    msg += account.currencyCode + ' ' + account.address + ' ' + account.balance + ' => ' + account.newBalance + '\n'
                    MarketingEvent.logEvent('slava_update_account_balance', account)
                }

                Log.daemon('DMN/UpdateAccountBalance finished')

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountBalance', e)

            }
        }


        if (changedAccounts && changedAccounts.length) {
            try {

                Log.log('DMN/UpdateAccountBalance updateEventHandler will be called ', msg )

                await this.updateEventHandler(changedAccounts)

            } catch (e) {

                Log.errDaemon('DMN/UpdateAccountBalance updateEventHandler error', e)

            }
        } else {

            Log.daemon('DMN/UpdateAccountBalance updateEventHandler will not be called ', changedAccounts )

        }

    }
}

export default new UpdateAccountBalance
