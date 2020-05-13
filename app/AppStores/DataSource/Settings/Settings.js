/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

class Settings {

    setSettings = async (paramKey, paramValue) => {

        Log.log('DS/Settings setSettings called')

        const dbInterface = new DBInterface()

        paramKey = paramKey.toString()
        paramValue = dbInterface.escapeString(paramValue.toString())

        const updateRes = await dbInterface.setQueryString(`
            UPDATE settings
            SET paramValue='${paramValue}'
            WHERE paramKey='${paramKey}';
        )`).query()
        if(!updateRes.rowsAffected) {
            await dbInterface.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('${paramKey}', '${paramValue}')`).query()
        }

        Log.log('DS/Settings setSettings finished')
    }

    getSettings = async () => {

        Log.log('DS/Settings getSettings called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM settings`).query()

        Log.log('DS/Settings getSettings finished')

        const tmps = res.array
        const unique = {}
        let tmp
        for (tmp of tmps) {
            unique[tmp.paramKey] = tmp.id
            tmp.paramValue = dbInterface.unEscapeString(tmp.paramValue)
        }

        const toRemove = []
        for (tmp of tmps) {
            if (unique[tmp.paramKey] !== tmp.id) {
                toRemove.push(tmp.id)
            }
        }
        if (toRemove && toRemove.length > 0) {
            await dbInterface.setQueryString(`DELETE FROM settings WHERE id IN (${toRemove.join(',')})`).query()
        }

        return tmps
    }

    getSetting = async (key) => {

        Log.log('DS/Settings getSetting called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM settings WHERE [paramKey]='${key}'`).query()

        Log.log('DS/Settings getSetting finished')

        if (!res.array || typeof res.array[0] === 'undefined') {
            return false
        }

        let tmp = res.array[0]
        tmp.paramValue = dbInterface.unEscapeString(tmp.paramValue)
        return tmp
    }
}

export default Settings
