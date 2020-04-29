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
        if(!updateRes.rowsAffected)
            await dbInterface.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('${paramKey}', '${paramValue}')`).query()

        Log.log('DS/Settings setSettings finished')
    }

    getSettings = async () => {

        Log.log('DS/Settings getSettings called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM settings`).query()

        Log.log('DS/Settings getSettings finished')

        let tmps = res.array
        for (let tmp of tmps) {
            tmp.paramValue = dbInterface.unEscapeString(tmp.paramValue)
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
