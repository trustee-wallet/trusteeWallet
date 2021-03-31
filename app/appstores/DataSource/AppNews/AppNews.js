/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database'

import store from '@app/store'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import Log from '@app/services/Log/Log'

const tableName = 'app_news'

class AppNews {

    /**
     * @param {number} appNews.id
     * @param {string} appNews.newsName
     */
    setRemoved = async (appNews) => {
        const now = Math.round(new Date().getTime() / 1000)
        let sql
        if (typeof appNews.id !== 'undefined') {
            sql = `UPDATE app_news SET news_removed=${now} WHERE id=${appNews.id}`
        } else {
            sql = `UPDATE app_news SET news_removed=${now} WHERE news_name='${appNews.newsName}'`
        }
        await Database.setQueryString(sql).query()
    }

    /**
     * @param {number} appNews.id
     * @param {number} appNews.newsNeedPopup
     */
    setNewsNeedPopup = async (appNews) => {
        const sql = `UPDATE app_news SET news_need_popup=${appNews.newsNeedPopup} WHERE id=${appNews.id}`
        await Database.setQueryString(sql).query()
    }

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
    saveAppNews = async (appNews) => {
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
            await Database.setQueryString(sql).query()
            delete appNews.onlyOne
        }
        let isUpdate = false
        let updateId = 0
        let updateLog = ''
        if (typeof appNews.newsUniqueKey !== 'undefined' && appNews.newsUniqueKey) {
            let where = `news_unique_key='${appNews.newsUniqueKey}'`
            if (typeof appNews.currencyCode !== 'undefined' && appNews.currencyCode) {
                where += ` AND currency_code='${appNews.currencyCode}' `
            }
            if (typeof appNews.walletHash !== 'undefined') {
                where += ` AND wallet_hash='${appNews.walletHash}'`
            } else {
                where += ` AND (wallet_hash IS NULL OR wallet_hash = '')`
            }
            const saved = `SELECT id, news_name, news_server_hash, news_log FROM app_news WHERE ${where}`
            const tmp = await Database.setQueryString(saved).query()
            if (tmp && tmp.array && typeof tmp.array[0] !== 'undefined' && tmp.array[0]) {
                const found = tmp.array[0]
                if (typeof appNews.newsServerHash !== 'undefined' && appNews.newsServerHash) {
                    if (found.news_server_hash === appNews.newsServerHash) {
                        return false
                    }
                } else {
                    if (found.news_name === appNews.newsName) {
                        return false
                    }
                }
                isUpdate = true
                updateId = found.id
                updateLog = found.news_log
            }
        }
        if (isUpdate) {
            if (typeof appNews.newsLog !== 'undefined') {
                appNews.newsLog = (appNews.newsLog + ' ' + updateLog).substring(0, 500)
            } else {
                appNews.newsLog = ' UPDATE / ' + updateLog
            }
            await Database.setTableName(tableName).setUpdateData( {key: { id: updateId }, updateObj: appNews }).update()
        } else {
            await Database.setTableName(tableName).setInsertData({ insertObjs: [appNews] }).insert()
        }
    }

    clear = async() => {
        await Database.setQueryString('UPDATE ' + tableName + ' SET news_removed=1 WHERE news_removed IS NULL').query()
    }

    shownPopup = async (id) => {
        if (typeof id === 'undefined' || !id) return
        await Database.setQueryString('UPDATE ' + tableName + ' SET news_shown_popup=1 WHERE id=' + id).query()
    }

    markAsOpened = async (id) => {
        if (typeof id === 'undefined' || !id) return
        const now = Math.round(new Date().getTime() / 1000)
        await Database.setQueryString('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE id=' + id).query()
    }

    markAllAsOpened = async (ids = false) => {
        const now = Math.round(new Date().getTime() / 1000)
        if (ids) {
            await Database.setQueryString('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE id IN (' + ids.join(',') + ')').query()
        } else {
            await Database.setQueryString('UPDATE ' + tableName + ' SET news_to_send_status=1, news_opened_at=' + now + ' WHERE news_opened_at IS NULL').query()
        }
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.limit
     */
    getAppNewsForServer = async (params) => {
        let where = [
            `app_news.news_server_id IS NOT NULL`,
            `(app_news.news_to_send_status IS NOT NULL AND app_news.news_to_send_status>0)`
        ]

        if (params && typeof params.walletHash !== 'undefined' && params.walletHash) {
            where.push(`app_news.wallet_hash='${params.walletHash}'`)
        }

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
                app_news.news_server_id AS serverId,
                app_news.news_received_at AS receivedAt,
                app_news.news_opened_at AS openedAt
            FROM app_news
            ${where}
            LIMIT ${limit}
        `

        try {
            const res = await Database.setQueryString(sql).query()
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('DS/AppNews getAppNewsForServer finished as empty')
                return []
            }
            return res.array
        } catch (e) {
            Log.errDaemon('DS/AppNews getAppNewsForServer error ' + sql + ' ' + e.message)
            return []
        }
    }

    saveAppNewsSentForServer = async (ids) => {
        if (typeof ids === 'undefined' || !ids) return
        await Database.setQueryString('UPDATE ' + tableName + ' SET news_to_send_status=0 WHERE id IN (' + ids.join(',') + ')').query()
    }

    /**
     * @param {string} params.walletHash
     */
    getSpecialNews = async (params) => {
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
            res = await Database.setQueryString(sql).query()
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
        } catch(e) {
            Log.errDaemon('DS/AppNews getSpecialNews error ' + sql + ' ' + e.message)
        }
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.newsServerId
     * @param {string} params.newsNeedPopup
     * @param {string} params.limit
     */
    getAppNews = async (params) => {
        const wallets = store.getState().walletStore.wallets
        const names = {}
        let useNames = false
        if (wallets) {
            if (wallets.length > 1) {
                useNames = true
            }
            let wallet
            for(wallet of wallets) {
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
            where.push(`app_news.news_group !='RATES_CHANGING' AND app_news.news_group != 'GOOGLE_EVENTS'`)
        }

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
                app_news.news_received_at AS newsReceivedAt,
                app_news.news_opened_at AS newsOpenedAt

            FROM app_news
            ${where}
            ORDER BY app_news.news_priority, app_news.news_custom_created DESC, app_news.id DESC
            LIMIT ${limit}
        `

        let res = []
        try {
            res = await Database.setQueryString(sql).query()
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

export default new AppNews()
