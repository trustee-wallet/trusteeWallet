import { Linking, Platform } from 'react-native'
import { check, PERMISSIONS, request } from 'react-native-permissions'
import { showModal } from '../../appstores/Actions/ModalActions'
import { strings } from '../i18n'

export const checkQRPermission = async (callback) => {
    if (Platform.OS === 'android') {
        const res = await check(PERMISSIONS.ANDROID.CAMERA)

        console.log(res)

        if (res === 'blocked' || res === 'denied') {
            request(
                Platform.select({
                    android: PERMISSIONS.ANDROID.CAMERA
                })
            ).then((res) => {
                if (res !== 'denied') {
                    callback()
                }
            })
        } else {
            callback()
        }
    }

    if (Platform.OS === 'ios') {
        const res = await check(PERMISSIONS.IOS.CAMERA)


        if (res === 'denied') {
            request(
                Platform.select({
                    ios: PERMISSIONS.IOS.CAMERA
                })
            ).then((res) => {

                if (res === 'blocked') {
                    showModal({
                        type: 'OPEN_SETTINGS_MODAL',
                        icon: false,
                        title: strings('modal.openSettingsModal.title'),
                        description: strings('modal.openSettingsModal.description'),
                        btnSubmitText: strings('modal.openSettingsModal.btnSubmitText'),
                        btnCancelCallback: () => {
                        }
                    }, () => {
                        Linking.openURL('app-settings:')
                    })
                } else {
                    callback()
                }
            })
        } else if (res === 'blocked') {
            showModal({
                type: 'OPEN_SETTINGS_MODAL',
                icon: false,
                title: strings('modal.openSettingsModal.title'),
                description: strings('modal.openSettingsModal.description'),
                btnSubmitText: strings('modal.openSettingsModal.btnSubmitText'),
                btnCancelCallback: () => {
                }
            }, () => {
                Linking.openURL('app-settings:')
            })
        } else {
            callback()
        }
    }
}
