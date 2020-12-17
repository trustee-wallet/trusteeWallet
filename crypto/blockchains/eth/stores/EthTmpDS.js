import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'

const tableName = 'transactions_scanners_tmp'

const CACHE_TMP = {}

class EthTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'ETH'

    async getCache(scanAddress) {
        const address = scanAddress.toLowerCase()
        const dbInterface = new DBInterface()
        const res = await dbInterface.setQueryString(`
                SELECT tmp_key, tmp_sub_key, tmp_val
                FROM ${tableName} 
                WHERE currency_code='${this._currencyCode}' 
                AND address='${address}'
                AND tmp_key='nonces'
                `).query()
        CACHE_TMP[address] = {}
        let maxValue = -1
        let maxScanned = -1
        let maxSuccess = -1
        if (res.array) {
            for (const row of res.array) {
                const val = row.tmp_val * 1
                if (row.tmp_sub_key === 'maxScanned') {
                    if (val > maxScanned) {
                        maxScanned = val
                    }
                } else if (row.tmp_sub_key === 'maxSuccess') {
                    if (val > maxSuccess) {
                        maxSuccess = val
                    }
                } else {
                    if (val > maxValue) {
                        maxValue = val
                    }
                }
                CACHE_TMP[address][row.tmp_sub_key] = val
            }
        }
        CACHE_TMP[address]['maxValue'] = maxValue
        CACHE_TMP[address]['maxScanned'] = maxScanned
        CACHE_TMP[address]['maxSuccess'] = maxSuccess
        return CACHE_TMP[address]
    }

    async getMaxNonce(scanAddress) {
        const address = scanAddress.toLowerCase()
        if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            await this.getCache(address)
        }
        return { value: CACHE_TMP[address]['maxValue'], scanned: CACHE_TMP[address]['maxScanned'], success: CACHE_TMP[address]['maxSuccess'] }
    }

    getMaxStatic(scanAddress) {
        const address = scanAddress.toLowerCase()
        if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            this.getCache(address)
            return { value: -1, scanned: -1, success: -1}
        }
        return { value: CACHE_TMP[address]['maxValue'], scanned: CACHE_TMP[address]['maxScanned'], success: CACHE_TMP[address]['maxSuccess'] }
    }

    async removeNonce(scanAddress, key) {
        const address = scanAddress.toLowerCase()
        const dbInterface = new DBInterface()
        const where = `WHERE currency_code='${this._currencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        await dbInterface.setQueryString(`DELETE FROM ${tableName} ${where}`).query()
        await this.getCache(address)
    }

    async saveNonce(scanAddress, key, value) {
        const address = scanAddress.toLowerCase()
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()
        value = value * 1

        const where = `WHERE currency_code='${this._currencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        const res = await dbInterface.setQueryString(`SELECT tmp_val FROM ${tableName} ${where}`).query()
        if (res && res.array && res.array.length > 0) {
            if (res.array[0].tmp_val*1 >= value) {
                return true
            }
            await dbInterface.setQueryString(`DELETE FROM ${tableName} ${where}`).query()
        }

        const prepared = [{
            currency_code: this._currencyCode,
            address: address.toLowerCase(),
            tmp_key: 'nonces',
            tmp_sub_key: key,
            tmp_val: value,
            created_at: now
        }]
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
        await this.getCache(address)
    }
}

export default new EthTmpDS()
