import store from '../../store'

const { dispatch } = store

import customCurrencyDS from '../DataSource/CustomCurrency/CustomCurrency'

import { setLoaderStatus } from './MainStoreActions'

import Log from '../../services/Log/Log'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftTokenChecks from '../../../crypto/actions/BlocksoftTokenChecks/BlocksoftTokenChecks'



const customCurrencyActions = {
    /**
     * @param {string} currencyToAdd.tokenType
     * @param {string} currencyToAdd.tokenAddress
     * @param {boolean} isLoader
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: *, description: *, tokenType: string, currencyCode: *}|boolean>}
     */
    checkCustomCurrency: async (currencyToAdd, isLoader = 1) => {
        if (typeof (currencyToAdd.tokenType) === 'undefined') {
            throw new Error('set tokenType')
        }
        if (currencyToAdd.tokenType != 'ETH_ERC_20' && currencyToAdd.tokenType != 'TRX') {
            throw new Error('only ETH_ERC_20 or TRX tokenType is supported')
        }
        if (typeof(currencyToAdd.tokenAddress) === 'undefined') {
            throw new Error('set tokenAddress')
        }
        Log.log('ACT/CustomCurrency checkCustomCurrency started ' +  currencyToAdd.tokenType + ' ' + currencyToAdd.tokenAddress)
        let res = false
        try {
            BlocksoftTokenChecks.setTokenType(currencyToAdd.tokenType).setTokenAddress(currencyToAdd.tokenAddress)
            res = await BlocksoftTokenChecks.getTokenDetails()
            Log.log('ACT/CustomCurrency checkCustomCurrency finished ', JSON.stringify(res))
        } catch (e) {
            Log.err('ACT/CustomCurrency checkCustomCurrency error ' + e.message)
        }
        return res
    },
    /**
     * @param {string} currencyToAdd.currencyCode
     * @param {string} currencyToAdd.currencyName
     * @param {string} currencyToAdd.tokenType
     * @param {string} currencyToAdd.tokenAddress
     * @param {int} currencyToAdd.tokenDecimals
     * @param {boolean} isLoader
     * @returns {Promise<void>}
     */
    addCustomCurrency: async (currencyToAdd, isLoader = 1) => {
        if (typeof(currencyToAdd.tokenType) === 'undefined') {
            throw new Error('set tokenType')
        }
        if (currencyToAdd.tokenType != 'ETH_ERC_20' && currencyToAdd.tokenType != 'TRX') {
            throw new Error('only ETH_ERC_20 or TRX tokenType is supported')
        }
        if (typeof(currencyToAdd.currencyCode) === 'undefined') {
            throw new Error('set currencyCode')
        }
        if (typeof(BlocksoftDict.Currencies[currencyToAdd.currencyCode]) !== 'undefined') {
            throw new Error('this currencyCode is already used')
        }
        if (typeof(currencyToAdd.currencyName) === 'undefined') {
            throw new Error('set currencyName')
        }
        if (typeof(currencyToAdd.tokenAddress) === 'undefined') {
            throw new Error('set tokenAddress')
        }
        if (typeof(currencyToAdd.tokenDecimals) === 'undefined') {
            throw new Error('set tokenDecimals')
        }
        isLoader ? setLoaderStatus(true) : null

        Log.log('ACT/CustomCurrency addCustomCurrency started')

        try {

            const currencyInsertObjs = {
                currency_code : currencyToAdd.currencyCode,
                currency_symbol : currencyToAdd.currencyCode,
                currency_name : currencyToAdd.currencyName,
                token_type : currencyToAdd.tokenType,
                token_address : currencyToAdd.tokenAddress,
                token_decimals : currencyToAdd.tokenDecimals,
                token_json : '',
                is_hidden: 0,
            }

            await customCurrencyDS.insertCustomCurrency({ insertObjs: [currencyInsertObjs] })

            Log.log('ACT/Currency addCurrency finished')
        } catch (e) {
            e.message += ' currencyToAdd = ' + JSON.stringify(currencyToAdd)
            Log.err('ACT/CustomCurrency addCustomCurrency error ' + e.message)
        }

        setLoaderStatus(false)
    },

    importCustomCurrenciesToDict: async () => {
        let res = await customCurrencyDS.getCustomCurrencies()
        if (!res || !res.array || !res.array.length) return false

        for (let currencyObject of res.array) {
            BlocksoftDict.addAndUnifyCustomCurrency(currencyObject)
        }
    }

}

export default customCurrencyActions
