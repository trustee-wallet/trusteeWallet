import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

class Settings {

    setSettings = async (paramKey, paramValue) => {

        Log.log('DS/Settings setSettings called')

        const dbInterface = new DBInterface()

        paramKey = paramKey.toString()
        paramValue = paramValue.toString()

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

        return res
    }
}

export default Settings
