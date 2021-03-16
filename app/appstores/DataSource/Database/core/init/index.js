
import { deleteUserPinCode } from '@haskkor/react-native-pincode'

import getInitialData from './assets/dbInitialData'
import getTableQueries from './assets/dbTableQueries'
import getTableUpdateQueries from './assets/dbTableUpdateQueries'

import Log from '@app/services/Log/Log'
import BlocksoftDict from '@crypto/common/BlocksoftDict'


export default class DBInit {
    /**
     * Instance of database interface
     * @type {Object}
     */
    #db;

    #initialData = getInitialData();
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
        const res = await this.#db.setQueryString(isEmptyQuery).query();
        let countError = 0;
        let updateError = false
        try {
            if (res.array.length !== 0) {
                Log.log(this.#isEmptyStatus.success);
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
                await this.#db.setQueryString(initQuery[i].queryString).query();
                Log.log(this.#createTableStatus.success);
            } catch (e) {
                Log.err('DBInit error in insert');
                Log.log(this.#createTableStatus.error);
                countError++;
            }
        }

        if (countError === 0) {
            const wallets = await this.#db.setQueryString('SELECT wallet_hash FROM wallet LIMIT 1').query();
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

        const res = await this.#db.setQueryString(`SELECT [paramValue] FROM settings WHERE [paramKey]='dbVersion'`).query(true);
        if (res.array && res.array.length) {
            currentVersion = res.array[0].paramValue * 1; // this was THE TRICK
        } else {
            await this.#db.setQueryString(`INSERT INTO settings ([paramValue],[paramKey]) VALUES (1, 'dbVersion')`).query(true);
        }

        Log.log(this.#updateTableStatus.init);
        Log.log('!!! UPDATING CURRENT VERSION ' + currentVersion + ' NEXT VERSION_2 ' + maxVersion);

        for (let i = currentVersion + 1; i <= maxVersion; i++) {
            if (!updateQuery[i]) continue;
            const { queryString, checkQueryString, checkQueryField, afterFunction } = updateQuery[i];
            try {
                if (typeof queryString !== 'undefined') {
                    if (checkQueryString && checkQueryField) {
                        let check = await this.#db.setQueryString(checkQueryString).query(true)
                        check = check.array[0]
                        if (check && typeof check[checkQueryField] === 'undefined') {
                            await this.#db.setQueryString(queryString).query(true)
                        }
                    } else {
                        await this.#db.setQueryString(queryString).query(true)
                    }
                }
                if (typeof afterFunction !== 'undefined') {
                    await afterFunction(this.#db)
                }
                await this.#db.setQueryString(`UPDATE settings SET paramValue='${i}' WHERE paramKey='dbVersion'`).query()
            } catch (e) {
                console.log(e)
                if (e.message.indexOf('duplicate column name') === -1) {
                    Log.err('DBInit._update error ' + e.message)
                    throw new Error('DB update error')
                } else {
                    Log.log('DBInit._update warning ' + e.message)
                    await this.#db.setQueryString(`UPDATE settings SET paramValue='${i}' WHERE paramKey='dbVersion'`).query()
                }
            }
        }
    }


    /**
     * @return {Promise<void>}
     * @private
     */
    _initSettings = async () => {
        const { settings } = this.#initialData;
        const { insertSettingsQuery } = this.#tableQueries;
        const { maxVersion } = this.#tableUpdateQueries;
        let tmpQuery = '';
        let prop;
        for (prop in settings) {
            tmpQuery = `('${prop}','${settings[prop]}'), ${tmpQuery}`;
        }
        const sql = `${insertSettingsQuery} ${tmpQuery} ('dbVersion', '${maxVersion}')`;
        await this.#db.setQueryString(sql).query();
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    _initCurrency = async () => {
        Log.log('DB/Init initCurrency called');
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
            Log.log('DB/Init initCurrency finished');
        } catch (e) {
            Log.err('DB/Init initCurrency error ' + e.message);
        }

    }
}

