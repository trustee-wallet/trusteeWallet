import appNewsDS from '../../DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'

import { AppNewsItem } from './Types'
import AppNotification from '../../../services/AppNotification/AppNotification'
import UpdateAppNewsListDaemon from '../../../daemons/view/UpdateAppNewsListDaemon'
import config from '../../../config/config'

export default {
    displayPush: async (appNewsList: Array<AppNewsItem>): Promise<void> => {

        if(!appNewsList) return

        const unique = {}
        for(const news of appNewsList) {
            try {
                const key = typeof news.newsJson.transactionHash !== 'undefined' ? news.newsJson.transactionHash : news.newsJson
                // @ts-ignore
                if (typeof unique[key] === 'undefined') {
                    // @ts-ignore
                    unique[key] = 1
                    await new AppNotification(news).displayPush()
                } else {
                    await appNewsDS.setNewsNeedPopup(news.id, 0)
                }

            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('ACT/AppNewsActions error ' + e.message)
                }
                Log.daemon('ACT/AppNewsActions error ' + e.message)
            }
        }
    },

    clearAll: async() : Promise<void> => {
        await appNewsDS.clear()
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }
}
