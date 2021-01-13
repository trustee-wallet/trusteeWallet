/**
 * @version 0.30
 */
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

export namespace SettingsKeystore {

    export const getLockScreenStatus = () => {
        return BlocksoftKeysStorage.getSettingValue('lockScreenStatus')
    }

    export const getAskPinCodeWhenSending = () => {
        return BlocksoftKeysStorage.getSettingValue('askPinCodeWhenSending')
    }

    export const getTouchIDStatus = () => {
        return BlocksoftKeysStorage.getSettingValue('touchIDStatus')
    }


    export const setLockScreenStatus = (val : string) => {
        return BlocksoftKeysStorage.setSettingValue('lockScreenStatus', val)
    }
    export const setAskPinCodeWhenSending = (val : string) => {
        return BlocksoftKeysStorage.setSettingValue('askPinCodeWhenSending', val)
    }
    export const setTouchIDStatus = (val : string) => {
        return BlocksoftKeysStorage.setSettingValue('touchIDStatus', val)
    }

}
