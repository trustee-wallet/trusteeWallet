/**
 * @version 0.32
 */
import Log from '../../services/Log/Log'
import Api from '../../services/Api/Api'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import DBInterface from '../../appstores/DataSource/DB/DBInterface'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import ApiProxy from '../../services/Api/ApiProxy'

let CACHE_NEWS_HASH = ''
let CACHE_LAST_TIME = false
const CACHE_VALID_TIME = 60000 // 1 minute

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
    updateAppNewsDaemon = async (params = {}) => {
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

        Log.daemon('UpdateAppNews called')
        const walletHash = await cryptoWalletsDS.getSelectedWallet()

        let res
        try {
            res = await ApiProxy.getAll({source : 'UpdateAppNewsDaemon.updateAppNews'})
        } catch (e) {
            this._canUpdate = true
            return false
        }
        if (typeof res.news === 'undefined' || !res.news || res.news.length === 0 || res.newsHash === CACHE_NEWS_HASH) {
            if (res && typeof res.forServerIds !== 'undefined' && res.forServerIds.length > 0) {
                await appNewsDS.saveAppNewsSentForServer(res.forServerIds)
            }
            this._canUpdate = true
            return false
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
        try {
            for (const row of res.news) {
                const toSave = {
                    newsNeedPopup: row.needPopup ? 1 : 0,
                    newsLog: new Date().toISOString() + ' loaded from Server'
                }
                for (const saveField in keys) {
                    const serverField = keys[saveField]
                    if (typeof row[serverField] !== 'undefined' && row[serverField]) {
                        toSave[saveField] = row[serverField]
                    }
                }
                if (typeof row.isBroadcast === 'undefined' || row.isBroadcast === false) {
                    toSave.walletHash = walletHash
                }
                if (typeof row.status !== 'undefined' && row.status && row.status.toString() === '33') {
                    toSave.removed = 33
                }
                Log.daemon('UpdateAppNews adding from Server ', toSave)
                await appNewsDS.saveAppNews(toSave)
            }

            if (res.forServerIds.length > 0) {
                await appNewsDS.saveAppNewsSentForServer(res.forServerIds)
            }
            CACHE_LAST_TIME = new Date().getTime()
        } catch (e) {
            this._canUpdate = true
            Log.err('UpdateAppNews saving result error ' + e.message)
        }
        this._canUpdate = true
    }
}

export default new UpdateAppNewsDaemon
