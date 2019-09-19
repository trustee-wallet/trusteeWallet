import store from '../../store'

const { dispatch } = store

import BlocksoftKeys from '../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import accountDS from '../DataSource/Account/Account'

import currencyDS from '../DataSource/Currency/Currency'

import accountBalanceDS from '../DataSource/AccountBalance/AccountBalance'

import walletDS from '../DataSource/Wallet/Wallet'

import { setCurrencies, setLoaderStatus } from './MainStoreActions'

import Log from '../../services/Log/Log'



const currencyActions = {

    addCurrency: async (currencyToAdd) => {

        setLoaderStatus(true)

        Log.log('ACT/Currency addCurrency started')

        let errorStepMsg = ''

        try {
            errorStepMsg = 'BlocksoftKeysStorage.getWallets started'

            let { array: wallets } = await walletDS.getWallets()

            let accountBalanceInsertObjs = []
            for (let wallet of wallets) {

                const wallet_hash = wallet.wallet_hash

                errorStepMsg = 'BlocksoftKeysStorage.getWalletMnemonic  started'

                let mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(wallet_hash)

                if (!mnemonic) {
                    throw new Error('No mnemonic found for ' + wallet_hash)
                }

                errorStepMsg = 'BlocksoftKeys.discoverAddresses started'
                const accounts = await BlocksoftKeys.discoverAddresses({
                    mnemonic,
                    fullTree: true,
                    fromIndex: 0,
                    toIndex: 1,
                    currencyCode: [currencyToAdd.currencyCode]
                })

                errorStepMsg = 'accountDS.insertAccounts started'
                const account = accounts[currencyToAdd.currencyCode][0]

                const accountInsertObjs = {
                    address: account.address,
                    name: '',
                    //TODO: fix this
                    derivation_path: account.path.replace(/[']/g, "quote"),
                    derivation_index: account.index,
                    derivation_type: account.type,
                    status: 0,
                    currency_code: currencyToAdd.currencyCode,
                    wallet_hash: wallet_hash,
                    account_json: '',
                    transactions_scan_time: 0
                }

                await accountDS.insertAccounts({ insertObjs: [accountInsertObjs] })

                const { array: dbAccounts } = await accountDS.getAccountsByWalletHashAndCurrencyCode(wallet_hash, currencyToAdd.currencyCode)

                const { id: insertID } = dbAccounts[0]

                accountBalanceInsertObjs.push({
                    balance: 0,
                    balance_scan_time: 0,
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
                is_hidden: 0
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

            Log.err('ACT/Currency addCurrency error', e)
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
            Log.err('ACT/Currency toggleCurrencyVisibility error', e)
        }

        Log.log('ACT/Currency toggleCurrencyVisibility finished')

        setLoaderStatus(false)
    }

}

export default currencyActions
