import { Linking } from 'react-native'
import Log from '@app/services/Log/Log'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
// import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import { finishProcess } from '@app/modules/QRCodeScanner/helpers'

let notUsedURL = true

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

const receiveDeepLink = () => {

    Linking.getInitialURL()
        .then(url => {
            console.log("my URL" + url)
            if (url != null && notUsedURL) {
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
                notUsedURL = false
            }
        }).catch(error => {
            Log.err("Hmmm, error in deep link: " + error)
        })
}

export default receiveDeepLink