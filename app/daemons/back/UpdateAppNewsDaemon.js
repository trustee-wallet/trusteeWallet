/**
 * @version 0.31
 */
import Log from '../../services/Log/Log'
import Api from '../../services/Api/Api'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import DBInterface from '../../appstores/DataSource/DB/DBInterface'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_LAST_TIME = false

class UpdateAppNewsDaemon {

    _canUpdate = true

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
        const forServer = await appNewsDS.getAppNewsForServer()
        const forServerIds = []
        if (forServer) {
            for (const row of forServer) {
                forServerIds.push(row.id)
                if (row.receivedAt) {
                    row.receivedAt = row.receivedAt + '000'
                }
                if (row.openedAt) {
                    row.openedAt = row.openedAt + '000'
                }
            }
        }
        const res = await Api.getNews(forServer)
        if (res.isError) {
            this._canUpdate = true
            return false
        }
        if (!res.data || res.data.length === 0) {
            if (forServerIds.length > 0) {
                await appNewsDS.saveAppNewsSentForServer(forServerIds)
            }
            this._canUpdate = true
            return false
        }
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
            for (const row of res.data) {
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

            if (forServerIds.length > 0) {
                await appNewsDS.saveAppNewsSentForServer(forServerIds)
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
