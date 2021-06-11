/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';

import Log from '../../../services/Log/Log'

const CACHE_SETTINGS = {}
class Settings {

    setSettings = async (paramKey, paramValue) => {
        paramKey = paramKey.toString()
        paramValue = paramValue.toString()
        if (typeof CACHE_SETTINGS[paramKey] !== 'undefined' && CACHE_SETTINGS[paramKey].paramValue === paramValue) {
            return false
        }

        const dbParamValue = Database.escapeString(paramValue)

        const updateRes = await Database.setQueryString(`
            UPDATE settings
            SET paramValue='${dbParamValue}'
            WHERE paramKey='${paramKey}';
        )`).query()
        if(!updateRes.rowsAffected) {
            await Database.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('${paramKey}', '${dbParamValue}')`).query()
        }

        CACHE_SETTINGS[paramKey] = {paramValue}

        Log.log('DS/Settings setSettings ' + paramKey + ' finished')
        return true
    }

    getSettings = async () => {
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
