/**
 * @version 0.41
 */
import {
    isFioAddressValid,
    isFioAddressRegistered,
    resolveChainCode,
    getPubAddress
} from '@crypto/blockchains/fio/FioUtils'
import { isUnstoppableAddressValid } from '@crypto/services/UnstoppableUtils'

// import Resolution from '@unstoppabledomains/resolution'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import Log from '@app/services/Log/Log'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'
import store from '@app/store'




export namespace SendActionsContactBook {

    let DOMAIN_RESOLUTION = false

    export const getContactAddressUnstoppable  = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {
        if (!isUnstoppableAddressValid(data.addressName)) {
            return false
        }
        throw new Error('unstoppable domains not supported')
        /*
        uncomment to try
        if (DOMAIN_RESOLUTION === false) {
            try {
                // @ts-ignore
                DOMAIN_RESOLUTION = new Resolution()
            } catch (e) {
                console.log('SendActionsContactBook.getContactAddressUnstoppable init error' + e.message)
                return  false
            }
        }
        console.log('SendActionsContactBook.getContactAddressUnstoppable checking ' + data.addressName)
        let address = false
        try {
            // @ts-ignore
            address = await DOMAIN_RESOLUTION.addr(data.addressName, data.currencyCode)
            console.log('SendActionsContactBook.getContactAddressUnstoppable checked ' + address)
        } catch (e) {
            console.log('SendActionsContactBook.getContactAddressUnstoppable error ' + e.message)
        }
        return address
        */
    }


    export const getContactAddress = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {

        let isUiError = false
        let uiError = ''
        try {
            const selectedWallets = store.getState().walletStore.wallets
            for (const selectedWallet of selectedWallets) {
                if (selectedWallet.walletName.toLowerCase().indexOf(data.addressName.toLowerCase()) === 0) {
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
