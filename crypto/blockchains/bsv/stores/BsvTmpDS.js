import Database from '@app/appstores/DataSource/Database';

const tableName = 'transactions_scanners_tmp'

class BsvTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'BSV'

    _valKey = 'txs'

    _isSaved = false

    async getCache() {
        const res = await Database.query(`
                SELECT id, tmp_key, tmp_sub_key, tmp_val
                FROM ${tableName}
                WHERE currency_code='${this._currencyCode}'
                AND tmp_key='${this._valKey}'
                `)
        let tmp = {}
        const idsToRemove = []
        if (res.array) {
            let row
            for (row of res.array) {
                if (typeof tmp[row.tmp_sub_key] !== 'undefined') {
                    idsToRemove.push(row.id)
                } else {
                    try {
                        tmp[row.tmp_sub_key] = JSON.parse(Database.unEscapeString(row.tmp_val))
                    } catch (e) {
                        idsToRemove.push(row.id)
                    }
                }
            }
            if (idsToRemove.length > 0) {
                await Database.query(`DELETE FROM ${tableName} WHERE id IN (${idsToRemove.join(',')})`)
            }
        }
        return tmp
    }

    async saveCache(txid, value) {
        const tmp = Database.escapeString(JSON.stringify(value))
        const now = new Date().toISOString()
        const prepared = [{
            currency_code: this._currencyCode,
            tmp_key: this._valKey,
            tmp_sub_key: txid,
            tmp_val: tmp,
            created_at: now
        }]
        await Database.setTableName(tableName).setInsertData({insertObjs: prepared}).insert()
    }
}

export default new BsvTmpDS()
