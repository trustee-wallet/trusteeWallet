/**
 * @version 0.77
 */

import Log from '@app/services/Log/Log'
import { sublocale } from '@app/services/i18n'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import cashBackSettings from '@app/appstores/Stores/CashBack/CashBackSettings'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'


export default {

    activatePromo: async (promoCode) => {
        const signature = await CashBackUtils.createWalletSignature(true)
        if (!signature) {
            throw new Error('UI_ERROR_CASHBACK_SIGN_ERROR')
        }
        const cashbackToken = CashBackUtils.getWalletToken()
        const parentToken = CashBackUtils.getParentToken()
        const deviceToken = MarketingEvent.DATA.LOG_TOKEN
        const getStatisticsReqData = {
            deviceToken,
            locale: sublocale(),
            signedData: signature,
            timestamp: +new Date(),
            promoCode
        }
        if (typeof cashbackToken !== 'undefined' && cashbackToken !== null) {
            getStatisticsReqData.cashbackToken = cashbackToken
        }
        if (typeof parentToken !== 'undefined' && parentToken !== null && parentToken) {
            getStatisticsReqData.parentToken = parentToken
        }

        const link = `${cashBackSettings.getBase()}/activate-promo`
        let res
        let index = 0
        let serverTime = 0
        const MAX_TRY_SERVER_TIME = 4
        do {
            index++
            Log.daemon('Api activatePromo axios ' + index + ' ' + link)
            try {
                res = await BlocksoftAxios.post(link, getStatisticsReqData)
            } catch (e) {
                if (e.message.indexOf('checkforduplicate') !== -1) {
                    throw new Error('UI_ERROR_CASHBACK_PROMO_DUPLICATE')
                } else if (e.message.indexOf('no info about promo code')) {
                    throw new Error('UI_ERROR_CASHBACK_PROMO_NOT_FOUND')
                } else {
                    Log.daemon('Api activatePromo error ' + cashbackToken + ' ' + promoCode + ' ' + e.message)
                }
            }
            if (!res || typeof res.data === 'undefined' || !res.data) {
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            }
            if (typeof res.data === 'string') {
                return res.data
            }
            if (typeof res.data.description === 'undefined' || !res.data.description) {
                Log.daemon('Api activatePromo error ', res.data)
                if (typeof res.data.serverTimestamp !== 'undefined' && res.data.serverTimestamp) {
                    serverTime = res.data.serverTimestamp
                    res = false
                    if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                        throw new Error('UI_ERROR_CASHBACK_TIME_ERROR')
                    } else {
                        Log.daemon('Api activatePromo will retry with time ' + serverTime)
                        getStatisticsReqData.signedData = await CashBackUtils.createWalletSignature(true, serverTime)
                    }
                } else {
                    throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
                }
            } else {
                // finish ok
                break
            }
        } while (index < MAX_TRY_SERVER_TIME)

        if (!res || typeof res.data === 'undefined' || !res.data) {
            throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
        }
        return res.data.description
    }

}
