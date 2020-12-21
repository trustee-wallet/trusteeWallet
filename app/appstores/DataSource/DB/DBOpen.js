/**
 * @version 0.9
 */
import Log from '../../../services/Log/Log'

import SQLiteStorage1 from 'react-native-sqlite-storage'
import SQLiteStorage2 from 'react-native-sqlite-helper/node_modules/react-native-sqlite-storage'
import SQLiteHelper from 'react-native-sqlite-helper'

import config from '../../../config/config'

SQLiteStorage1.DEBUG(config.debug.appDBLogs)
SQLiteStorage2.DEBUG(config.debug.appDBLogs)

const SQLiteHelperDB = new SQLiteHelper('TrusteeWalletDB.db')
SQLiteHelperDB.successInfo = (text, absolutely) => {
    if (!config.debug.appDBLogs) return false
    if (absolutely) {
        Log.log(text)
    } else {
        Log.log(`SQLiteHelper ${text} success`)
    }
}
SQLiteHelperDB.errorInfo = (text, err, absolutely) => {
    if (!config.debug.appDBLogs && !config.debug.appErrors) return false
    if (absolutely) {
        Log.log(text)
    } else {
        Log.log(`SQLiteHelper ${text} error: ${err.message}`)
    }
}

class DBOpen {

    /**
     * assembled object with all necessary methods
     * @type {object}
     * @private
     */
    #db = {}

    #status = {
        opening: '---------- DATABASE OPENING.... ----------',
        error: '---------- DATABASE OPENING ERROR ----------',
        success: '---------- DATABASE OPEN SUCCESSFULLY ----------'
    }

    /**
     * @return {Promise}
     */
    async open() {

        const {
            opening,
            error,
            success
        } = this.getInfo()

        // console.log('DBOpen.open')
        // console.log(opening)

        let openedDB

        try {
            const { res: tpmSqlLite } = await SQLiteHelperDB.open()
            openedDB = tpmSqlLite
        } catch (e) {
            console.log('DBOpen.open.error ' + e.message)
        }

        // console.log('DBOpen.open.result')
        // typeof openedDB === 'undefined' ? console.log(error) : console.log(success)

        const DB = { ...SQLiteHelperDB }
        DB.query = openedDB
        this.#db = DB

    }

    getDB = () => this.#db
    getInfo = () => this.#status

}

export default new DBOpen()
