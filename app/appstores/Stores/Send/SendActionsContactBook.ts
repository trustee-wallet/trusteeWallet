/**
 * @version 0.41
 */
import {
    isFioAddressValid,
    isFioAddressRegistered,
    resolveChainCode,
    getPubAddress
} from '@crypto/blockchains/fio/FioUtils'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import Log from '@app/services/Log/Log'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'


export namespace SendActionsContactBook {

    export const getContactAddress = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {

        let isUiError = false
        let uiError = ''
        try {
            if (!isFioAddressValid(data.addressName)) {
                return false
            }

            Log.log('SendActionsContactBook.getContactAddress isFioAddress checked ' + data.addressName)
            if (await isFioAddressRegistered(data.addressName)) {
                Log.log('SendActionsContactBook.getContactAddress isFioAddressRegistered checked ' + data.addressName)

                const extend = BlocksoftDict.getCurrencyAllSettings(data.currencyCode)
                const chainCode = resolveChainCode(data.currencyCode, extend.currencySymbol)
                const publicFioAddress = await getPubAddress(data.addressName, chainCode, extend.currencySymbol)
                Log.log('SendActionsContactBook.getContactAddress public for ' + data.addressName + ' ' + chainCode + ' =>' + publicFioAddress)
                if (!publicFioAddress || publicFioAddress === '0') {
                    uiError = strings('send.publicFioAddressNotFound', { symbol: data.currencyCode })
                    isUiError = true
                } else {
                    return publicFioAddress
                }
            } else {
                Log.log('SendActionsContactBook.getContactAddress isFioAddressRegistered no result ' + data.addressName)
                uiError = strings('send.publicFioAddressNotFound', { symbol: data.currencyCode })
                isUiError = true
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsContactBook.getContactAddress isFioAddress error ' + data.addressName + ' => ' + e.message)
            }
            Log.log('SendActionsContactBook.getContactAddress isFioAddress error ' + data.addressName + ' => ' + e.message)
        }
        if (isUiError) {
            throw new Error(uiError)
        }
        return false
    }
}
