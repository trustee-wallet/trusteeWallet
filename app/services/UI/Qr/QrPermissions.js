/**
 * @version 0.9
 */
import { Linking, Platform } from 'react-native'
import { check, PERMISSIONS, request } from 'react-native-permissions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../i18n'
import Log from '../../Log/Log'

export const checkQRPermission = async (callback) => {
    if (Platform.OS === 'android') {
        let res
        try {
            res = await check(PERMISSIONS.ANDROID.CAMERA)
        } catch (e) {
            Log.log('SRV/QrPermissions warning ANDROID will be skipped ' + e.message)
        }

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
    } else if (Platform.OS === 'ios') {
        let res
        try {
            res = await check(PERMISSIONS.IOS.CAMERA)
        } catch (e) {
            Log.log('SRV/QrPermissions warning IOS will be skipped ' + e.message)
        }

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
    } else {
        Log.log('SRV/QrPermissions not valid OS ', Platform)
    }
}
