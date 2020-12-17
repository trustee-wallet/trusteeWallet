import { check, PERMISSIONS, request } from 'react-native-permissions'
import { Linking, Platform } from 'react-native'
import Log from '../Log/Log'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import ImagePicker from 'react-native-image-picker'
import { strings } from '../i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import config from '../../config/config'
import { FileSystem } from '../FileSystem/FileSystem'


const imagePickerOptions = {
    title: 'Select Avatar',
    customButtons: [{ name: '', title: '' }]
    // storageOptions: {
    //     cameraRoll: true
    // },
}

const requestCameraOn = async (source: string): Promise<boolean> => {
    console.log(source + ' requestCameraOn started')
    return new Promise((resolve) => {
        request(
            // @ts-ignore
            Platform.select({
                android: PERMISSIONS.ANDROID.CAMERA,
                ios: PERMISSIONS.IOS.CAMERA
            })
        ).then((res) => {
            console.log(source + ' requestCameraOn result', res)
            return resolve(res !== 'blocked')
        })
    })
}

const requestGalleryOn = async (source: string): Promise<boolean> => {
    console.log(source + ' requestGalleryOn started')
    return new Promise((resolve) => {
        request(
            // @ts-ignore
            Platform.select({
                android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                ios: PERMISSIONS.IOS.PHOTO_LIBRARY
            })
        ).then((res) => {
            console.log(source + ' requestGalleryOn result', res)
            return resolve(res !== 'blocked')
        })
    })
}

const getCameraPhoto = async (source: string): Promise<any> => {
    console.log(source + ' getCameraPhoto started')
    return new Promise((resolve) => {
        ImagePicker.launchCamera(imagePickerOptions, (res) => {
                console.log(source + ' getCameraPhoto result', res)
                resolve(res)
            }
        )
    })
}

const getGalleryPhoto = async (source: string): Promise<any> => {
    console.log(source + ' getGalleryPhoto started')
    return new Promise((resolve) => {
        ImagePicker.launchImageLibrary({}, (res) => {
                console.log(source + ' getGalleryPhoto result', res)
                resolve(res)
            }
        )
    })
}


export namespace Camera {

    export const checkCameraOn = async (source: string): Promise<boolean> => {
        if (Platform.OS !== 'ios') return true // @todo android

        console.log(source + ' checkCameraOn started')
        const res = await check(PERMISSIONS.IOS.CAMERA)
        console.log(source + ' checkCameraOn result', res)
        if (res !== 'blocked') {
            return true
        }
        showModal({
            type: 'OPEN_SETTINGS_MODAL',
            icon: false,
            title: strings('modal.openSettingsModal.title'),
            description: strings('modal.openSettingsModal.description'),
            btnSubmitText: strings('modal.openSettingsModal.btnSubmitText')
        }, () => {
            Linking.openURL('app-settings:')
        })
        return false

    }

    export const openCameraOrGallery = async (source: string): Promise<any> => {
        let response
        if (await requestCameraOn(source)) {
            response = await getCameraPhoto(source)
        }
        if (typeof response === 'undefined' || typeof response.error !== 'undefined') {
            response = await getGalleryPhoto(source)

            if (typeof response.error !== 'undefined' && response.error) {
                console.log(source + ' getGalleryPhoto error ' + response)
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