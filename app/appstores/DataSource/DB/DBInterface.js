/**
 * Database controller realization
 *
 * Opens the connection to the database and
 * contains methods for working with it (insert, update and custom query)
 *
 */

import DBOpen from './DBOpen';
import Log from '../../../services/Log/Log'

class DBInterface {

    /**
     * assembled object with all necessary methods
     * @type {object}
     * @private
     */
    #_db = {}

    /**
     * assembled tableName
     * @type {string}
     * @private
     */
    #_tableName = ''

    /**
     * string to proceed query
     * @type {string}
     * @private
     */
    #_queryString = ''

    /**
     * assembled object to insert data into the database
     * @type {object}
     * @private
     */
    #_insertData = {}

    /**
     * assembled object to insert data into the database
     * @type {object}
     * @private
     */
    #_updateData = {}

    constructor() {
        this.#_db = DBOpen.getDB()
    }

    /**
     * @param {string} data
     * @return {DBInterface}
     */
    setQueryString = (data) => {
        this.#_queryString = data
        return this
    }

    /**
     * @return {Promise}
     */
    async query() {

        let tmpArray = []
        let tmpRowsAffected
        let res

        try {
            console.log('')
            console.log('')
            res = await this.#_db.query.executeSql(this.#_queryString)
            console.log('')
            console.log('')
        } catch (e) {
            e.message = 'DB QUERY ERROR: ' + this.#_queryString + ' ' +  e.message
            e.code = 'ERROR_SYSTEM'
            Log.err(e)
        }

        if (!res || !res[0]) {
            return { array : [], rowsAffected : 0 }
        }

        for(let i = 0; i < res[0].rows.length; i++) {
            tmpArray.push(res[0].rows.item(i))
        }

        tmpRowsAffected = res[0].rowsAffected

        return { array : tmpArray, rowsAffected : tmpRowsAffected  }
    }


    /**
     * @param {string} tableName
     * @return {DBInterface}
     */
    setTableName(tableName) {
        this.#_tableName = tableName
        return this
    }

    /**
     * @param {Object} data
     * @param {Object[]} data.insertObjs
     * @return {DBInterface}
     */
    setInsertData(data) {
        if (typeof(data.insertObjs) === 'undefined' || !data.insertObjs) {
            throw new Error('undefined data.insertObjs')
        }
        if (typeof(data.insertObjs.length) === 'undefined' || !data.insertObjs.length) {
            throw new Error('data.insertObjs should be Array ' + JSON.stringify(data))
        }
        this.#_insertData = data
        return this
    }

    /**
     * @return {Promise<boolean>}
     */
    async insert() {
        let { tableName, insertObjs } = this.#_insertData
        if (!tableName) {
            tableName = this.#_tableName
        }
        let preparedObjectsArray = this._toPreparedObjects(insertObjs)
        try {
            console.log('')
            console.log('')
            await this.#_db.insertItems(tableName, preparedObjectsArray)
            console.log('')
            console.log('')
        } catch (e) {
            e.message = 'DB INSERT ERROR: ' + tableName + ' ' + JSON.stringify(preparedObjectsArray) + ' ' +  e.message
            e.code = 'ERROR_SYSTEM'
            Log.err(e)
        }

        return true
    }

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {DBInterface}
     */
    setUpdateData(data) {
        if (typeof(data.updateObj) === 'undefined' || !data.updateObj) {
            throw new Error('undefined data.updateObj')
        }
        if (typeof(data.key) === 'undefined' || !data.key) {
            throw new Error('undefined data.key')
        }
        this.#_updateData = data
        return this
    }

    /**
     * @return {Promise<boolean>}
     */
    async update() {
        let { tableName, updateObj, key } = this.#_updateData
        if (!tableName) {
            tableName = this.#_tableName
        }
        let preparedObject = {}
        try {
            preparedObject = this._toPreparedObject(updateObj)
        } catch (e) {
            e.message = 'DBI/update _toPreparedObject ' + e.message
            throw e
        }
        try {
            console.log('')
            console.log('')
            await this.#_db.updateItem(tableName, preparedObject, key)
            console.log('')
            console.log('')
        } catch (e) {
            e.message = 'DB UPDATE ERROR: ' + tableName + ' ' + JSON.stringify(preparedObject) + ' ' + e.message
            e.code = 'ERROR_SYSTEM'
            Log.err(e)
        }
        return true
    }

    /**
     * @param {Object[]} insertArray
     * @return {Object[]}
     * @private
     */
    _toPreparedObjects(insertArray) {
        for (let i = 0, ic = insertArray.length; i<ic; i++) {
            insertArray[i] = this._toPreparedObject(insertArray[i])
        }
        return insertArray
    }

    /**
     * @param {Object} updateObj
     * @return {Object}
     * @private
     */
    _toPreparedObject(updateObj) {
        let preparedObject = {}
        let objectKeys = Object.keys(updateObj)
        if (objectKeys) {
            for (let objectKey of objectKeys) {
                preparedObject[this._toSnake(objectKey)] = updateObj[objectKey]
            }
        }
        return preparedObject
    }

    /**
     * @param {string} str
     * @return {string}
     * @private
     */
    _toSnake(str) {
        return str.split(/(?=[A-Z])/).join('_').toLowerCase()
    }

}

export default DBInterface
