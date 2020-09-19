/**
 * @version 0.11
 */
import appNewsDS from '../../../appstores/DataSource/AppNews/AppNews'

import App from '../../../appstores/Actions/App/App'
import WalletHDActions from '../../../appstores/Actions/WalletHDActions'

class AppTasksDiscoverHD {
    /**
     *
     * @param {string} appTask.walletHash
     * @param {string} appTask.currencyCode
     * @returns {Promise<void>}
     */
    run = async (appTask) => {
        let derivations = false
        try {
           derivations = await WalletHDActions.hdFromTrezor({walletHash : appTask.walletHash, force : false, currencyCode : appTask.currencyCode}, 'APP_TASK')
        } catch (e) {
            return e.message
        }
        await appNewsDS.saveAppNews({
            walletHash : appTask.walletHash,
            currencyCode : appTask.currencyCode,
            newsGroup : 'DAEMON',
            newsName : 'DAEMON_HAS_FOUND_HD'
        })

        await App.refreshWalletsStore({firstTimeCall : false, source : 'AppTasks discoverHD'})
        return ' there are derivations ' + JSON.stringify(derivations)

    }
}
export default new AppTasksDiscoverHD()
