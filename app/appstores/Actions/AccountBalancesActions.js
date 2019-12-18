import accountBalanceDS from '../DataSource/AccountBalance/AccountBalance'

import accountDS from '../DataSource/Account/Account'

export default {

    initBalances: async (walletHash) => {

        const { array: accounts } = await accountDS.getAccountsByWalletHash(walletHash)

        let prepare = []

        for(let account of accounts){

            const {
                currency_code,
                wallet_hash,
                id: account_id
            } = account

            prepare.push({
                balance_fix: 0,
                balance_scan_time: 0,
                status: 0,
                currency_code,
                wallet_hash,
                account_id
            })
        }

        const queryData = {
            insertObjs: prepare
        }

        await accountBalanceDS.insertAccountBalance(queryData)

    },

}
