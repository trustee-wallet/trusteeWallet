import { deleteUserPinCode } from '@haskkor/react-native-pincode'

import DBInterface from '../DBInterface'

import dbInitialData from './assets/dbInitialData'
import dbTableQueries from './assets/dbTableQueries'
import dbTableUpdateQueries from './assets/dbTableUpdateQueries'

import Log from '../../../../services/Log/Log'
import BlocksoftDict from '../../../../../crypto/common/BlocksoftDict'

class DBInit {

    /**
     * @type {Array}
     * @private
     */
    #_dbInitialData = []
    /**
     * @type {Array}
     * @private
     */
    #_dbTableQueries = []
    /**
     * @type {Array}
     * @private
     */
    #_dbTableUpdateQueries = []

    /**
     * @type {*}
     * @private
     */
    _createTableStatus = {
        error: '---------- TABLE CREATE ERROR ----------',
        success: '---------- TABLE SUCCESSFULLY CREATED ----------'
    }

    /**
     * @type {*}
     * @private
     */
    _updateTableStatus = {
        init: '---------- DATA TABLE UPDATE START ----------',
        error: '---------- DATA TABLE UPDATE ERROR ----------',
        success: '---------- DATA TABLE SUCCESSFULLY UPDATED ----------'
    }

    /**
     * @type {*}
     * @private
     */
    _isEmptyStatus = {
        error: '---------- DATABASE IS EMPTY QUERY ERROR ----------',
        success: '---------- DATABASE ALREADY CREATED ----------'
    }

    constructor() {
        this.#_dbInitialData = dbInitialData
        this.#_dbTableQueries = dbTableQueries
        this.#_dbTableUpdateQueries = dbTableUpdateQueries
    }

    async init() {

        const { initQuery, isEmptyQuery } = this.#_dbTableQueries
        const { _createTableStatus, _isEmptyStatus } = this

        const dbInterface = new DBInterface()


        const res = await dbInterface.setQueryString(isEmptyQuery).query()
        if (res.array.length != 0) {
            Log.log(_isEmptyStatus.success)
            await this._update()
            return
        }


        for (let i = 0; i < initQuery.length; i++) {
            try {
                await dbInterface.setQueryString(initQuery[i].queryString).query()
                Log.log(_createTableStatus.success)
            } catch (e) {
                Log.err(e)
                Log.log(_createTableStatus.error)
            }
        }

        deleteUserPinCode()

        await this._initSettings()
        await this._initCurrency()
    }

    /**
     * @return {Promise<boolean>}
     * @private
     */
    async _update() {
        // Log.consoleStart()
        const { updateQuery, maxVersion } = this.#_dbTableUpdateQueries
        const { _updateTableStatus } = this

        const dbInterface = new DBInterface()

        let currentVersion = 0;

        let fromDB = await dbInterface.setQueryString(`SELECT [paramValue] FROM settings WHERE [paramKey]='dbVersion'`).query(true)
        if (fromDB.array && fromDB.array.length) {
            currentVersion = fromDB.array[0].paramValue * 1 // this was THE TRICK
        } else {
            await dbInterface.setQueryString(`INSERT INTO settings ([paramValue],[paramKey]) VALUES (1, 'dbVersion')`).query(true)
        }
        Log.log(_updateTableStatus.init)
        Log.log('!!! UPDATING CURRENT VERSION ' + currentVersion + ' NEXT VERSION ' + maxVersion)
        for (let i = currentVersion + 1; i<= maxVersion; i++) {
            if (!updateQuery[i]) continue
            let {queryString, checkQueryString, checkQueryField, afterFunction} = updateQuery[i]
            try {
                if(typeof queryString != 'undefined'){
                    if (checkQueryString && checkQueryField) {
                        let check = await dbInterface.setQueryString(checkQueryString).query(true)
                        check = check.array[0]
                        if (check && typeof check[checkQueryField] === 'undefined') {
                            await dbInterface.setQueryString(queryString).query(true)
                        }
                    } else {
                        await dbInterface.setQueryString(queryString).query(true)
                    }
                }
                if (typeof afterFunction != 'undefined') {
                    await afterFunction(dbInterface)
                }
                await dbInterface.setQueryString(`UPDATE settings SET paramValue='${i}' WHERE paramKey='dbVersion'`).query()
            } catch (e) {
                if (e.message.indexOf('duplicate column name') === -1) {
                    Log.err('DBInit._update error ' + e.message)
                    throw new Error('DB update error')
                } else {
                    Log.log('DBInit._update warning ' + e.message)
                }
            }
        }
        // Log.consoleStop()

    }


    /**
     * @return {Promise<void>}
     * @private
     */
    _initSettings = async () => {
        const { settings } = this.#_dbInitialData
        const { insertSettingsQuery } = this.#_dbTableQueries
        const { maxVersion } = this.#_dbTableUpdateQueries

        const dbInterface = new DBInterface()

        let tmpQuery = ''

        for (let prop in settings) {
            tmpQuery = `('${prop}','${settings[prop]}'), ${tmpQuery}`
        }

        let sql = `${insertSettingsQuery} ${tmpQuery} ('dbVersion', '${maxVersion}')`
        await dbInterface.setQueryString(sql).query()


    }

    /**
     * @return {Promise<void>}
     * @private
     */
    _initCurrency = async () => {

        const visibleCurrencies = ['BTC', 'ETH', 'ETH_USDT', 'ETH_SOUL', 'ETH_UAX']

        Log.log('DB/Init initCurrency called')

        const dbInterface = new DBInterface()

        try {
            let insertObjs = []

            for (let currencyCode of BlocksoftDict.Codes) {
                let settings = BlocksoftDict.Currencies[currencyCode]
                insertObjs.push({
                    currency_code: settings.currencyCode,
                    currency_rate_usd: 0,
                    currency_rate_json: '',
                    currency_rate_scan_time: '',
                    is_hidden: visibleCurrencies.indexOf(currencyCode) > -1 ? 0 : 1
                })
            }

            await dbInterface.setTableName('currency').setInsertData({ insertObjs }).insert()
            Log.log('DB/Init initCurrency finished')
        } catch (e) {
            Log.err('DB/Init initCurrency error ' + e.message)
        }

    }

}

export default new DBInit()
