/**
 * @version 0.43
 */
import store from '@app/store'

import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import analytics from '@react-native-firebase/analytics'
import config from '@app/config/config'
import Log from '@app/services/Log/Log'

const TO_BADGE_TIME = 3600000 * 24 * 4

export default async () => {
    const appSpecialList = await appNewsDS.getSpecialNews()
    if (appSpecialList && appSpecialList.length > 0) {
        const ids = []
        for (const item of appSpecialList) {
            ids.push(item.id)
            try {
                // https://rnfirebase.io/reference/analytics#logPurchase
                /*
                if (item.newsJson && typeof item.newsJson.googleEvent !== 'undefined' && item.newsJson.googleEvent && typeof item.newsJson.googleEvent.eventCode !== 'undefined') {
                    await MarketingEvent.logEvent(item.newsJson.googleEvent.eventCode, item.newsJson.googleEvent.params, 'GX')
                    if (typeof item.newsJson.googleEvent.eCommerceParams !== 'undefined') {
                        await analytics().logPurchase(item.newsJson.googleEvent.eCommerceParams)
                    }
                }
                */
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('v20_log_purchase2 error ' + e.message, item.newsJson.googleEvent)
                }
                await Log.err('v20_log_purchase2 error ' + e.message)
            }
        }
        await appNewsDS.markAllAsOpened(ids)
    }
    const appNewsList = await appNewsDS.getAppNews()

    store.dispatch({
        type: 'SET_APP_NEWS_LIST',
        appNewsList: appNewsList || []
    })

    if (appNewsList && appNewsList.length > 0) {
        const toShow = []
        const now = new Date().getTime()
        let toBadge = 0
        for (const item of appNewsList) {
            if (!(item.newsOpenedAt === null || item.newsOpenedAt === 0)) continue

            try {
                /*
                if (item.newsJson && typeof item.newsJson.googleEvent !== 'undefined' && item.newsJson.googleEvent && typeof item.newsJson.googleEvent.eventCode !== 'undefined') {
                    await MarketingEvent.logEvent(item.newsJson.googleEvent.eventCode, item.newsJson.googleEvent.params, 'GX')
                    if (typeof item.newsJson.googleEvent.eCommerceParams !== 'undefined') {
                        await analytics().logPurchase(item.newsJson.googleEvent.eCommerceParams)
                    }
                }
                */
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('v20_log_purchase error ' + e.message, item.newsJson.googleEvent)
                }
                await Log.err('v20_log_purchase error ' + e.message)
            }

            if (now - item.newsCreated < TO_BADGE_TIME) {
                if (item.newsGroup === 'NEWS' || item.newsGroup === 'BSE_ORDERS') {
                    item.hasBadge = true
                    toBadge++
                }
                if (item.newsNeedPopup && !item.newsShownPopup) {
                    toShow.push(item)
                }
            }
        }
        if (toShow.length > 0) {
            await AppNewsActions.displayPush(toShow)
        }
        await AppNewsActions.displayBadge(toBadge)
    } else {
        await AppNewsActions.displayBadge(0)
    }
}
