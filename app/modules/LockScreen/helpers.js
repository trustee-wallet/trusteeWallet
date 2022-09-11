/**
 * @version 0.45
 */
import { deleteUserPinCode } from '@haskkor/react-native-pincode'
import TouchID from 'react-native-touch-id'
import { check, PERMISSIONS } from 'react-native-permissions'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import NavStore from '@app/components/navigation/NavStore'

import { SettingsKeystore } from '@app/appstores/Stores/Settings/SettingsKeystore'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { setBlurStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { LockScreenFlowTypes } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import Log from '@app/services/Log/Log'

export const finishProcess = async (lockScreenData, lockScreen) => {
    const { flowType, callback : actionCallback } = lockScreenData
    MarketingEvent.UI_DATA.IS_LOCKED = false

    setBlurStatus(false)
    UpdateOneByOneDaemon.unstop()
    UpdateAccountListDaemon.unstop()

    if (flowType === LockScreenFlowTypes.JUST_CALLBACK) {
        NavStore.goBack()
        setTimeout(() => {
            actionCallback(false)
        }, 500)
    } else if (flowType === LockScreenFlowTypes.INIT_POPUP) {
        NavStore.reset('TabBar')
    } else if (flowType === LockScreenFlowTypes.MNEMONIC_CALLBACK) {
        NavStore.goBack()
        setTimeout(() => {
            actionCallback(false)
        }, 500)
    } else if (flowType === LockScreenFlowTypes.PUSH_POPUP_CALLBACK) {
        actionCallback(false)
    } else if (flowType === LockScreenFlowTypes.CREATE_PINCODE) {
        await SettingsKeystore.setAskPinCodeWhenSending('1')
        await SettingsKeystore.setLockScreenStatus('1')
        await settingsActions.getSettings(true)
        NavStore.goBack()
    } else if (flowType === LockScreenFlowTypes.DELETE_PINCODE) {
        await SettingsKeystore.setLockScreenStatus('0')
        await deleteUserPinCode('reactNativePinCode')
        await settingsActions.getSettings(true)
        NavStore.goBack()
    } else if (flowType === LockScreenFlowTypes.CHANGE_TOUCHID_STATUS) {
        const touchIDStatus = await SettingsKeystore.getTouchIDStatus()
        await SettingsKeystore.setTouchIDStatus(touchIDStatus === '0' ? '1' : '0')
        await settingsActions.getSettings(true)
        NavStore.goBack()
    } else if (flowType === LockScreenFlowTypes.CHANGE_ASKING_STATUS) {
        const askPinCodeWhenSending = await SettingsKeystore.getAskPinCodeWhenSending()
        await SettingsKeystore.setAskPinCodeWhenSending(askPinCodeWhenSending === '0' ? '1' : '0')
        await settingsActions.getSettings(true)
        NavStore.goBack()
    } else if (flowType === LockScreenFlowTypes.CHANGE_PINCODE_FIRST_STEP) {
        if (lockScreen.state.passwordState === 'choose') {
            // pincode changed
            NavStore.goBack()
        } else {
            lockScreen.setState({
                passwordState: 'choose'
            })
        }
    } else {
        NavStore.reset('TabBar')
    }
}

export const biometricActions = {
    checkBiometryType: async () => {
        let result = false
        try {
            result = await TouchID.isSupported()
            Log.log('LockScreen.helper.checkBiometryType result: ' + result)
        } catch (error) {
            Log.log('LockScreen.helper.checkBiometryType error: ' + error.message)
        }

        return result
    },

    checkBiometricPermission: async () => {
        let result = false
        try {
            result = await check(PERMISSIONS.IOS.FACE_ID)
            Log.log('LockScreen.helper.checkBiometricPermission IOS.FACE_ID result ' + result)
        } catch (error) {
            Log.log('LockScreen.helper.checkBiometricPermission error ' + error.message)
        }
        return result
    },

}
