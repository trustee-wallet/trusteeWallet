import SQLiteHelper from "react-native-sqlite-helper"
const SQLiteHelperDB = new SQLiteHelper('TrusteeWalletDB.db')

import console from '../../../services/Log/Log'

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

        console.log('DBOpen.open')
        console.log(opening)

        let DB
        let openedDB

        try {
            const { res : tpmSqlLite } = await SQLiteHelperDB.open()
            openedDB = tpmSqlLite
        } catch (e) {
            console.log('DBOpen.open.error')
            console.log(e.message)
        }

        console.log('DBOpen.open.result')
        typeof openedDB == 'undefined' ?
            console.log(error) :
                console.log(success)


        DB = { ...SQLiteHelperDB }
        DB.query = openedDB
        this.#db = DB

    }

    getDB = () => this.#db
    getInfo = () => this.#status

}

export default new DBOpen()
