/**
 * @version 0.11
 */
import store from '@app/store'

import Update from '../Update'

import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

const TO_BADGE_TIME = 3600000 * 24 * 4

let CACHE_STOPPED = false

class UpdateAppNewsListDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAppNewsListDaemon
    }

    stop = () => {
        CACHE_STOPPED = true
    }

    unstop = () => {
        CACHE_STOPPED = false
    }

    /**
     * @return {Promise<void>}
     */
    updateAppNewsListDaemon = async () => {
        if (CACHE_STOPPED) return false
        if (!this._canUpdate) {
            return
        }
        this._canUpdate = false

        const appSpecialList = await appNewsDS.getSpecialNews()
        if (appSpecialList && appSpecialList.length > 0) {
            const ids = []
            for (const item of appSpecialList) {
                ids.push(item.id)
                if (item.newsJson && typeof item.newsJson.googleEvent !== 'undefined' && item.newsJson.googleEvent && typeof item.newsJson.googleEvent.eventCode !== 'undefined') {
                    await MarketingEvent.logEvent(item.newsJson.googleEvent.eventCode, item.newsJson.googleEvent.params, 'GX')
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
                if (item.newsJson && typeof item.newsJson.googleEvent !== 'undefined' && item.newsJson.googleEvent && typeof item.newsJson.googleEvent.eventCode !== 'undefined') {
                    await MarketingEvent.logEvent(item.newsJson.googleEvent.eventCode, item.newsJson.googleEvent.params, 'GX')
                }
                if (now - item.newsCreated < TO_BADGE_TIME) {
                    if (item.newsGroup === 'NEWS' || item.newsGroup === 'BSE_ORDERS') {
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

        this._canUpdate = true
    }
}

export default new UpdateAppNewsListDaemon
