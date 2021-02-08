/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

const CACHE_SETTINGS = {}
class Settings {

    setSettings = async (paramKey, paramValue) => {
        paramKey = paramKey.toString()
        paramValue = paramValue.toString()
        if (typeof CACHE_SETTINGS[paramKey] !== 'undefined' && CACHE_SETTINGS[paramKey].paramValue === paramValue) {
            return false
        }

        const dbInterface = new DBInterface()

        const dbParamValue = dbInterface.escapeString(paramValue)

        const updateRes = await dbInterface.setQueryString(`
            UPDATE settings
            SET paramValue='${dbParamValue}'
            WHERE paramKey='${paramKey}';
        )`).query()
        if(!updateRes.rowsAffected) {
            await dbInterface.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('${paramKey}', '${dbParamValue}')`).query()
        }

        CACHE_SETTINGS[paramKey] = {paramValue}

        Log.log('DS/Settings setSettings ' + paramKey + ' finished')
        return true
    }

    getSettings = async () => {

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM settings`).query()

        let tmp
        for (tmp of res.array) {
            CACHE_SETTINGS[tmp.paramKey] = tmp
            CACHE_SETTINGS[tmp.paramKey].paramValue = dbInterface.unEscapeString(tmp.paramValue)
        }

        const toRemove = []
        for (tmp of res.array) {
            if (CACHE_SETTINGS[tmp.paramKey].id !== tmp.id) {
                toRemove.push(tmp.id)
            }
        }
        if (toRemove && toRemove.length > 0) {
            await dbInterface.setQueryString(`DELETE FROM settings WHERE id IN (${toRemove.join(',')})`).query()
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

        const dbInterface = new DBInterface()
        const res = await dbInterface.setQueryString(`SELECT * FROM settings WHERE [paramKey]='${key}'`).query()

        if (!res.array || typeof res.array[0] === 'undefined') {
            CACHE_SETTINGS[key] = false
            return false
        }

        const tmp = res.array[0]
        tmp.paramValue = dbInterface.unEscapeString(tmp.paramValue)
        CACHE_SETTINGS[key] = tmp
        return tmp
    }
}

export default Settings
