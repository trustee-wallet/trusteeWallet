/**
 * @version 0.50
 */

import walletActions from "@app/appstores/Stores/Wallet/WalletActions"
import NavStore from "@app/components/navigation/NavStore"
import UpdateAccountListDaemon from "@app/daemons/view/UpdateAccountListDaemon"
import Log from "@app/services/Log/Log"
import { setLoaderStatus } from "@app/appstores/Stores/Main/MainStoreActions"
import { showModal } from "@app/appstores/Stores/Modal/ModalActions"
import { strings } from "@app/services/i18n"
import { setFlowType, setWalletName } from "@app/appstores/Stores/CreateWallet/CreateWalletActions"


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
        code: 'fr-FR'
    },
    {
        code: 'ka-GE'
    },
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

export const handleBackUpModal = (props) => {

    const { walletName } = props

    showModal({
        type: 'YES_NO_MODAL',
        title: strings('settings.walletList.backupModal.title'),
        icon: 'WARNING',
        description: strings('settings.walletList.backupModal.description', { walletName }),
        oneButton: strings('settings.walletList.backupModal.save'),
        twoButton: strings('settings.walletList.backupModal.late'),
        noCallback: () => {
            handleBackup(props)
        }
    }, () => {})
}

export const handleBackup = async (props) => {
    const { walletNumber, walletHash } = props
    setFlowType({ flowType: 'BACKUP_WALLET', walletHash, walletNumber, source : 'WalletListScreen' })
    setWalletName({ walletName: props.walletName })

    NavStore.goNext('BackupStep0Screen', { flowSubtype: 'backup' })
}

