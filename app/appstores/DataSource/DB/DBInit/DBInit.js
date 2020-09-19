/**
 * @version 0.9
 */
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
        let countError = 0
        try {
            if (res.array.length !== 0) {
                Log.log(_isEmptyStatus.success)
                await this._update()
                return
            }
        } catch (e) {
            Log.err('DBInit error on update')
            countError++
        }


        for (let i = 0; i < initQuery.length; i++) {
            try {
                await dbInterface.setQueryString(initQuery[i].queryString).query()
                Log.log(_createTableStatus.success)
            } catch (e) {
                Log.err('DBInit error in insert')
                Log.log(_createTableStatus.error)
                countError++
            }
        }

        if (countError === 0) {
            const wallets = await dbInterface.setQueryString('SELECT wallet_hash FROM wallet LIMIT 1').query()
            if (!wallets || !wallets.array || wallets.array.length === 0) {
                // noinspection ES6MissingAwait
                deleteUserPinCode()
            }
        }

        await this._initSettings()
        await this._initCurrency()
    }

    /**
     * @return {Promise<boolean>}
     * @private
     */
    async _update() {
        const { updateQuery, maxVersion } = this.#_dbTableUpdateQueries
        const { _updateTableStatus } = this

        const dbInterface = new DBInterface()

        let currentVersion = 0;

        const fromDB = await dbInterface.setQueryString(`SELECT [paramValue] FROM settings WHERE [paramKey]='dbVersion'`).query(true)
        if (fromDB.array && fromDB.array.length) {
            currentVersion = fromDB.array[0].paramValue * 1 // this was THE TRICK
        } else {
            await dbInterface.setQueryString(`INSERT INTO settings ([paramValue],[paramKey]) VALUES (1, 'dbVersion')`).query(true)
        }
        Log.log(_updateTableStatus.init)
        Log.log('!!! UPDATING CURRENT VERSION ' + currentVersion + ' NEXT VERSION ' + maxVersion)
        for (let i = currentVersion + 1; i<= maxVersion; i++) {
            if (!updateQuery[i]) continue
            const {queryString, checkQueryString, checkQueryField, afterFunction} = updateQuery[i]
            try {
                if(typeof queryString !== 'undefined'){
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
                if (typeof afterFunction !== 'undefined') {
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
        let prop
        for (prop in settings) {
            tmpQuery = `('${prop}','${settings[prop]}'), ${tmpQuery}`
        }

        const sql = `${insertSettingsQuery} ${tmpQuery} ('dbVersion', '${maxVersion}')`
        await dbInterface.setQueryString(sql).query()
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    _initCurrency = async () => {

        Log.log('DB/Init initCurrency called')

        const dbInterface = new DBInterface()

        try {
            const insertObjs = []
            let currencyCode
            for (currencyCode of BlocksoftDict.Codes) {
                const settings = BlocksoftDict.Currencies[currencyCode]
                insertObjs.push({
                    currencyCode: settings.currencyCode,
                    currencyRateUsd: 0,
                    currencyRateJson: '',
                    currencyRateScanTime: '',
                    isHidden: BlocksoftDict.VisibleCodes.indexOf(currencyCode) > -1 ? 0 : 1
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
