/**
 * @author Roman
 * added for Roman just to see how it works -
 */
import { Linking } from 'react-native'
import Log from '@app/services/Log/Log'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
// import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import { finishProcess } from '@app/modules/QRCodeScanner/helpers'
import config from '@app/config/config'

let CACHE_NOT_USED_URL = true

const onSuccess = async (param, qrCodeScannerConfig) => {
    try {
        // UpdateOneByOneDaemon.unpause()
        // UpdateOneByOneDaemon.unstop()
        await finishProcess(param, qrCodeScannerConfig)
    } catch (e) {
        Log.err('QRCodeScanner.onSuccess error ' + e.message)
        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('modal.exchange.sorry'),
            description: strings('tradeScreen.modalError.serviceUnavailable')
        }, () => {
            NavStore.goBack()
        })
    }
}

export namespace SendReceiveDeepLinking {
    export const receiveDeepLink = () => { // actually copying SendDeepLinking.ts functions
        Linking.getInitialURL()
            .then(url => {
                if (config.debug.appErrors) {
                    console.log('SendReceiveDeepLinking ' + url)
                }
                if (url != null && CACHE_NOT_USED_URL !== url) {
                    const qrCodeScannerConfig = {
                        currencyCode: false,
                        flowType: 'MAIN_SCANNER',
                        callback: false
                    }
                    const param = {
                        data: url,
                    }
                    url = null
                    onSuccess(param, qrCodeScannerConfig)
                    CACHE_NOT_USED_URL = url + ''
                }
            }).catch(error => {
            Log.err("Hmmm, error in deep link: " + error)
        })
    }
}
