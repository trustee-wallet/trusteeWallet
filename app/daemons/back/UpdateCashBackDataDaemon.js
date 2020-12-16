/**
 * @version 0.31
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
        const authHash = await cryptoWalletsDS.getSelectedWallet()
        if (!authHash) {
            Log.daemon('UpdateCashBackDataDaemon skipped as no auth')
            this._canUpdate = true
            return false
        }

        Log.daemon('UpdateCashBackDataDaemon called')
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
        try {
            Log.daemon('UpdateCashBackDataDaemon result ', data)
            data.time = new Date().getTime()
            data.authHash = authHash
            await CashBackUtils.setCashBackDataFromApi(data)
        } catch (e) {
            this._canUpdate = true
            Log.err('UpdateCashBackDataDaemon result error ' + e.message)
        }
        this._canUpdate = true
    }

}

export default new UpdateCashBackDataDaemon
