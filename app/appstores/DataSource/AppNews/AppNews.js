/**
 * @version 0.41
 */
import Database from '@app/appstores/DataSource/Database'

import store from '@app/store'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import Log from '@app/services/Log/Log'

const tableName = 'app_news'

let CACHE_FOR_API = false
let CACHE_FOR_API_FROM_API = false
export default {

    /**
     * @param {number} appNews.id
     * @param {string} appNews.newsName
     */
    async setRemoved(appNews) {
        const now = Math.round(new Date().getTime() / 1000)
        let sql
        if (typeof appNews.id !== 'undefined') {
            sql = `UPDATE app_news SET news_removed=${now} WHERE id=${appNews.id}`
        } else {
            sql = `UPDATE app_news SET news_removed=${now} WHERE news_name='${appNews.newsName}'`
        }
        await Database.query(sql)
    },

    /**
     * @param {number} appNews.id
     * @param {number} appNews.newsNeedPopup
     */
    async setNewsNeedPopup(appNews) {
        const sql = `UPDATE app_news SET news_need_popup=${appNews.newsNeedPopup} WHERE id=${appNews.id}`
        await Database.query(sql)
    },

    /**
     * @param {string} appNews.walletHash
     * @param {string} appNews.currencyCode
     * @param {string} appNews.newsSource
     * @param {string} appNews.newsGroup
     * @param {string} appNews.newsPriority
     * @param {string} appNews.newsName
     * @param {string} appNews.newsJson
     * @param {string} appNews.newsCustomTitle
     * @param {string} appNews.newsCustomText
     * @param {string} appNews.newsImage
     * @param {string} appNews.newsUrl
     * @param {string} appNews.newsCustomCreated
     * @param {string} appNews.newsUniqueKey
     * @param {string} appNews.newsNeedPopup
     * @param {string} appNews.newsServerId
     * @param {string} appNews.newsReceivedAt
     * @param {integer} appNews.newsToSendStatus
     * @param {string} appNews.newsLog
     * @param {boolean} appNews.onlyOne
     * @param {string} appNews.newsServerHash
     */
    async saveAppNews(appNews, fromStoreStatus = false, fromStore = false) {
        const now = Math.round(new Date().getTime() / 1000)

        if (typeof appNews.newsCustomText !== 'undefined' && appNews.newsCustomText) {
            appNews.newsCustomText = Database.escapeString(appNews.newsCustomText)
        }
        if (typeof appNews.newsCustomTitle !== 'undefined' && appNews.newsCustomTitle) {
            appNews.newsCustomTitle = Database.escapeString(appNews.newsCustomTitle)
        }
        if (typeof appNews.newsJson !== 'undefined' && appNews.newsJson) {
            if (typeof appNews.newsJson !== 'string') {
                appNews.newsJson = Database.escapeString(JSON.stringify(appNews.newsJson))
            }
        }
        if (typeof appNews.newsNeedPopup !== 'undefined') {
            appNews.newsNeedPopup = appNews.newsNeedPopup ? 1 : 0
        }
        if (typeof appNews.newsCustomCreated === 'undefined') {
            appNews.newsCustomCreated = now
        }
        if (typeof appNews.newsServerId !== 'undefined' && appNews.newsServerId) {
            appNews.newsReceivedAt = now
            appNews.newsToSendStatus = 1 // need to send as received
        }
        appNews.newsCreated = now
        if (typeof appNews.onlyOne !== 'undefined') {
            let sql = `DELETE FROM app_news WHERE news_name='${appNews.newsName}'`
            if (typeof appNews.currencyCode !== 'undefined' && appNews.currencyCode) {
                sql += ` AND currency_code='${appNews.currencyCode}' `
            }
            if (typeof appNews.walletHash !== 'undefined') {
                sql += ` AND wallet_hash='${appNews.walletHash}'`
            }
            await Database.query(sql)
            delete appNews.onlyOne
        }
        let isUpdate = false
        let updateId = 0
        let updateLog = ''
        let found = false
        if (typeof appNews.newsUniqueKey !== 'undefined' && appNews.newsUniqueKey && fromStoreStatus !== 'can_insert') {
            if (fromStoreStatus === 'check_update') {
                found = fromStore
            } else if (fromStoreStatus === 'check_update_ind') {
                found = fromStore
            } else {
                let where = `news_unique_key='${appNews.newsUniqueKey}'`
                if (typeof appNews.currencyCode !== 'undefined' && appNews.currencyCode) {
                    where += ` AND currency_code='${appNews.currencyCode}' `
                }
                if (typeof appNews.walletHash !== 'undefined') {
                    where += ` AND wallet_hash='${appNews.walletHash}'`
                } else {
                    where += ` AND (wallet_hash IS NULL OR wallet_hash = '')`
                }
                const saved = `SELECT id, news_name as newsName, news_server_hash AS newsServerHash, news_log, news_server_id AS serverId, news_received_at AS receivedAt, news_opened_at AS openedAt FROM app_news WHERE ${where}`
                const tmp = await Database.query(saved)
                if (tmp && tmp.array && typeof tmp.array[0] !== 'undefined' && tmp.array[0]) {
                    found = tmp.array[0]
                }
            }
            if (found) {
                if (typeof appNews.newsServerHash !== 'undefined' && appNews.newsServerHash) {
                    if (found.newsServerHash === appNews.newsServerHash) {
                        return {
                            updated: false, id: found.id, serverId: found.serverId, receivedAt: found.receivedAt, openedAt: found.openedAt
                        }
                    }
                } else {
                    if (found.newsName === appNews.newsName) {
                        return {
                            updated: false, id: found.id, serverId: found.serverId, receivedAt: found.receivedAt, openedAt: found.openedAt
                        }
                    }
                }
                isUpdate = true
                updateId = found.id
                updateLog = found.news_log
            }
        }
        if (isUpdate && found) {
            if (typeof appNews.newsLog !== 'undefined') {
                appNews.newsLog = (appNews.newsLog + ' ' + updateLog).substring(0, 500)
            } else {
                appNews.newsLog = ' UPDATE / ' + updateLog
            }
            await Database.setTableName(tableName).setUpdateData({ key: { id: updateId }, updateObj: appNews }).update()
            return {
                updated: true, id: found.id, serverId: found.serverId, receivedAt: found.receivedAt, openedAt: found.openedAt
            }
        } else {
            await Database.setTableName(tableName).setInsertData({ insertObjs: [appNews] }).insert()
            return {
                updated: true, receivedAt: 0, openedAt: 0
            }
        }
    },

    async clear() {
        await Database.query('UPDATE ' + tableName + ' SET news_removed=1 WHERE news_removed IS NULL')
    },

    async shownPopup(id) {
        if (typeof id === 'undefined' || !id) return
        await Database.query('UPDATE ' + tableName + ' SET news_shown_popup=1 WHERE id=' + id)
    },

    async markAsOpened(id) {
        if (typeof id === 'undefined' || !id) return
        const now = Math.round(new Date().getTime() / 1000)
        await Database.query('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE id=' + id)
    },

    async markAllAsOpened(ids = false) {
        const now = Math.round(new Date().getTime() / 1000)
        if (ids) {
            await Database.query('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE id IN (' + ids.join(',') + ')')
        } else {
            await Database.query('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE news_opened_at IS NULL')
        }
    },

    pushAppNewsForApi(row) {
        if (CACHE_FOR_API_FROM_API === false) {
            CACHE_FOR_API_FROM_API = []
        }
        CACHE_FOR_API_FROM_API.push(row)
    },

    async getAppNewsForApi() {
        if (CACHE_FOR_API !== false) {
            return CACHE_FOR_API
        }
        let where = [
            `app_news.news_server_id IS NOT NULL`,
            `(app_news.news_to_send_status IS NOT NULL AND app_news.news_to_send_status>0)`
        ]
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `
            SELECT
                app_news.id,
                app_news.news_server_id AS serverId,
                app_news.news_received_at AS receivedAt,
                app_news.news_opened_at AS openedAt
            FROM app_news
            ${where}
            LIMIT 100
        `

        CACHE_FOR_API = CACHE_FOR_API_FROM_API === false ? [] : CACHE_FOR_API_FROM_API
        try {
            const res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('DS/AppNews getAppNewsForServer finished as empty')
            } else {
                for (const row of res.array) {
                    if (row.receivedAt) {
                        row.receivedAt = row.receivedAt + '000'
                    }
                    if (row.openedAt) {
                        row.openedAt = row.openedAt + '000'
                    }
                    CACHE_FOR_API.push(row)
                }
            }
            return CACHE_FOR_API
        } catch (e) {
            Log.errDaemon('DS/AppNews getAppNewsForServer error ' + sql + ' ' + e.message)
            return []
        }
    },

    async saveAppNewsSentForServer(ids) {
        if (typeof ids === 'undefined' || !ids || ids.length === 0) return
        const sql = 'UPDATE ' + tableName + ' SET news_to_send_status=0 WHERE id IN (' + ids.join(',') + ')'
        await Database.query(sql)
        CACHE_FOR_API = false
    },

    /**
     * @param {string} params.walletHash
     */
    async getSpecialNews(params) {
        let where = [`app_news.news_removed IS NULL AND app_news.news_group = 'GOOGLE_EVENTS'`]
        where.push(`(app_news.news_opened_at=0 OR app_news.news_opened_at IS NULL)`)

        if (params && params.walletHash) {
            where.push(`app_news.wallet_hash='${params.walletHash}'`)
        }
        if (params && typeof params.newsServerId !== 'undefined') {
            where.push(`app_news.news_server_id IS NOT NULL`)
        }


        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let limit = 10
        if (params && typeof params.limit !== 'undefined' && params.limit > 0) {
            limit = params.limit
        }

        const sql = `
            SELECT
                app_news.id,
                app_news.news_custom_title AS newsCustomTitle,
                app_news.news_json AS newsJson,
                app_news.news_opened_at AS newsOpenedAt

            FROM app_news
            ${where}
            ORDER BY app_news.news_priority, app_news.news_custom_created DESC, app_news.id DESC
            LIMIT ${limit}
        `

        let res = []
        try {
            res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                return []
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                const string = Database.unEscapeString(res[i].newsJson)
                try {
                    res[i].newsJson = JSON.parse(string)
                } catch (e) {
                    // noinspection ES6MissingAwait
                    Log.errDaemon('DS/AppNews getSpecialNews json error ' + string + ' ' + e.message)
                }
            }
            return res
        } catch (e) {
            Log.errDaemon('DS/AppNews getSpecialNews error ' + sql + ' ' + e.message)
        }
    },

    /**
     * @param {string} params.walletHash
     * @param {string} params.newsServerId
     * @param {string} params.newsNeedPopup
     * @param {string} params.limit
     */
    async getAppNews(params) {
        const wallets = store.getState().walletStore.wallets
        const names = {}
        let useNames = false
        if (wallets) {
            if (wallets.length > 1) {
                useNames = true
            }
            let wallet
            for (wallet of wallets) {
                names[wallet.walletHash] = wallet.walletName
            }
        }

        let where = [`app_news.news_removed IS NULL`]

        if (params && params.walletHash) {
            where.push(`app_news.wallet_hash='${params.walletHash}'`)
        }
        if (params && params.newsNeedPopup) {
            where.push(`app_news.news_need_popup=${params.newsNeedPopup}`)
            where.push(`app_news.news_shown_popup IS NULL`)
        }
        if (params && typeof params.newsServerId !== 'undefined') {
            where.push(`app_news.news_server_id IS NOT NULL`)
        }


        const exchangeRatesNotifs = await settingsActions.getSetting('exchangeRatesNotifs')
        if (exchangeRatesNotifs === '0') {
            where.push(`app_news.news_group !='RATES_CHANGING'`)
        }
        where.push(`app_news.news_group != 'GOOGLE_EVENTS'`)

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let limit = 100
        if (params && typeof params.limit !== 'undefined' && params.limit > 0) {
            limit = params.limit
        }

        const sql = `
            SELECT
                app_news.id,
                app_news.wallet_hash AS walletHash,
                app_news.news_server_hash AS newsServerHash,
                app_news.currency_code AS currencyCode,
                app_news.news_source AS newsSource,
                app_news.news_group AS newsGroup,
                app_news.news_priority AS newsPriority,
                app_news.news_name AS newsName,
                app_news.news_json AS newsJson,
                app_news.news_custom_title AS newsCustomTitle,
                app_news.news_custom_text AS newsCustomText,
                app_news.news_custom_created AS newsCreated,
                app_news.news_image AS newsImage,
                app_news.news_url AS newsUrl,
                app_news.news_status AS newsStatus,
                app_news.news_need_popup AS newsNeedPopup,
                app_news.news_shown_popup AS newsShownPopup,
                app_news.news_shown_list AS newsShownList,
                app_news.news_server_id AS newsServerId,
                app_news.news_server_hash AS newsServerHash,
                app_news.news_received_at AS newsReceivedAt,
                app_news.news_opened_at AS newsOpenedAt

            FROM app_news
            ${where}
            ORDER BY app_news.news_priority, app_news.news_custom_created DESC, app_news.id DESC
            LIMIT ${limit}
        `

        let res = []
        try {
            res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('AppNews getAppNews finished as empty')
                return []
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                if (useNames && typeof names[res[i].walletHash] !== 'undefined') {
                    res[i].walletName = names[res[i].walletHash]
                } else {
                    res[i].walletName = ''
                }
                if (!res[i].newsJson || res[i].newsJson === 'false') continue

                const string = Database.unEscapeString(res[i].newsJson)
                res[i].newsCustomText = Database.unEscapeString(res[i].newsCustomText)
                res[i].newsCustomTitle = Database.unEscapeString(res[i].newsCustomTitle)
                try {
                    res[i].newsJson = JSON.parse(string)
                } catch (e) {
                    // noinspection ES6MissingAwait
                    Log.errDaemon('DS/AppNews getAppNews json error ' + string + ' ' + e.message)
                }
            }
        } catch (e) {
            Log.errDaemon('DS/AppNews getAppNews error ' + sql + ' ' + e.message)
        }
        return res
    }
}
