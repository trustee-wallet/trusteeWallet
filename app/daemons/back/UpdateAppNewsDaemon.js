/**
 * @version 0.11
 */
import Log from '../../services/Log/Log'

import Api from '../../services/Api/Api'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'

class UpdateAppNewsDaemon {

    /**
     * @return {Promise<void>}
     */
    updateAppNewsDaemon = async () => {
        const appNews = await appNewsDS.getAppNews({newsServerId : 1})
        const indexed = {}
        const ids = []
        if (appNews && appNews.length > 0) {
            let tmp
            for (tmp of appNews) {
                if (tmp.newsServerId) {
                    indexed[tmp.newsServerId] = tmp
                    ids.push(tmp.newsServerId)
                }
            }
        }

        const keys = ['currencyCode', 'newsGroup', 'newsPriority', 'newsName', 'newsJson', 'newsCustomTitle', 'newsCustomText', 'newsCustomCreated', 'newsNeedPopup']
        const res = await Api.getNews({ ids })
        if (typeof res.news !== 'undefined') {
            let tmp, key
            for (tmp of res.news) {
                const toSave = {}
                if (typeof tmp.id !== 'undefined') {
                    if (typeof indexed[tmp.id] !== 'undefined') {
                        continue
                    }
                    toSave.newsServerId = tmp.id
                }
                for (key of keys) {
                    if (typeof tmp[key] !== 'undefined') {
                        toSave[key] = tmp[key]
                    }
                }
                Log.daemon('UpdateAppNews adding from Server ', toSave)
                await appNewsDS.saveAppNews(toSave)
            }
        }
    }
}

export default new UpdateAppNewsDaemon
