/**
 * @version 0.43
 */

import store from '@app/store'

import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'

const { dispatch } = store

const homeAction = {
    setWalletName: (walletName) => {
        dispatch({
            type: 'SET_NEW_WALLET_NAME',
            walletName
        })
    },

    saveNewWalletName: async (walletHash, newWalletName, oldWalletName) => {
        try {

            let tmpNewWalletName = newWalletName.replace(/'/g, '')

            if (tmpNewWalletName === '' || tmpNewWalletName === oldWalletName) {
                homeAction.setWalletName(oldWalletName)
                return
            }

            if (tmpNewWalletName.length > 255) {
                tmpNewWalletName = tmpNewWalletName.slice(0, 255)
            }
            await walletActions.setNewWalletName(walletHash, tmpNewWalletName)

            Toast.setMessage(strings('toast.saved')).show()
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('HomeScreenActions.saveWalletName error ' + e.message)
            }
        }
    }
}

export default homeAction
