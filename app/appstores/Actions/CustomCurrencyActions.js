/**
 * @version 0.9
 */
import customCurrencyDS from '../DataSource/CustomCurrency/CustomCurrency'

import { setLoaderStatus } from '../Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import BlocksoftTokenChecks from '../../../crypto/actions/BlocksoftTokenChecks/BlocksoftTokenChecks'
import Database from '@app/appstores/DataSource/Database/main'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

const customCurrencyActions = {
    /**
     * @param {Object} currencyToAdd
     * @param {string} currencyToAdd.tokenType
     * @param {string} currencyToAdd.tokenAddress
     * @param {boolean} isLoader
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: *, description: *, tokenType: string, currencyCode: *}|boolean>}
     */
    checkCustomCurrency: async (currencyToAdd, isLoader = 1) => {
        if (typeof (currencyToAdd.tokenType) === 'undefined') {
            throw new Error('set tokenType')
        }
        if (typeof (currencyToAdd.tokenAddress) === 'undefined') {
            throw new Error('set tokenAddress')
        }
        Log.log('ACT/CustomCurrency checkCustomCurrency started ' + currencyToAdd.tokenType + ' ' + currencyToAdd.tokenAddress)
        let res = false
        try {
            res = await BlocksoftTokenChecks.getTokenDetails(currencyToAdd)
            Log.log('ACT/CustomCurrency checkCustomCurrency finished ', JSON.stringify(res))
        } catch (e) {
            Log.log('ACT/CustomCurrency checkCustomCurrency error ' + e.message)
            if (e.message.indexOf('SSL') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_SSL')
            }
        }
        return res
    },

    /**
     * @param {Object} currencyToAdd
     * @param {string} currencyToAdd.currencyCode
     * @param {string} currencyToAdd.currencyName
     * @param {string} currencyToAdd.tokenType
     * @param {string} currencyToAdd.tokenAddress
     * @param {int} currencyToAdd.tokenDecimals
     * @param {boolean} isLoader
     * @returns {Promise<void>}
     */
    addCustomCurrency: async (currencyToAdd, isLoader = 1) => {
        if (typeof (currencyToAdd.tokenType) === 'undefined') {
            throw new Error('set tokenType')
        }
        if (typeof (currencyToAdd.currencyCode) === 'undefined') {
            throw new Error('set currencyCode')
        }
        if (typeof (currencyToAdd.currencyName) === 'undefined') {
            throw new Error('set currencyName')
        }
        if (typeof (currencyToAdd.tokenAddress) === 'undefined') {
            throw new Error('set tokenAddress')
        }
        if (typeof (currencyToAdd.tokenDecimals) === 'undefined') {
            throw new Error('set tokenDecimals')
        }
        isLoader ? setLoaderStatus(true) : null

        Log.log('ACT/CustomCurrency addCustomCurrency started')

        try {

            const currencyInsertObjs = {
                currencyCode: currencyToAdd.currencyCode,
                currencySymbol: currencyToAdd.currencyCode,
                currencyName: currencyToAdd.currencyName,
                tokenType: currencyToAdd.tokenType,
                tokenAddress: currencyToAdd.tokenAddress,
                tokenDecimals: currencyToAdd.tokenDecimals,
                tokenJson: '',
                isAddedToApi : 0,
                isHidden: 0
            }

            await customCurrencyDS.insertCustomCurrency({ insertObjs: [currencyInsertObjs] })

            Log.log('ACT/Currency addCurrency finished')
        } catch (e) {
            e.message += ' currencyToAdd = ' + JSON.stringify(currencyToAdd)
            Log.err('ACT/CustomCurrency addCustomCurrency error ' + e.message)
        }

        setLoaderStatus(false)
    },

    replaceCustomCurrencyFromDict: async (tokenAddress, newToken) => {
        const sql = `
                UPDATE custom_currency 
                SET token_address='${newToken.tokenAddress}', token_decimals=${newToken.tokenDecimals}
                WHERE token_address IN('${tokenAddress}')
                `
        await Database.query(sql)
        await customCurrencyDS.getCustomCurrencies()
    },

    importCustomCurrenciesToDict: async () => {
        const res = await customCurrencyDS.getCustomCurrencies()
        if (!res) return false

        const tokenToDict = {}
        for (const code in BlocksoftDict.Currencies) {
            if (code.indexOf('CUSTOM_') === 0) continue
            const added = BlocksoftDict.Currencies[code]
            if (typeof added.tokenAddress !== 'undefined' && added.tokenAddress) {
                tokenToDict[added.tokenAddress] = added
            } else if (typeof added.tokenName !== 'undefined' && added.tokenName) {
                tokenToDict[added.tokenName] = added
            }
        }


        for (const currencyObject of res) {
            if (typeof tokenToDict[currencyObject.tokenAddress] !== 'undefined') {
                const preparedCustom = BlocksoftDict.addAndUnifyCustomCurrency(currencyObject)
                const foundNotCustom = tokenToDict[currencyObject.tokenAddress]
                const currency = await Database.query(`
                SELECT currency_code AS currencyCode, is_hidden AS isHidden FROM currency
                WHERE currency_code IN('${preparedCustom.currencyCode}', '${foundNotCustom.currencyCode}')
                `)
                let recheckedFoundCurrency = false
                let recheckedCustomCurrency = false
                await Database.query(`DELETE FROM currency WHERE currency_code='${preparedCustom.currencyCode}'`)
                if (currency.array) {
                    for (const recheck of currency.array) {
                        if (recheck.currencyCode === foundNotCustom.currencyCode) {
                            recheckedFoundCurrency = recheck
                        } else if (recheck.currencyCode === preparedCustom.currencyCode) {
                            recheckedCustomCurrency = recheck
                        }
                    }

                    if (recheckedCustomCurrency && recheckedFoundCurrency) {
                        if (recheckedCustomCurrency.isHidden === recheckedFoundCurrency.isHidden) {
                            // do nothing
                        } else {
                            await Database.query(`UPDATE currency SET is_hidden=0 WHERE currency_code='${foundNotCustom.currencyCode}'`)
                        }
                    }
                    if (!recheckedFoundCurrency) {
                        await currencyActions.addCurrency({ currencyCode: foundNotCustom.currencyCode }, 0, 0)
                    }
                }
                await Database.query(`DELETE FROM custom_currency WHERE id=${currencyObject.id}`)
            } else {
                BlocksoftDict.addAndUnifyCustomCurrency(currencyObject)
            }
        }
    }

}

export default customCurrencyActions
