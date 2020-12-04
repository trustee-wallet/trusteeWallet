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
        const res = await Api.getNews(forServer)

        if (!res || res.length === 0) return false
        for (const row of res) {
            const toSave = {
                currencyCode: row.currencyCode,
                newsSource: row.source,
                newsGroup: row.group,
                newsPriority: row.priority,
                newsName: row.name,
                newsJson: row.data,
                newsCustomTitle: row.title,
                newsCustomText: row.text,
                newsImage: row.image,
                newsUrl: row.url,
                newsCustomCreated: row.createdAt,
                newsUniqueKey: row.serverId,
                newsNeedPopup: row.needPopup ? 1 : 0,
                newsServerId: row.serverId,
                newsLog: new Date().toISOString() + ' loaded from Server'
            }
            if (typeof row.isBroadcast === 'undefined' || row.isBroadcast === false) {
                toSave.walletHash = walletHash
            }
            Log.daemon('UpdateAppNews adding from Server ', toSave)
            await appNewsDS.saveAppNews(toSave)
        }

        if (forServer) {
            const ids = []
            for (const row of forServer) {
                ids.push(row.id)
            }
            await appNewsDS.saveAppNewsSentForServer(ids)
        }

    }
}

export default new UpdateAppNewsDaemon
