/**
 * @version 0.52
 */
import Database from '@app/appstores/DataSource/Database';

const tableName = ' transactions_scanners_tmp'

class SolTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'SOL'

    async getCache(address) {
        const sql = `
                SELECT tmp_key, tmp_val
                FROM ${tableName}
                WHERE currency_code='${this._currencyCode}'
                AND address='${address}'
                `
        const res = await Database.query(sql)
        const tmp = {}
        if (res.array) {
            for (const row of res.array) {
                tmp[row.tmp_key] = row.tmp_val
            }
        }
        return tmp
    }

    async saveCache(address, key, value) {
        const now = new Date().toISOString()
        const prepared = [{
            currency_code : this._currencyCode,
            address : address,
            tmp_key : key,
            tmp_val : value,
            created_at : now
        }]
        await Database.setTableName(tableName).setInsertData({insertObjs : prepared}).insert()
    }

    async updateCache(address, key, value) {
        const sql = `
        UPDATE ${tableName} SET tmp_val='${value}'
        WHERE address='${address}' AND tmp_key='${key}'
        AND currency_code='${this._currencyCode}'
        `
        await Database.query(sql)
    }
}

export default new SolTmpDS()
