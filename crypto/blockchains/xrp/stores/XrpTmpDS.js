
import Database from '@app/appstores/DataSource/Database';

const tableName = 'transactions_scanners_tmp'

class XrpTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'XRP'

    _valKey = 'ledg'

    _isSaved = false

    async getCache() {
        const res = await Database.query(`
                SELECT id, tmp_key, tmp_val
                FROM ${tableName}
                WHERE currency_code='${this._currencyCode}'
                AND tmp_key='${this._valKey}'
                `)
        let tmp = {}
        const idsToRemove = []
        if (res.array) {
            let row
            let found = false
            for (row of res.array) {
                if (found) {
                    idsToRemove.push(row.id)
                } else {
                    try {
                        tmp = JSON.parse(Database.unEscapeString(row.tmp_val))
                        this._isSaved = true
                        found = true
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

    async saveCache(value) {
        const tmp = Database.escapeString(JSON.stringify(value))
        const now = new Date().toISOString()
        if (this._isSaved) {
            await Database.query(`UPDATE ${tableName} SET tmp_val='${tmp}' WHERE tmp_key='${this._valKey}' AND currency_code='${this._currencyCode}'`)
        } else {
            const prepared = [{
                currency_code: this._currencyCode,
                tmp_key: this._valKey,
                tmp_val: tmp,
                created_at: now
            }]
            await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
            this._isSaved = true
        }
    }
}

export default new XrpTmpDS()
