/**
 * @version 0.11
 */
import ImagePicker from 'react-native-image-picker'
import { QRreader } from 'react-native-qr-scanner'
import Log from '../../Log/Log'

export function openQrGallery() {
    Log.log('QrGallery inited')

    return new Promise((resolve, reject) => {
        ImagePicker.launchImageLibrary({}, (response) => {
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
                Log.log('QrGallery path', path)

                QRreader(path).then((data) => {
                    Log.log('QrGallery reader data ' + data)
                    resolve({data})
                }).catch((e) => {
                    Log.log('QrGallery reader error ' + e.message)
                    resolve(false)
                })
            } else {
                Log.log('QrGallery no response')
                resolve(false)
            }

        })
    })
}
