/**
 * @version 0.41
 */
import { Linking } from 'react-native'
import Log from '../../../services/Log/Log'

import { decodeTransactionQrCode } from '../../../services/UI/Qr/QrScan'
import { SendActionsStart } from './SendActionsStart'

const NativeLinking = require('../../../../node_modules/react-native/Libraries/Linking/NativeLinking').default


let CACHE_ALREADY_INITED = false
export namespace SendDeepLinking {

    export const initDeepLinking = function(): boolean {
        if (CACHE_ALREADY_INITED) return false
        handleInitialURL(true, '')
        Linking.addEventListener('url', (data) => handleInitialURL(false, data.url))
        CACHE_ALREADY_INITED = true
        return true
    }

    const handleInitialURL = async (needGetUrl: boolean, url: string) => {
        let initialURL = url

        try {
            if (needGetUrl) {
                initialURL = await NativeLinking.getInitialURL()
            }
        } catch (e) {
            Log.err('SendDeepLinking.handleInitialURL get error ' + e.message, initialURL)
            return
        }
        await Log.log('SendDeepLinking.handleInitialURL get success', initialURL)

        if (typeof initialURL === 'undefined' || initialURL === null) return
        try {

            let type = initialURL.split('//')[1]

            if (typeof type === 'undefined') return

            const data = type.split('/')[1]
            type = type.split('/')[0]
            if (typeof data === 'undefined' || typeof type === 'undefined') return

            if (type !== 'pay') return

            const res = await decodeTransactionQrCode({ data: data })
            if (typeof res.data === 'undefined') {
                throw new Error('res.data is empty')
            }

            const parsed = res.data as {
                needToDisable?: boolean,
                address: string,
                amount: string | number,
                currencyCode: string,
                label: string
            }
            await Log.log('SendDeepLinking.handleInitialURL decode parsed', parsed)

            if (initialURL.indexOf('trustee.page.link') !== -1) return

            await Log.log('SendDeepLinking.handleInitialURL decode success and will go to Send')
            await SendActionsStart.startFromDeepLinking(parsed)

        } catch (e) {
            Log.err('SendDeepLinking.handleInitialURL decode error ' + e.message)
        }
    }
}
