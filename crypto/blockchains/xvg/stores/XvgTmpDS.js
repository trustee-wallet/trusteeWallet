
import Database from '@app/appstores/DataSource/Database';

const tableName = ' transactions_scanners_tmp'

class XvgTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'XVG'

    async getCache(address) {
        const res = await Database.query(`
                SELECT tmp_key, tmp_sub_key, tmp_val
                FROM ${tableName}
                WHERE currency_code='${this._currencyCode}'
                AND address='${address}'
                AND (tmp_sub_key='coins' OR tmp_sub_key='data')
                `)
        const tmp = {}
        if (res.array) {
            let row
            for (row of res.array) {
                let val = 1
                if (row.tmp_sub_key !== 'data') {
                    val = JSON.parse(Database.unEscapeString(row.tmp_val))
                }
                tmp[row.tmp_key + '_' + row.tmp_sub_key] = val
            }
        }
        return tmp
    }

    async saveCache(address, key, subKey, value) {
        const now = new Date().toISOString()
        const prepared = [{
            currency_code : this._currencyCode,
            address : address,
            tmp_key : key,
            tmp_sub_key : subKey,
            tmp_val : Database.escapeString(JSON.stringify(value)),
            created_at : now
        }]
        await Database.setTableName(tableName).setInsertData({insertObjs : prepared}).insert()
    }
}

export default new XvgTmpDS()
