/**
 * @version 0.50
 */

import walletActions from "@app/appstores/Stores/Wallet/WalletActions"
import NavStore from "@app/components/navigation/NavStore"
import UpdateAccountListDaemon from "@app/daemons/view/UpdateAccountListDaemon"
import Log from "@app/services/Log/Log"
import { setLoaderStatus } from "@app/appstores/Stores/Main/MainStoreActions"


export const LANGUAGE_SETTINGS = [
    {
        code: 'en-US'
    },
    {
        code: 'ru-RU'
    },
    {
        code: 'uk-UA'
    },
    {
        code: 'ka-GE'
    }
]

export async function deleteWallet(walletHash, source, goBack) {
    setLoaderStatus(true)
    try {
        await walletActions.removeWallet(walletHash)
        await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, source })

        if (goBack) {
            NavStore.goBack()
            NavStore.goBack()
        } else {
            NavStore.goBack()
        }

        setLoaderStatus(false)
    } catch (e) {
        Log.log('WalletManagement.Advances helper deleteWallet error ' + e.message)
        setLoaderStatus(false)
    }
}

