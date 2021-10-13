/**
 * @version 0.31
 * @author ksu
 */
import { check, PERMISSIONS, request } from 'react-native-permissions'
import { Linking, Platform } from 'react-native'
import Log from '../Log/Log'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { strings } from '../i18n'
import { showModal, hideModal } from '../../appstores/Stores/Modal/ModalActions'
import { FileSystem } from '../FileSystem/FileSystem'


const imagePickerOptions = {
    title: 'Select Avatar',
    customButtons: [{ name: '', title: '' }]
    // storageOptions: {
    //     cameraRoll: true
    // },
}

const requestCameraOn = async (source: string): Promise<boolean> => {
    Log.log(source + ' requestCameraOn started')
    return new Promise((resolve) => {
        request(
            // @ts-ignore
            Platform.select({
                android: PERMISSIONS.ANDROID.CAMERA,
                ios: PERMISSIONS.IOS.CAMERA
            })
        ).then((res) => {
            Log.log(source + ' requestCameraOn result', res)
            return resolve(res !== 'blocked')
        })
    })
}

const requestGalleryOn = async (source: string): Promise<boolean> => {
    Log.log(source + ' requestGalleryOn started')
    return new Promise((resolve) => {
        request(
            // @ts-ignore
            Platform.select({
                android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                ios: PERMISSIONS.IOS.PHOTO_LIBRARY
            })
        ).then((res) => {
            Log.log(source + ' requestGalleryOn result', res)
            return resolve(res !== 'blocked')
        })
    })
}

const getCameraPhoto = async (source: string): Promise<any> => {
    Log.log(source + ' getCameraPhoto started')
    return new Promise((resolve) => {
        launchCamera(imagePickerOptions, (res) => {
                Log.log(source + ' getCameraPhoto result', res)
                resolve(res)
            }
        )
    })
}

const getGalleryPhoto = async (source: string): Promise<any> => {
    Log.log(source + ' getGalleryPhoto started')
    return new Promise((resolve) => {
        launchImageLibrary({mediaType: 'photo'}, (res) => {
                Log.log(source + ' getGalleryPhoto result', res)
                resolve(res)
            }
        )
    })
}


export namespace Camera {

    export const checkCameraOn = async (source: string): Promise<boolean> => {

        Log.log(source + ' checkCameraOn started')
        const res = await check(Platform.OS !== 'ios' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA)
        Log.log(source + ' checkCameraOn result', res)

        if (Platform.OS !== 'ios') {
            if (res !== 'blocked' && res !== 'denied' ) {
                return true
            }
        } else {
            if (res !== 'blocked') {
                return true
            }
        }

        showModal({
            type: 'OPEN_SETTINGS_MODAL',
            icon: false,
            title: strings('modal.openSettingsModal.title'),
            description: strings('modal.openSettingsModal.description'),
            btnSubmitText: strings('modal.openSettingsModal.btnSubmitText')
        }, () => {
            Platform.OS !== 'ios' ? Linking.openSettings() : Linking.openURL('app-settings:')
            hideModal()

        })
        return false

    }

    export const openCameraOrGallery = async (source: string, onlyGallery : boolean = false): Promise<any> => {
        let response
        if (!onlyGallery && await requestCameraOn(source)) {
            response = await getCameraPhoto(source)
        }
        if (typeof response === 'undefined' || typeof response.error !== 'undefined' || response.didCancel || typeof response.errorCode !== 'undefined') {
            response = await getGalleryPhoto(source)

            if (typeof response.error !== 'undefined' && response.error) {
                Log.log(source + ' getGalleryPhoto error ', response)
                if (response.error.indexOf('open failed') !== -1) {
                    await requestGalleryOn(source)
                }
            }
        }

        let path = typeof response.uri !== 'undefined' ? response.uri : typeof response.path !== 'undefined' ? response.path : ''
        if (path) {
            if (Platform.OS === 'ios') {
                path = path.substring(path.indexOf('/Documents'))
            }
            // @ts-ignore
            const fs = new FileSystem({})
            const base64 = await fs.handleImageBase64(path)
            response.base64 = base64
            response.path = path
        } else {
            response.path = false
        }

        return response
    }
}
