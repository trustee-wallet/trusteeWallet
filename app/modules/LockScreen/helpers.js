/**
 * @version 0.43
 */
import { deleteUserPinCode } from '@haskkor/react-native-pincode'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import NavStore from '@app/components/navigation/NavStore'

import lockScreenAction from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { SettingsKeystore } from '@app/appstores/Stores/Settings/SettingsKeystore'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { setBlurStatus, setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

export const finishProcess = async (lockScreen) => {
    const { flowType, actionCallback, backData } = lockScreen
    MarketingEvent.UI_DATA.IS_LOCKED = false

    setBlurStatus(false)
    UpdateOneByOneDaemon.unstop()
    UpdateAccountListDaemon.unstop()

    if (flowType === 'WALLET_CONNECT') {
        lockScreenAction.setFlowType({
            flowType: ''
        })
        NavStore.reset('WalletConnectScreen', backData)
    } else if (flowType === 'JUST_CALLBACK') {
        setTimeout(() => {
            actionCallback(false)
            lockScreenAction.setFlowType({ flowType: '' })
            lockScreenAction.setActionCallback({ actionCallback: () => {} })
        }, 500)
    } else if (flowType === 'CREATE_PINCODE') {
        await SettingsKeystore.setAskPinCodeWhenSending('1')
        await SettingsKeystore.setLockScreenStatus('1')
        await settingsActions.getSettings(true)
        lockScreenAction.setFlowType({
            flowType: ''
        })
        // NavStore.reset('SettingsMainScreen')
        NavStore.goBack()
    } else if (flowType === 'DELETE_PINCODE') {
        await SettingsKeystore.setLockScreenStatus('0')
        await deleteUserPinCode('reactNativePinCode')
        await settingsActions.getSettings(true)
        lockScreenAction.setFlowType({
            flowType: ''
        })
        // NavStore.reset('SettingsMainScreen')
        NavStore.goBack()
    } else if (flowType === 'CHANGE_TOUCHID_STATUS') {
        const touchIDStatus = await SettingsKeystore.getTouchIDStatus()
        await SettingsKeystore.setTouchIDStatus(touchIDStatus === '0' ? '1' : '0')
        await settingsActions.getSettings(true)
        lockScreenAction.setFlowType({
            flowType: ''
        })
        // NavStore.reset('SettingsMainScreen')
        NavStore.goBack()
    } else if (flowType === 'CHANGE_ASKING_STATUS') {
        const askPinCodeWhenSending = await SettingsKeystore.getAskPinCodeWhenSending()
        await SettingsKeystore.setAskPinCodeWhenSending(askPinCodeWhenSending === '0' ? '1' : '0')
        await settingsActions.getSettings(true)
        lockScreenAction.setFlowType({
            flowType: ''
        })
        // NavStore.reset('SettingsMainScreen')
        NavStore.goBack()
    } else if (flowType === 'CHANGE_PASSWORD_FIRST_STEP') {
        this.setState({
            passwordState: 'choose'
        })
        lockScreenAction.setFlowType({
            flowType: ''
        })
    } else if (flowType ===  'CONFIRM_BACKUP_WALLET') {
        NavStore.goBack()
        setLoaderStatus(true)
        setTimeout(() => {
            actionCallback(false)
            lockScreenAction.setFlowType({ flowType: '' })
            lockScreenAction.setActionCallback({ actionCallback: () => {} })
        }, 50)
    } else if (flowType === 'CONFIRM_SEND_CRYPTO') {
        NavStore.goBack()
        setLoaderStatus(true)
        setTimeout(() => {
            actionCallback(false)
            lockScreenAction.setFlowType({ flowType: '' })
            lockScreenAction.setActionCallback({ actionCallback: () => {} })
        }, 500)
    } else if (flowType === 'CONFIRM_WALLET_PHRASE') {
        NavStore.goBack()
        setLoaderStatus(true)
        setTimeout(() => {
            actionCallback(false)
            lockScreenAction.setFlowType({ flowType: '' })
            lockScreenAction.setActionCallback({ actionCallback: () => {} })
        }, 500)
    } else if (flowType === 'REMOVE_WALLET_PHRASE') {
        NavStore.goBack()
        setLoaderStatus(true)
        setTimeout(() => {
            actionCallback(false)
            lockScreenAction.setFlowType({ flowType: '' })
            lockScreenAction.setActionCallback({ actionCallback: () => {} })
        }, 500)
    } else {
        NavStore.reset('TabBar')
    }
}
