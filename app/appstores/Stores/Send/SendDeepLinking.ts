/**
 * @version 0.30
 */
import { Linking } from 'react-native'
import Log from '../../../services/Log/Log'

import { decodeTransactionQrCode } from '../../../services/UI/Qr/QrScan'
import { strings } from '../../../services/i18n'

import { SendActions } from './SendActions'

const NativeLinking = require('../../../../node_modules/react-native/Libraries/Linking/NativeLinking').default

export namespace SendDeepLinking {
    let ALREADY_INITED = false

    export const init = function () : boolean {
        if (ALREADY_INITED) return false
        handleInitialURL(true, '')
        Linking.addEventListener('url', (data) => handleInitialURL(false, data.url))
        ALREADY_INITED = true
        return true
    }
    const handleInitialURL = async (needGetUrl : boolean, url : string) => {
        let initialURL = url

        try {
            if (needGetUrl) {
                initialURL = await NativeLinking.getInitialURL()
            }
        } catch (e) {
            Log.err('SendDeepLinking.handleInitialURL get error ' + e.message, initialURL)
            return
        }
        Log.log('SendDeepLinking.handleInitialURL get success', initialURL)

        if (typeof initialURL === 'undefined' || initialURL === null) return
        try {

            let type = initialURL.split('//')[1]

            if (typeof type === 'undefined') return

            const data = type.split('/')[1]
            type = type.split('/')[0]
            if (typeof data === 'undefined' || typeof type === 'undefined') return

            if (type === 'pay') {
                const res = await decodeTransactionQrCode({ data: data })
                if (typeof res.data === 'undefined') {
                    throw new Error('res.data is empty')
                }

                const parsed = res.data as {
                    needToDisable ?: boolean,
                    address : string,
                    amount : string | number,
                    currencyCode : string,
                    label : string
                }
                Log.log('SendDeepLinking.handleInitialURL decode parsed', parsed)

                if (initialURL.indexOf('trustee.page.link') === -1) {

                    SendActions.startSend({
                        gotoReceipt: typeof parsed.needToDisable !== 'undefined' && !!(+parsed.needToDisable),
                        addressTo : parsed.address,
                        amountPretty : parsed.amount ? parsed.toString() : '0',
                        currencyCode : parsed.currencyCode,
                        comment : parsed.label,
                        uiType : 'DEEP_LINKING'
                    })

                }
            }
        } catch (e) {
            Log.err('SendDeepLinking.handleInitialURL decode error ' + e.message)
            return
        }
        Log.log('SendDeepLinking.handleInitialURL decode success')
    }
}