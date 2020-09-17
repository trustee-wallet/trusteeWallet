import appNewsDS from '../../DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'

import { AppNewsItem } from './Types'
import AppNotification from '../../../services/AppNotification/AppNotification'
import UpdateAppNewsDaemon from '../../../services/Daemon/elements/UpdateAppNewsDaemon'
import AppNews from '../../DataSource/AppNews/AppNews'


export default {
    displayPush: async (): Promise<void> => {
        const appNewsList: Array<AppNewsItem> | false = await appNewsDS.getAppNews({ newsNeedPopup: 1})

        if(!appNewsList) return

        let unique = {}
        for(const news of appNewsList) {
            try {
                let key = typeof news.newsJson.transactionHash !== 'undefined' ? news.newsJson.transactionHash : ''
                if (typeof unique[key] === 'undefined') {
                    unique[key] = 1
                    await new AppNotification(news).displayPush()
                } else {
                    AppNews.setNewsNeedPopup(news.id, 0)
                }
            } catch (e) {
                Log.daemon('ACT/AppNewsActions error ' + e.message)
            }
        }
    },

    clearAll: async() : Promise<void> => {
        await appNewsDS.clear()
        await UpdateAppNewsDaemon.updateAppNewsDaemon()
    }
}
