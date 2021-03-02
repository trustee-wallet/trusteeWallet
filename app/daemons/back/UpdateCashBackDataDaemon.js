/**
 * @version 0.31
 */
import Log from '../../services/Log/Log'
import CashBackActions from '../../appstores/Stores/CashBack/CashBackActions'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'
import ApiProxy from '../../services/Api/ApiProxy'

import config from '../../config/config'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

class UpdateCashBackDataDaemon {

    _canUpdate = true

    /**
     * @return {Promise<void>}
     */
    updateCashBackDataDaemon = async (params = {}) => {
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
            data = await ApiProxy.getAll({...params, source: 'UpdateCashBackDataDaemon.updateCashBackData'})
            if (typeof data.cbData !== 'undefined' && typeof data.cbData.data !== 'undefined') {
                data = data.cbData.data
                if (typeof data !== 'undefined' && typeof data.cashbackToken !== 'undefined') {
                    MarketingEvent.DATA.LOG_CASHBACK = data.cashbackToken
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateCashBackDataDaemon error ' + e.message )
            }
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
            data.customToken = typeof data.customToken !== 'undefined' && data.customToken ? data.customToken : data.cashbackToken
            await CashBackUtils.setCashBackDataFromApi(data)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateCashBackDataDaemon result error ' + e.message )
            }
            this._canUpdate = true
            Log.err('UpdateCashBackDataDaemon result error ' + e.message)
        }
        this._canUpdate = true
    }

}

export default new UpdateCashBackDataDaemon
