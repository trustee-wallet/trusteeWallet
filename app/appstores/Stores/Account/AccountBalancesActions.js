/**
 * @version 0.9
 */
import accountBalanceDS from '../../DataSource/AccountBalance/AccountBalance'

import accountDS from '../../DataSource/Account/Account'

export default {

    initBalances: async (walletHash, needScan = true) => {

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

            const tmp = {
                balanceFix: 0,
                balanceTxt: '0',
                unconfirmedFix: 0,
                unconfirmedTxt: '0',
                balanceProvider : 'create',
                balanceScanTime: 0,
                balanceScanLog: new Date().toISOString() + ' create wallet',
                status: 0,
                currencyCode,
                walletHash,
                accountId
            }
            if (!needScan) {
                tmp.balanceScanTime = Math.round(new Date().getTime() / 1000)
                tmp.balanceScanLog = new Date().toISOString() + ' create wallet without scan'
            }

            prepare.push(tmp)

            currencyCodes[currencyCode] = 1
        }

        const queryData = {
            insertObjs: prepare
        }

        await accountBalanceDS.insertAccountBalance(queryData)

        return currencyCodes

    }

}
