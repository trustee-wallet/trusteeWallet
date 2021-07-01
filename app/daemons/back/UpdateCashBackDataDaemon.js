/**
 * @version 0.42
 */
import Log from '@app/services/Log/Log'

import cashBackActions from '@app/appstores/Stores/CashBack/CashBackActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import ApiProxy from '@app/services/Api/ApiProxy'

import config from '@app/config/config'
import { StreamSupportActions } from '@app/appstores/Stores/StreamSupport/StreamSupportStoreActions'

class UpdateCashBackDataDaemon {

    _canUpdate = true

    /**
     * @return {Promise<void>}
     */
    updateCashBackDataDaemon = async (params = {}, dataUpdate = false) => {
        if (!this._canUpdate) return false

        this._canUpdate = false

        let data = false
        let asked = false
        let cashbackToken = false
        if (!dataUpdate) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' UpdateCashBackDataDaemon loaded new')
            }
            asked = true
            try {
                data = await ApiProxy.getAll({ ...params, source: 'UpdateCashBackDataDaemon.updateCashBackData' })
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateCashBackDataDaemon error ' + e.message)
                }
                await cashBackActions.updateAll({ error : {
                    title: e.message,
                    time: new Date().getTime()
                }})
                this._canUpdate = true
                return
            }
        } else {
            data = dataUpdate
        }

        if (typeof data.cbChatToken !== 'undefined' && data.cbChatToken ) {
           StreamSupportActions.setData(data.cbChatToken)
        }

        let customToken = CashBackUtils.getWalletToken()
        try {
            if (typeof data.cbData !== 'undefined' && typeof data.cbData.data !== 'undefined') {
                if (typeof data.cashbackToken !== 'undefined') {
                    cashbackToken = data.cashbackToken // general cashback token of ask!!!!
                }
                data = data.cbData.data
                if (typeof data !== 'undefined' && typeof data.cashbackToken !== 'undefined') {
                    customToken = data.cashbackToken
                }
            } else {
                this._canUpdate = true
                return
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateCashBackDataDaemon error ' + e.message)
            }
            await cashBackActions.updateAll({error : {
                title: e.message,
                time: new Date().getTime()
            }})
            this._canUpdate = true
            return
        }

        if (!asked) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' UpdateCashBackDataDaemon loaded proxy')
            }
        }

        try {
            Log.daemon('UpdateCashBackDataDaemon result ', data)
            data.time = new Date().getTime()
            data.cashbackToken = cashbackToken
            data.customToken = typeof data.customToken !== 'undefined' && data.customToken ? data.customToken : customToken
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
