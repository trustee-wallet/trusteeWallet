/**
 * @version 0.9
 */
import accountBalanceDS from '../../DataSource/AccountBalance/AccountBalance'

import accountDS from '../../DataSource/Account/Account'

export default {

    initBalances: async (walletHash) => {

        const accounts = await accountDS.getAccounts({ walletHash })
        const currencyCodes = {}

        const prepare = []

        let account
        for (account of accounts) {

            const {
                currencyCode,
                walletHash,
                id: accountId
            } = account

            prepare.push({
                balanceFix: 0,
                unconfirmedFix: 0,
                balanceScanTime: 0,
                balanceScanLog: '',
                status: 0,
                currencyCode,
                walletHash,
                accountId
            })

            currencyCodes[currencyCode] = 1
        }

        const queryData = {
            insertObjs: prepare
        }

        await accountBalanceDS.insertAccountBalance(queryData)

        return currencyCodes

    }

}
