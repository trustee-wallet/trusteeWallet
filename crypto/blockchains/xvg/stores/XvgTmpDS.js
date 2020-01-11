import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'

const tableName = ' transactions_scanners_tmp'

class XvgTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'XVG'

    async getCache(address) {
        const dbInterface = new DBInterface()
        const res = await dbInterface.setQueryString(`
                SELECT tmp_key, tmp_sub_key, tmp_val
                FROM ${tableName} 
                WHERE currency_code='${this._currencyCode}' 
                AND address='${address}'
                AND (tmp_sub_key='coins' OR tmp_sub_key='data')
                `).query()
        let tmp = {}
        if (res.array) {
            for (let row of res.array) {
                let val = 1
                if (row.tmp_sub_key !== 'data') {
                    val = JSON.parse(dbInterface.unEscapeString(row.tmp_val))
                }
                tmp[row.tmp_key + '_' + row.tmp_sub_key] = val
            }
        }
        return tmp
    }

    async saveCache(address, key, subKey, value) {
        const dbInterface = new DBInterface()
        let now = new Date().toISOString()
        let prepared = [{
            currency_code : this._currencyCode,
            address : address,
            tmp_key : key,
            tmp_sub_key : subKey,
            tmp_val : dbInterface.escapeString(JSON.stringify(value)),
            created_at : now
        }]
        await dbInterface.setTableName(tableName).setInsertData({insertObjs : prepared}).insert()
    }
}

export default new XvgTmpDS()
