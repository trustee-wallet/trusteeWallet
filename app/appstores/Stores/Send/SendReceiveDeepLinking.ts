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


const onSuccess = async (param: any, qrCodeScannerConfig: any) => {
    try {
        // UpdateOneByOneDaemon.unpause()
        // UpdateOneByOneDaemon.unstop()
        await finishProcess(param, qrCodeScannerConfig)
    } catch (e) {
        Log.err('SendReceiveDeepLinking.onSuccess error ' + e.message)
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

const openUrl = (url: string, sourse: string) => {

    if (config.debug.appErrors) {
        console.log('SendReceiveDeepLinking ' + url)
    }
    if (url != null) {
        let tmpUrl: any = url.split('symbol')
        
        if(tmpUrl.length === 2){
            tmpUrl = tmpUrl[0].slice(0, -1)
        }

        if(Array.isArray(tmpUrl)){
            tmpUrl = tmpUrl[0]
        }

        const qrCodeScannerConfig = {
            currencyCode: false,
            flowType: 'MAIN_SCANNER',
            callback: false
        }

        const param = {
            data: tmpUrl,
        }
        onSuccess(param, qrCodeScannerConfig)
    }
}

export namespace SendReceiveDeepLinking {
    export const receiveDeepLink = (url: any) => { // actually copying SendDeepLinking.ts functions
        
        Log.log("SendReceiveDeepLinking.receiveDeepLink url " + url)

        if (url) {
            openUrl(url, 'DeepLinking eventListenter url')
            return   
        }

        Linking.getInitialURL()
            .then((url: any) => {
                openUrl(url, 'DeepLinking Init app')
            })
            .catch(error => {
            Log.err("SendReceiveDeepLinking.Linking.getInitialURL error " + error)
        })
    }
}