/**
 * @version 0.20
 */
import Log from '../../services/Log/Log'

import Api from '../../services/Api/Api'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import DBInterface from '../../appstores/DataSource/DB/DBInterface'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

class UpdateAppNewsDaemon {

    /**
     * @return {Promise<void>}
     */
    updateAppNewsDaemon = async () => {
        Log.daemon(' UpdateAppNews init')

        const walletHash = await cryptoWalletsDS.getSelectedWallet()
        const forServer = await appNewsDS.getAppNewsForServer()
        const forServerIds = []
        if (forServer) {
            for(const row of forServer) {
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
        if (!res || res.length === 0) {
            if (forServerIds.length > 0) {
                await appNewsDS.saveAppNewsSentForServer(forServerIds)
            }
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
            newsServerHash : 'status'
        }
        for (const row of res) {
            const toSave = {
                newsNeedPopup: row.needPopup ? 1 : 0,
                newsLog: new Date().toISOString() + ' loaded from Server'
            }
            for (const saveField in keys) {
                const serverField = keys[saveField]
                if (typeof row[serverField] !== 'undefined' && row[serverField] ) {
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
    }
}

export default new UpdateAppNewsDaemon
