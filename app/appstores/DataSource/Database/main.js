
import Log from '@app/services/Log/Log';
import config from '@app/config/config';

import { getSQLiteInstance } from './core/SQLiteDB';
import DBInit from './core/init';

import {
  toPreparedObject,
  toPreparedObjects,
} from './helpers';


class Database {
  /**
   * ### SQLite database instance.
   * Assembled object with both packages functionality:
   * - "react-native-sqlite-helper"
   * - "react-native-sqlite-storage"
   * @type {Object?}
   * @private
   */
  #db = null;

  /**
   * assembled tableName
   * @type {string}
   * @private
   */
  #tableName = '';

  /**
   * string to proceed query
   * @type {string}
   * @private
   */
  #queryString = '';

  /**
   * assembled object to insert data into the database
   * @type {object}
   * @private
   */
  #insertData = {};

  /**
   * assembled object to insert data into the database
   * @type {object}
   * @private
   */
  #updateData = {};

  /**
   * ### Database starting
   */
  async start() {
    if (this.#db !== null) return;
    this.#db = await getSQLiteInstance();
    let dbInit = new DBInit(this);
    await dbInit.init();
    dbInit = null;
  }

  /**
   * @param {string} badString
   * @return {string}
   */
  escapeString(badString) {
    if (!badString) return false;
    return badString.replace(/[']/g, 'quote');
  }

  /**
   * @param {string} goodString
   * @return {string}
   */
  unEscapeString(goodString) {
    if (!goodString) return false;
    return goodString.replace(/quote/g, '\'');
  }

  /**
   * @param {string} data
   * @return {Database}
   */
  setQueryString = (data) => {
    this.#queryString = data;
    return this;
  }

  /**
   * @return {Promise}
   */
  async query(throwError = false) {
    if (this.#db === null) await this.start();

    let res;
    const tmpArray = [];
    try {
      if (config.debug.appDBLogs) console.log('\n\n');
      res = await this.#db.query.executeSql(this.#queryString);
      if (config.debug.appDBLogs) console.log('\n\n');
    } catch (e) {
      e.message = `DB QUERY ERROR: ${this.#queryString} ${e.message}`;
      e.code = 'ERROR_SYSTEM';
      // before db init sometimes
      if (e.message.indexOf('notifsSavedToken') === -1) {
        if (throwError) {
          throw e;
        } else {
          Log.err(e);
        }
      }
    }

    if (typeof res === 'undefined' || !res || !res[0]) {
      return { array: [], rowsAffected: 0 };
    }

    for (let i = 0; i < res[0].rows.length; i++) {
      tmpArray.push(res[0].rows.item(i));
    }
    const tmpRowsAffected = res[0].rowsAffected;
    return { array: tmpArray, rowsAffected: tmpRowsAffected };
  }


  /**
   * @param {string} tableName
   * @return {Database}
   */
  setTableName(tableName) {
    this.#tableName = tableName;
    return this;
  }

  /**
   * @param {Object} data
   * @param {Object[]} data.insertObjs
   * @return {Database}
   */
  setInsertData(data) {
    if (!data.insertObjs) throw new Error('undefined data.insertObjs');
    if (!data.insertObjs.length) throw new Error('data.insertObjs should be Array ' + JSON.stringify(data));
    this.#insertData = data;
    return this;
  }

  /**
   * @return {Promise<boolean>}
   */
  async insert() {
    let { tableName, insertObjs } = this.#insertData;
    if (!tableName) tableName = this.#tableName;
    const preparedObjectsArray = toPreparedObjects(insertObjs);
    try {
      if (config.debug.appDBLogs) console.log('\n\n');
      await this.#db.insertItems(tableName, preparedObjectsArray);
      if (config.debug.appDBLogs) console.log('\n\n');
    } catch (e) {
      e.message = `DB INSERT ERROR: ${tableName} ${JSON.stringify(preparedObjectsArray)} ${e.message}`
      e.code = 'ERROR_SYSTEM';
      Log.err(e);
    }
    return true;
  }

  /**
   * @param {Object} data
   * @param {Object} data.updateObj
   * @param {Object} data.key
   * @return {Database}
   */
  setUpdateData(data) {
    if (!data.updateObj) throw new Error('undefined data.updateObj');
    if (!data.key) throw new Error('undefined data.key');
    this.#updateData = data;
    return this;
  }

  /**
   * @return {Promise<boolean>}
   */
  async update() {
    let { tableName, updateObj, key } = this.#updateData;
    if (!tableName) tableName = this.#tableName;
    let preparedObject = {};
    let preparedKey = {};
    try {
      preparedObject = toPreparedObject(updateObj);
      preparedKey = toPreparedObject(key);
    } catch (e) {
      e.message = `DBI/update _toPreparedObject ${e.message}`;
      throw e;
    }

    let res = false;
    try {
      if (config.debug.appDBLogs) console.log('\n\n');
      res = await this.#db.updateItem(tableName, preparedObject, preparedKey);
      if (config.debug.appDBLogs) console.log('\n\n');
    } catch (e) {
      e.message = `DB UPDATE ERROR: ${tableName} ${JSON.stringify(preparedObject)} ${e.message}`;
      e.code = 'ERROR_SYSTEM';
      Log.err(e);
    }
    return res;
  }
}

export default new Database();
