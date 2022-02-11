
import Database from '@app/appstores/DataSource/Database';

const tableName = ' transactions_scanners_tmp'

class OneTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'ONE'

    async getCache(address) {
        const res = await Database.query(`
                SELECT tmp_key, tmp_sub_key, tmp_val
                FROM ${tableName}
                WHERE currency_code='${this._currencyCode}'
                AND address='${address}'
                AND tmp_key='last_tx'
                `)
        const tmp = {}
        if (res.array) {
            let row
            for (row of res.array) {
                tmp[row.tmp_sub_key] = row.tmp_val
            }
        }
        return tmp
    }

    async saveCache(address, subKey, value) {
        const now = new Date().toISOString()
        const prepared = [{
            currency_code : this._currencyCode,
            address : address,
            tmp_key : 'last_tx',
            tmp_sub_key : subKey,
            tmp_val : value,
            created_at : now
        }]
        await Database.setTableName(tableName).setInsertData({insertObjs : prepared}).insert()
    }
}

export default new OneTmpDS()
