/**
 * @version 0.11
 */
import DBInterface from '../../../appstores/DataSource/DB/DBInterface'
import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'

import appNewsDS from '../../../appstores/DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'

class AppTasksDiscoverBalancesHidden {
    /**
     *
     * @param {string} appTask.walletHash
     * @param {string} appTask.currencyCode
     * @returns {Promise<void>}
     */
    run = async (appTask) => {

        const dbInterface = new DBInterface()
        const sql =`
        SELECT 
            currency_code AS currencyCode,
            address, 
            account_json AS accountJson
            FROM account
            WHERE currency_code='${appTask.currencyCode}' 
        LIMIT 1`
        const tmp = await dbInterface.setQueryString(sql).query()
        if (!tmp || typeof tmp.array === 'undefined' || !tmp.array) return 'no account'
        const account = tmp.array[0]
        let addressToScan = account.address
        if (account.accountJson) {
            try {
                account.accountJson = JSON.parse(account.accountJson)
                if (typeof account.accountJson.addressHex !== 'undefined') {
                    addressToScan = account.accountJson.addressHex
                    Log.daemon('AppTasksDiscoverBalancesHidden changing address ' + appTask.currencyCode + ' ' + account.address + ' => ' + addressToScan)
                }
            } catch (e) {
                // do nothing
            }
        }
        let newBalance
        try {
            newBalance = await (BlocksoftBalances.setCurrencyCode(appTask.currencyCode).setAddress(addressToScan).setAdditional(account.accountJson)).getBalance()
            Log.daemon('AppTasksDiscoverBalancesHidden loaded address ' + appTask.currencyCode + ' ' + addressToScan, newBalance)
        } catch (e) {
            e.message += ' scanning ' + appTask.currencyCode + ' address ' + addressToScan
            throw e
        }
        if (!newBalance) {
            return addressToScan + ' no balance'
        }
        if (newBalance.balance*1 === 0 && newBalance.unconfirmed*1 === 0) {
            return addressToScan + ' zero balance ' + JSON.stringify(newBalance)
        }
        newBalance.address = addressToScan

        await appNewsDS.saveAppNews({
            walletHash : appTask.walletHash,
            currencyCode : appTask.currencyCode,
            newsGroup : 'DAEMON',
            newsName : 'DAEMON_HAS_FOUND_BALANCE',
            newsJson : newBalance
        })

        return addressToScan + ' not zero balance ' + JSON.stringify(newBalance)

    }
}
export default new AppTasksDiscoverBalancesHidden()
