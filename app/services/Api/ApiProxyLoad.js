import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'


import { sublocale } from '@app/services/i18n'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'
import config from '@app/config/config'
import ApiProxy from '@app/services/Api/ApiProxy'
import BlocksoftKeysForRef from '@crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'

export default {

    getSaved: async (walletHash, newWalletName = false) => {

        const { mode: exchangeMode } = config.exchange

        let deviceToken = MarketingEvent.DATA.LOG_TOKEN
        if (!deviceToken || deviceToken === null || deviceToken === '') {
            deviceToken = await AppNotificationListener.getToken()
        }
        if (!deviceToken || deviceToken === null || deviceToken === '') {
            deviceToken = 'NO_GOOGLE_AS_NULL_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
        }
        const link = config.proxy.apiEndpoints.baseURL + `/saved?exchangeMode=${exchangeMode}&uid=${deviceToken}`


        const { privateKey, address, cashbackToken } = await CashBackUtils.getByHash(walletHash, 'ApiProxyLoad')
        if (!privateKey) {
            return false
        }

        let signedData = true
        let msg = await ApiProxy.getServerTimestampIfNeeded()
        if (!msg) {
            msg = new Date().getTime()
        }

        signedData = await BlocksoftKeysForRef.signDataForApi(msg + '', privateKey)
        signedData.signedAddress = address

        const marketingAll = { ...MarketingEvent.DATA }
        marketingAll.LOG_CASHBACK = cashbackToken
        marketingAll.LOG_WALLET = walletHash

        const cbData = {
            deviceToken,
            cashbackToken,
            locale: sublocale(),
            signedData,
            timestamp: +new Date()
        }
        if (typeof marketingAll.LOG_PARENT !== 'undefined' && marketingAll.LOG_PARENT !== null && marketingAll.LOG_PARENT) {
            cbData.parentToken = marketingAll.LOG_PARENT
        }

        const allData = {
            cbData,
            marketingAll,
            wallet: {
                walletHash,
                newWalletName
            }
        }

        const all = await BlocksoftAxios.post(link, allData)
        return all.data.data
    }
}
