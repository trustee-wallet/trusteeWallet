import { Dispatch } from 'redux'

import walletDS from '../../DataSource/Wallet/Wallet'

import {
    HomeScreenActionTypes,
    SET_INPUT_EDITABLE,
    SET_NEW_WALLET_NAME
} from './Types'

import { setSelectedWallet } from '../Main/MainStoreActions'
import walletActions from '../Wallet/WalletActions'
import Toast from '../../../services/UI/Toast/Toast'
import { strings } from '../../../services/i18n'
import config from '../../../config/config'

export function setWalletName(walletName: string): HomeScreenActionTypes {
    return {
        type: SET_NEW_WALLET_NAME,
        payload: {
            walletName
        }
    }
}

export function setInputEditable(isEditable: boolean): HomeScreenActionTypes {
    return {
        type: SET_INPUT_EDITABLE,
        payload: {
            isEditable
        }
    }
}

export function saveNewWalletName(walletHash: string, newWalletName: string, oldWalletName: string) {
    return async (dispatch: Dispatch) => {
        try {

            let tmpNewWalletName = newWalletName.replace(/'/g, '')

            if(tmpNewWalletName === '' || tmpNewWalletName === oldWalletName) {
                dispatch(setWalletName(oldWalletName))
                dispatch(setInputEditable(false))
                return
            }

            if(tmpNewWalletName.length > 255) {
                tmpNewWalletName =  tmpNewWalletName.slice(0, 255)
            }

            await walletDS.updateWallet({walletHash, walletName : tmpNewWalletName})
            Toast.setMessage(strings('toast.saved')).show()
            await walletActions.setAvailableWallets()
            dispatch(setInputEditable(false))
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('HomeScreenActions.saveWalletName error ' + e.message)
            }
        }
    }
}
