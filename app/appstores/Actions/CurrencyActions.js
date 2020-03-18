import accountDS from '../DataSource/Account/Account'
import currencyDS from '../DataSource/Currency/Currency'
import accountBalanceDS from '../DataSource/AccountBalance/AccountBalance'
import walletDS from '../DataSource/Wallet/Wallet'

import { setCurrencies, setLoaderStatus } from './MainStoreActions'

import Log from '../../services/Log/Log'


const currencyActions = {

    addCurrency: async (currencyToAdd, isHidden = 0, isLoader = 1) => {

        isLoader ? setLoaderStatus(true) : null

        Log.log('ACT/Currency addCurrency started')

        let errorStepMsg = ''

        try {
            errorStepMsg = 'BlocksoftKeysStorage.getWallets started'

            const { array: wallets } = await walletDS.getWallets()

            const accountBalanceInsertObjs = []
            for (let wallet of wallets) {

                const wallet_hash = wallet.wallet_hash

                errorStepMsg = 'BlocksoftKeys.discoverAddresses started'
                await accountDS.discoverAccounts({walletHash : wallet_hash, currencyCode : [currencyToAdd.currencyCode]}, 'CREATE_CURRENCY')

                errorStepMsg = 'BlocksoftKeys.discoverAddresses got new accounts'
                const { array: dbAccounts } = await accountDS.getAccountsByWalletHashAndCurrencyCode(wallet_hash, currencyToAdd.currencyCode)

                const { id: insertID } = dbAccounts[0]

                accountBalanceInsertObjs.push({
                    balance_fix: 0,
                    balance_scan_time: 0,
                    balance_scan_log: '',
                    status: 0,
                    currency_code: currencyToAdd.currencyCode,
                    wallet_hash,
                    account_id: insertID
                })
            }

            await accountBalanceDS.insertAccountBalance({ insertObjs: accountBalanceInsertObjs })

            const currencyInsertObjs = {
                currency_code: currencyToAdd.currencyCode,
                currency_rate_usd: 0,
                currency_rate_json: '',
                currency_rate_scan_time: '',
                is_hidden: isHidden
            }

            await currencyDS.insertCurrency({ insertObjs: [currencyInsertObjs] })

            Log.log('ACT/Currency addCurrency finished')
        } catch (e) {

            if ( e.message) {
                e.message = errorStepMsg + ' ' + e.message
            } else {
                e.message = errorStepMsg
            }
            e.message += ' currencyToAdd = ' + JSON.stringify(currencyToAdd)

            Log.err('ACT/Currency addCurrency error ' + e.message)
        }

        setLoaderStatus(false)
    },

    /**
     *
     * @param {string} currencyCode
     * @param {integer} isHidden
     * @returns {Promise<void>}
     */
    toggleCurrencyVisibility: async (currencyCode, isHidden) => {

        setLoaderStatus(true)

        Log.log('ACT/Currency toggleCurrencyVisibility called')

        try {
            await currencyDS.updateCurrency({
                key: {
                    currency_code: currencyCode
                },
                updateObj: {
                    is_hidden: isHidden ? 0 : 1
                }
            })

            await setCurrencies()

        } catch (e) {
            Log.err('ACT/Currency toggleCurrencyVisibility error ' + e.message)
        }

        Log.log('ACT/Currency toggleCurrencyVisibility finished')

        setLoaderStatus(false)
    }

}

export default currencyActions
