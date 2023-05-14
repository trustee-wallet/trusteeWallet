/**
 * @version 0.43
 */
import Log from '@app/services/Log/Log'
import ApiProxy from '@app/services/Api/ApiProxy'
import config from '@app/config/config'

import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import appNewsInitStore from '@app/appstores/Stores/AppNews/AppNewsInitStore'
import store from '@app/store'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

let CACHE_NEWS_HASH = ''
let CACHE_LAST_TIME = false
const CACHE_VALID_TIME = 120000 // 2 minute

class UpdateAppNewsDaemon {

    _canUpdate = true

    _goToNotifications = false

    goToNotifications = (code) => {
        if (this._goToNotifications === 'INITED_APP') return false // its final status
        this._goToNotifications = code
    }

    isGoToNotifications = (code) => {
        if (!this._goToNotifications) return false
        return this._goToNotifications === code
    }

    /**
     * @return {Promise<void>}
     */
    updateAppNewsDaemon = async (params = {}, dataUpdate = false) => {
        if (typeof params === 'undefined' || typeof params.force === 'undefined' || !params) {
            if (!this._canUpdate) {
                return false
            }
            const now = new Date().getTime()
            const diff = now - CACHE_LAST_TIME
            if (diff < CACHE_VALID_TIME) {
                Log.daemon('UpdateAppNews skipped by diff ' + diff)
                return false
            }
        }
        this._canUpdate = false

        const walletHash = await settingsActions.getSelectedWallet('UpdateNewsDaemon')
        let res
        let asked = false
        if (!dataUpdate) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' UpdateNewsDaemon loading new')
            }
            asked = true
            try {
                res = await ApiProxy.getAll({...params, source: 'UpdateAppNewsDaemon.updateAppNews' })
            } catch (e) {
                this._canUpdate = true
                return false
            }
        } else {
            res = dataUpdate
        }

        if (store.getState().appNewsStore.appNewsList.length === 0) {
            await appNewsInitStore()
        }

        if (!res || typeof res === 'undefined' || typeof res.news === 'undefined' || !res.news || res.news.length === 0) {
            this._canUpdate = true
            return false
        }
        if (res.newsHash === CACHE_NEWS_HASH) {
            // can put log for recheck hashing cache
            this._canUpdate = true
            return false
        }

        if (!asked) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' UpdateNewsDaemon loaded proxy')
            }
        }

        CACHE_NEWS_HASH = typeof res.newsHash !== 'undefined' ? res.newsHash : ''

        const keys = {
            currencyCode: 'currencyCode',
            newsSource: 'source',
            newsGroup: 'group',
            newsPriority: 'priority',
            newsName: 'name',
            newsJson: 'data',
            newsCustomTitle: 'title',
            newsCustomText: 'text',
            newsImage: 'image',
            newsUrl: 'url',
            newsCustomCreated: 'createdAt',
            newsUniqueKey: 'serverId',
            newsServerId: 'serverId',
            newsServerHash: 'status'
        }
        let savedAny = false
        const allNews = store.getState().appNewsStore.appNewsList
        const allNewsIndexed = {}
        if (allNews.length) {
            for (const news of allNews) {
                allNewsIndexed[news.newsServerId] = {
                    newsName : news.newsName,
                    newsServerHash: news.newsServerHash
                }
            }
        }

        try {
            let index = 0
            if (typeof res.news !== 'undefined' && res.news) {
                for (const row of res.news) {
                    if (index > 2) {
                        // break
                    }
                    index++
                    const toSave = {
                        newsNeedPopup: row.needPopup ? 1 : 0,
                        newsLog: new Date().toISOString() + ' loaded from Server'
                    }
                    for (const saveField in keys) {
                        const serverField = keys[saveField]
                        if (typeof row[serverField] !== 'undefined' && row[serverField]) {
                            toSave[saveField] = row[serverField]
                        }
                        if (typeof row[serverField] !== 'undefined' && row[serverField]) {
                            toSave[saveField] = row[serverField]
                        }
                    }
                    let fromStoreStatus = 'no_cache'
                    let fromStore = false
                    if (typeof row.isBroadcast === 'undefined' || row.isBroadcast === false) {
                        if (row.newsGroup !== 'GOOGLE_EVENTS' && typeof allNewsIndexed[toSave.newsUniqueKey] !== 'undefined') {
                            fromStore = allNewsIndexed[toSave.newsUniqueKey]
                            fromStoreStatus = 'check_update_ind'
                            // not loaded
                        }
                        toSave.walletHash = walletHash
                    } else if (typeof allNewsIndexed[toSave.newsUniqueKey] !== 'undefined') {
                        fromStore = allNewsIndexed[toSave.newsUniqueKey]
                        fromStoreStatus = 'check_update'
                    } else {
                        fromStoreStatus = 'can_insert'
                    }
                    if (typeof row.status !== 'undefined' && row.status && row.status.toString() === '33') {
                        toSave.removed = 33
                    }
                    const saved = await appNewsDS.saveAppNews(toSave, fromStoreStatus, fromStore)
                    if (saved.updated) {
                        savedAny = true
                    } else {
                        await appNewsDS.pushAppNewsForApi(saved)
                    }
                }
            }
            CACHE_LAST_TIME = new Date().getTime()
        } catch (e) {
            this._canUpdate = true
            Log.err('UpdateAppNews saving result error ' + e.message)
        }

        if (savedAny || allNews.length === 0) {
            try {
                await appNewsInitStore()
            } catch (e) {
                Log.err('UpdateAppNews appNewsInitStore call error ' + e.message)
            }
        }

        this._canUpdate = true
    }
}

export default new UpdateAppNewsDaemon
