/**
 * @version 0.41
 */
import {
    isFioAddressValid,
    isFioAddressRegistered,
    resolveChainCode,
    resolveChainToken,
    getPubAddress
} from '@crypto/blockchains/fio/FioUtils'
import { isUnstoppableAddressValid } from '@crypto/services/UnstoppableUtils'

import Resolution, { ResolutionError, ResolutionErrorCode } from '@unstoppabledomains/resolution'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import Log from '@app/services/Log/Log'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'
import store from '@app/store'


const translateResolutionError = (domain : string, errorCode : ResolutionErrorCode, ticker : string) => {
    switch(errorCode) {
        case ResolutionErrorCode.UnregisteredDomain:
        case ResolutionErrorCode.RecordNotFound:
        case ResolutionErrorCode.UnspecifiedResolver: {
            const tkey = `validator.unstoppableErrors.${errorCode}`
            return strings(tkey, {domain, ticker})
        }
        default: {
            return errorCode
        }
    }
}

export namespace SendActionsContactBook {

    let DOMAIN_RESOLUTION = false

    export const getContactAddressUnstoppable  = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {
        if (!isUnstoppableAddressValid(data.addressName)) {
            return false
        }

        if (DOMAIN_RESOLUTION === false) {
            try {
                // @ts-ignore
                DOMAIN_RESOLUTION = new Resolution()
            } catch (e) {
                Log.log('SendActionsContactBook.getContactAddressUnstoppable init error' + e.message)
                return  false
            }
        }
        Log.log('SendActionsContactBook.getContactAddressUnstoppable checking ' + data.addressName)
        let address = false
        try {
            // @ts-ignore
            address = await DOMAIN_RESOLUTION.addr(data.addressName, data.currencyCode)
            Log.log('SendActionsContactBook.getContactAddressUnstoppable checked ' + address)
        } catch (err) {
            Log.log('SendActionsContactBook.getContactAddressUnstoppable error ' + err.message)
            if (err instanceof ResolutionError) {
                const errorMessage = translateResolutionError(data.addressName, err.code, data.currencyCode)
                throw new Error(errorMessage)
            } else {
                throw err
            }
        }
        return address
    }


    export const getContactAddress = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {

        let isUiError = false
        let uiError = ''
        try {
            const selectedWallets = store.getState().walletStore.wallets
            for (const selectedWallet of selectedWallets) {
                if (selectedWallet.walletName.toLowerCase() === data.addressName.toLowerCase()) {
                    const selectedAccounts = store.getState().accountStore.accountList
                    if (typeof selectedAccounts[selectedWallet.walletHash] !== 'undefined' && typeof selectedAccounts[selectedWallet.walletHash][data.currencyCode] !== 'undefined') {
                        return selectedAccounts[selectedWallet.walletHash][data.currencyCode].address
                    }
                }
            }
            if (!isFioAddressValid(data.addressName)) {
                return getContactAddressUnstoppable(data)
            }

            Log.log('SendActionsContactBook.getContactAddress isFioAddress checked ' + data.addressName)

            const currencyCode = data.currencyCode
            if (await isFioAddressRegistered(data.addressName)) {
                Log.log('SendActionsContactBook.getContactAddress isFioAddressRegistered checked ' + data.addressName)

                const extend = BlocksoftDict.getCurrencyAllSettings(data.currencyCode)
                const chainCode = resolveChainCode(currencyCode, extend.currencySymbol)
                const chainToken = resolveChainToken(currencyCode, extend)
                const publicFioAddress = await getPubAddress(data.addressName, chainCode, chainToken)
                Log.log('SendActionsContactBook.getContactAddress public for ' + data.addressName + ' ' + chainCode + ' =>' + publicFioAddress)
                if (!publicFioAddress || publicFioAddress === '0') {
                    uiError = strings('send.publicFioAddressNotFound', { symbol: currencyCode })
                    isUiError = true
                } else {
                    return publicFioAddress
                }
            } else {
                Log.log('SendActionsContactBook.getContactAddress isFioAddressRegistered no result ' + data.addressName)
                uiError = strings('send.publicFioAddressNotFound', { symbol: currencyCode })
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
