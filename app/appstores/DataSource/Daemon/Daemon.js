import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

export default {
    getCurrencyBalanceAmount: async (walletHash, currencyCode) => {

        Log.daemon('DS/Daemon getCurrencyBalanceAmount called')

        const dbInterface = new DBInterface()

        let res = []

        try {
            res = await dbInterface.setQueryString(`SELECT currency_code, sum(balance_fix) AS currencyBalanceAmount FROM account_balance WHERE wallet_hash = '${walletHash}' AND currency_code = '${currencyCode}'`).query()

            if (!res || !res.array.length) {
                throw new Error('nothing summed')
            }

            Log.daemon('DS/Daemon getCurrencyBalanceAmount finished')
        } catch (e) {
            let data = await dbInterface.setQueryString(`SELECT currency_code, balance_fix AS balance FROM account_balance WHERE wallet_hash = '${walletHash}' AND currency_code = '${currencyCode}'`).query()
            Log.errDaemon('DS/Daemon getCurrencyBalanceAmount error (full data inside)', e, data)
        }

        return res
    },
}
