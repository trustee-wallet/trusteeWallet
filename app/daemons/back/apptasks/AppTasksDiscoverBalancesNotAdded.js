/**
 * @version 0.11
 */
import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'

import appNewsDS from '../../../appstores/DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

class AppTasksDiscoverBalancesNotAdded {
    /**
     *
     * @param {string} appTask.walletHash
     * @param {string} appTask.currencyCode
     * @returns {Promise<void>}
     */
    run = async (appTask) => {

        const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(appTask.walletHash, 'AppTasksDiscoverBalancesNotAdded.run')
        const accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree: false, fromIndex: 0, toIndex: 1, currencyCode: appTask.currencyCode }, 'APP_TASK')
        if (!accounts) return 'no address'
        const account = accounts[appTask.currencyCode][0]
        let addressToScan = account.address
        if (account.accountJson) {
            try {
                if (typeof account.addedData.addressHex !== 'undefined') {
                    addressToScan = account.addedData.addressHex
                    Log.daemon('AppTasksDiscoverBalancesNotAdded changing address ' + appTask.currencyCode + ' ' + account.address + ' => ' + addressToScan)
                }
            } catch (e) {
                // do nothing
            }
        }
        let newBalance
        try {
            newBalance = await (BlocksoftBalances.setCurrencyCode(appTask.currencyCode).setAddress(addressToScan).setAdditional(account.addedData).setWalletHash(appTask.walletHash)).getBalance()
            Log.daemon('AppTasksDiscoverBalanceNotAdded loaded address ' + appTask.currencyCode + ' ' + addressToScan, newBalance)
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
            walletHash: appTask.walletHash,
            currencyCode: appTask.currencyCode,
            newsGroup: 'DAEMON',
            newsName: 'DAEMON_HAS_FOUND_BALANCE_NOT_ADDED',
            newsJson: newBalance
        })

        return addressToScan + ' not zero balance ' + JSON.stringify(newBalance)

    }
}

export default new AppTasksDiscoverBalancesNotAdded()
