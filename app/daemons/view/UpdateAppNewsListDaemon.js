/**
 * @version 0.11
 */
import Update from '../Update'

import store from '../../store'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import appNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

const TO_BADGE_TIME = 3600000 * 24 * 4
class UpdateAppNewsListDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAppNewsListDaemon
    }

    /**
     * @return {Promise<void>}
     */
    updateAppNewsListDaemon = async () => {
        if (!this._canUpdate) {
            return
        }
        this._canUpdate = false

        // nope its bad setLoaderStatus(false) // fix for some error screens

        const appNewsList = await appNewsDS.getAppNews()

        store.dispatch({
            type: 'SET_APP_NEWS_LIST',
            appNewsList: appNewsList
        })

        if (appNewsList && appNewsList.length > 0) {
            const toShow = []
            const now = new Date().getTime()
            let toBadge = 0
            for (const item of appNewsList) {
                if (now - item.newsCreated < TO_BADGE_TIME && item.newsOpenedAt === null) {
                    if (item.newsName !== 'BTC_RATES_CHANGING') {
                        toBadge++
                    }
                    if (item.newsNeedPopup && !item.newsShownPopup) {
                        toShow.push(item)
                    }
                }
            }
            if (toShow.length > 0) {
                await appNewsActions.displayPush(toShow)
            }
            await appNewsActions.displayBadge(toBadge)
        } else {
            await appNewsActions.displayBadge(0)
        }

        this._canUpdate = true
    }
}

export default new UpdateAppNewsListDaemon
