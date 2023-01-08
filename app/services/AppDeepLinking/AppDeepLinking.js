/**
 * @version 0.53
 * @author yura
 */

import { Linking } from 'react-native'

import config from '@app/config/config'
import NavStore from '@app/components/navigation/NavStore'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import { finishProcess } from '@app/modules/QRCodeScanner/helpers'

import Log from '../Log/Log'

export default new class AppDeepLinking {

    init = () => {
        Linking.addEventListener('url', this.handler)
    }

    handler = ({ url }) => {
        this.receiveDeepLink(url)
    }

    willUnmount = () => {
        Linking.removeEventListener('url', this.handler)
    }

    receiveDeepLink = url => {
        // actually copying SendDeepLinking.ts functions

        Log.log('AppDeepLinking.receiveDeepLink url ' + url)

        if (url) {
            this.openUrl(url, 'DeepLinking eventListenter url')
            return
        }

        Linking.getInitialURL()
            .then(url => {
                this.openUrl(url, 'DeepLinking Init app')
            })
            .catch(error => {
                Log.err('AppDeepLinking.Linking.getInitialURL error ' + error)
            })
    }

    onSuccess = async (param, qrCodeScannerConfig) => {
        try {
            await finishProcess(param, qrCodeScannerConfig)
        } catch (e) {
            Log.err('AppDeepLinking.onSuccess error ' + e.message)
            showModal(
                {
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: strings('tradeScreen.modalError.serviceUnavailable')
                },
                () => {
                    NavStore.goBack()
                }
            )
        }
    }

    openUrl = (url, source) => {
        if (config.debug.appErrors) {
            console.log('AppDeepLinking openUrl url ' + url + ' source ' + source)
        }
        Log.log('AppDeepLinking openUrl source ' + source)
        if (url != null) {
            let tmpUrl = url.split('symbol')

            if (tmpUrl.length === 2) {
                tmpUrl = tmpUrl[0].slice(0, -1)
            }

            if (Array.isArray(tmpUrl)) {
                tmpUrl = tmpUrl[0]
            }

            const qrCodeScannerConfig = {
                currencyCode: false,
                flowType: 'MAIN_SCANNER',
                callback: false
            }

            const param = {
                data: tmpUrl
            }
            this.onSuccess(param, qrCodeScannerConfig)
        }
    }
}()
