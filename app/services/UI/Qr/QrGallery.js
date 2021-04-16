/**
 * @version 0.11
 */
import { NativeModules } from 'react-native'

import { launchImageLibrary } from 'react-native-image-picker'
import Log from '../../Log/Log'

let { QRScanReader } = NativeModules

export function openQrGallery() {
    Log.log('QrGallery inited')

    if (typeof QRScanReader === 'undefined' || QRScanReader === null) {
        QRScanReader = NativeModules.QRScanReader
    }
    if (typeof QRScanReader === 'undefined' || QRScanReader === null) {
        QRScanReader = NativeModules.QRCode
    }
    if (typeof QRScanReader === 'undefined' || QRScanReader === null) {
        throw new Error('QrGallery no linked')
    }

    return new Promise((resolve, reject) => {
        launchImageLibrary({}, (response) => {
            if (response.didCancel) {
                Log.log('QrGallery User cancelled image picker')
                resolve(false)
            } else if (response.error) {
                Log.log('QrGallery ImagePicker Error ', response.error)
                resolve(false)
            } else if (response.customButton) {
                Log.log('QrGallery User tapped custom button ', response.customButton)
                resolve(false)
            } else if (response) {
                let path = response.path
                if (!path) {
                    path = response.uri
                }
                if (!path) {
                    Log.log('QrGallery no path')
                    return false
                }
                Log.log('QrGallery path ' + path)

                try {

                    QRScanReader.readerQR(path).then((data) => {
                        Log.log('QrGallery reader data ' + data)
                        resolve({ data })
                    }).catch((e) => {
                        Log.log('QrGallery reader error ' + e.message)
                        if (e.message.toString() === 'NOT_FOUND') {
                            reject(new Error(e.message))
                        }
                        resolve(false)
                    })
                } catch (e) {
                    reject(e)
                }
            } else {
                Log.log('QrGallery no response')
                resolve(false)
            }

        })
    })
}
