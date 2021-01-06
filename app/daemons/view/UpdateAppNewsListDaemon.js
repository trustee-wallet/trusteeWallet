/**
 * @version 0.11
 */
import Update from '../Update'

import Log from '../../services/Log/Log'

import store from '../../store'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import appNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

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

        await AppNotificationListener.getToken()

        // nope its bad setLoaderStatus(false) // fix for some error screens

        const appNewsList = await appNewsDS.getAppNews()

        store.dispatch({
            type: 'SET_APP_NEWS_LIST',
            appNewsList: appNewsList
        })

        if (appNewsList && appNewsList.length > 0) {
            let item
            const toShow = []
            for (item of appNewsList) {
                if (item.newsNeedPopup && !item.newsShownPopup) {
                    toShow.push(item)
                }
            }
            if (toShow.length > 0) {
                await appNewsActions.displayPush(toShow)
            }
            await appNewsActions.displayBadge(appNewsList.length)
        } else {
            await appNewsActions.displayBadge(0)
        }

        this._canUpdate = true
    }
}

export default new UpdateAppNewsListDaemon
