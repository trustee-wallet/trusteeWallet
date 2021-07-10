/**
 * @version 0.50
 */
import Database from '@app/appstores/DataSource/Database'

const CACHE_SETTINGS = {}
let CACHE_SETTINGS_INITED = false

class Settings {

    setSettings = async (paramKey, paramValue) => {
        paramKey = paramKey.toString()
        paramValue = paramValue.toString()
        if (typeof CACHE_SETTINGS[paramKey] !== 'undefined' && CACHE_SETTINGS[paramKey].paramValue === paramValue) {
            return false
        }

        const dbParamValue = Database.escapeString(paramValue)

        const sql = ` UPDATE settings  SET paramValue='${dbParamValue}'  WHERE paramKey='${paramKey}' `
        const updateRes = await Database.setQueryString(sql).query()
        if(!updateRes.rowsAffected) {
            await Database.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('${paramKey}', '${dbParamValue}')`).query()
        }

        CACHE_SETTINGS[paramKey] = {paramValue}
        return true
    }

    getSettings = async (reloadDB = true) => {
        if (!reloadDB && CACHE_SETTINGS_INITED) {
            return CACHE_SETTINGS
        }
        const res = await Database.setQueryString(`SELECT * FROM settings`).query()

        let tmp
        for (tmp of res.array) {
            CACHE_SETTINGS[tmp.paramKey] = tmp
            CACHE_SETTINGS[tmp.paramKey].paramValue = Database.unEscapeString(tmp.paramValue)
        }

        const toRemove = []
        for (tmp of res.array) {
            if (CACHE_SETTINGS[tmp.paramKey].id !== tmp.id) {
                toRemove.push(tmp.id)
            }
        }
        if (toRemove && toRemove.length > 0) {
            await Database.setQueryString(`DELETE FROM settings WHERE id IN (${toRemove.join(',')})`).query()
        }

        CACHE_SETTINGS_INITED = true
        return CACHE_SETTINGS
    }

    getSettingStatic = (key) => {
        return CACHE_SETTINGS[key]
    }

    getSetting = async (key) => {
        if (typeof CACHE_SETTINGS[key] !== 'undefined') {
            return CACHE_SETTINGS[key]
        }

        const res = await Database.setQueryString(`SELECT * FROM settings WHERE [paramKey]='${key}'`).query()
        if (!res.array || typeof res.array[0] === 'undefined') {
            CACHE_SETTINGS[key] = false
            return false
        }

        const tmp = res.array[0]
        tmp.paramValue = Database.unEscapeString(tmp.paramValue)
        CACHE_SETTINGS[key] = tmp
        return tmp
    }
}

export default Settings
