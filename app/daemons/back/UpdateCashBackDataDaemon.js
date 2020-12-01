/**
 * @version 0.11
 */
import Log from '../../services/Log/Log'
import Api from '../../services/Api/Api'
import CashBackActions from '../../appstores/Stores/CashBack/CashBackActions'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'

class UpdateCashBackDataDaemon {

    _canUpdate = true

    /**
     * @return {Promise<void>}
     */
    updateCashBackDataDaemon = async () => {
        if (!this._canUpdate) return false

        this._canUpdate = false
        Log.daemon('UpdateCashBackDataDaemon called')

        const authHash = await cryptoWalletsDS.getSelectedWallet()
        if (!authHash) {
            Log.daemon('UpdateCashBackDataDaemon skipped as no auth')
            return false
        }
        let data = false
        try {
            data = await Api.getCashbackData()
        } catch (e) {
            await CashBackActions.setCashBackError({
                title: e.message,
                time: new Date().getTime()
            })
            this._canUpdate = true
            return
        }
        Log.daemon('updateCashBackDataDaemon result ', data)
        data.time = new Date().getTime()
        data.authHash = authHash
        await CashBackUtils.setCashBackDataFromApi(data)
        this._canUpdate = true
    }

}

export default new UpdateCashBackDataDaemon
