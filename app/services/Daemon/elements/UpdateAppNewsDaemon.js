/**
 * @version 0.9
 */
import Update from './Update'

import Log from '../../Log/Log'

import appNewsDS from '../../../appstores/DataSource/AppNews/AppNews'

import store from '../../../store'
import Api from '../../Api/Api'
import updateAccountBalanceAndTransactionsDaemon from './UpdateAccountBalanceAndTransactionsDaemon'

class UpdateAppNewsDaemon extends Update {

    _canUpdate = true

    _isSkipped = false

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAppNewsDaemon
    }

    /**
     * @namespace Flow.updateAppTasks
     * @return {Promise<void>}
     */
    updateAppNewsDaemon = async () => {
        if (!updateAccountBalanceAndTransactionsDaemon._canUpdate) {
            this._isSkipped = true
            Log.daemon('UpdateAppNews skipped as already running tx scanning')
            return
        }
        if (!this._canUpdate) {
            return
        }
        this._canUpdate = false
        this._isSkipped = false

        Log.daemon('UpdateAppNews called')

        let appNews = await appNewsDS.getAppNews()
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
            let updated = false
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
                updated = true
            }
            if (updated) {
                appNews = await appNewsDS.getAppNews()
            }
        }


        store.dispatch({
            type: 'SET_APP_NEWS',
            appNews: appNews
        })

        this._canUpdate = true
    }
}

export default new UpdateAppNewsDaemon
