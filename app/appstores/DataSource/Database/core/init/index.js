
import { deleteUserPinCode } from '@haskkor/react-native-pincode'

import getTableQueries from './assets/dbTableQueries'
import getTableUpdateQueries from './assets/dbTableUpdateQueries'

import Log from '@app/services/Log/Log'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import settingsDS from '@app/appstores/DataSource/Settings/Settings'

export default class DBInit {
    /**
     * Instance of database interface
     * @type {Object}
     */
    #db;

    #tableQueries = getTableQueries();
    #tableUpdateQueries = getTableUpdateQueries();

    #createTableStatus = {
        error: '---------- TABLE CREATE ERROR ----------',
        success: '---------- TABLE SUCCESSFULLY CREATED ----------'
    };
    #updateTableStatus = {
        init: '---------- DATA TABLE UPDATE START ----------',
        error: '---------- DATA TABLE UPDATE ERROR ----------',
        success: '---------- DATA TABLE SUCCESSFULLY UPDATED ----------'
    };
    #isEmptyStatus = {
        error: '---------- DATABASE IS EMPTY QUERY ERROR ----------',
        success: '---------- DATABASE ALREADY CREATED ----------'
    };

    constructor(dbInterface) {
        this.#db = dbInterface;
    }

    async init() {
        const { initQuery, isEmptyQuery } = this.#tableQueries;
        const res = await this.#db.query(isEmptyQuery)
        let countError = 0;
        let updateError = false
        try {
            if (res.array.length !== 0) {
                await this.#update();
                return;
            }
        } catch (e) {
            Log.err('DBInit error on update');
            updateError = true
            countError++;
        }

        for (let i = 0; i < initQuery.length; i++) {
            try {
                await this.#db.query(initQuery[i].queryString)
            } catch (e) {
                Log.err('DBInit error in insert');
                Log.log(this.#createTableStatus.error);
                countError++;
            }
        }

        if (countError === 0) {
            const wallets = await this.#db.query('SELECT wallet_hash FROM wallet LIMIT 2')
            if (!wallets || !wallets.array || wallets.array.length === 0) {
                deleteUserPinCode();
            }
        }

        if (!updateError) {
            await this._initSettings();
            await this._initCurrency();
        }
    }

    /**
    //  * @return {Promise<boolean>}
     * @private
     */
    #update = async () => {
        const { updateQuery, maxVersion } = this.#tableUpdateQueries;
        let currentVersion = 0;

        const res = await this.#db.query(`SELECT [paramValue] FROM settings WHERE [paramKey]='dbVersion'`, true);
        if (res.array && res.array.length) {
            currentVersion = res.array[0].paramValue * 1; // this was THE TRICK
        } else {
            await this.#db.query(`INSERT INTO settings ([paramValue],[paramKey]) VALUES (1, 'dbVersion')`, true);
        }

        for (let i = currentVersion + 1; i <= maxVersion; i++) {
            if (!updateQuery[i]) continue;
            const { queryString, checkQueryString, checkQueryField, afterFunction } = updateQuery[i];
            try {
                if (typeof queryString !== 'undefined') {
                    if (checkQueryString && checkQueryField) {
                        let check = await this.#db.query(checkQueryString, true)
                        check = check.array[0]
                        if (check && typeof check[checkQueryField] === 'undefined') {
                            await this.#db.query(queryString, true)
                        }
                    } else {
                        await this.#db.query(queryString, true)
                    }
                }
                if (typeof afterFunction !== 'undefined') {
                    await afterFunction(this.#db)
                }
                await this.#db.query(`UPDATE settings SET paramValue='${i}' WHERE paramKey='dbVersion'`)
            } catch (e) {
                console.log(e)
                if (e.message.indexOf('duplicate column name') === -1) {
                    Log.err('DBInit._update error ' + e.message)
                    throw new Error('DB update error')
                } else {
                    await this.#db.query(`UPDATE settings SET paramValue='${i}' WHERE paramKey='dbVersion'`).query()
                }
            }
        }
    }


    /**
     * @return {Promise<void>}
     * @private
     */
    _initSettings = async () => {
        const { maxVersion } = this.#tableUpdateQueries;
        await settingsDS.setSettings('dbVersion', maxVersion)
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    _initCurrency = async () => {
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
            await this.#db.setTableName('currency').setInsertData({ insertObjs }).insert();
        } catch (e) {
            Log.err('DB/Init initCurrency error ' + e.message);
        }

    }
}

