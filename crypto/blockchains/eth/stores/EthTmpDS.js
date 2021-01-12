import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftBN from '../../../common/BlocksoftBN'

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
                SELECT tmp_key, tmp_sub_key, tmp_val, created_at
                FROM ${tableName} 
                WHERE currency_code='${this._currencyCode}' 
                AND address='${address}'
                AND tmp_key='nonces'
                `).query()
        CACHE_TMP[address] = {}
        let maxValue = -1
        let maxScanned = -1
        let maxSuccess = -1
        const forBalances = {}
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
            for (const row of res.array) {
                const val = row.tmp_val * 1
                if (row.tmp_sub_key === 'maxScanned' || row.tmp_sub_key === 'maxSuccess') {
                    // do nothing
                } else {
                    if (val > maxSuccess) {
                        const tmp = row.tmp_sub_key.split('_')
                        if (typeof tmp[1] !== 'undefined') {
                            forBalances[tmp[1]] = val
                        }
                    }
                }
            }
        }
        const amountBN = {}
        let queryLength = 0
        let queryTxs = ''
        for (const txHash in forBalances) {
            let tmp = await dbInterface.setQueryString(`SELECT currency_code AS currencyCode, address_amount as addressAmount, transaction_status as transactionStatus, 
                        transaction_hash AS transactionHash
                        FROM transactions WHERE transaction_hash='${txHash}' AND currency_code LIKE '%ETH%'`).query()
            if (tmp && tmp.array && typeof tmp.array[0] !== 'undefined') {
                tmp = tmp.array[0]
                if (tmp.transactionStatus === 'new') {
                    const amount = tmp.addressAmount
                    if (typeof amountBN[tmp.currencyCode] === 'undefined') {
                        amountBN[tmp.currencyCode] = new BlocksoftBN(0)
                    }
                    queryLength++
                    queryTxs += tmp.transactionHash + ','
                    amountBN[tmp.currencyCode].add(amount)
                } else if (tmp.transactionStatus === 'missing') {
                    if (maxSuccess > forBalances[txHash]) {
                        maxSuccess = forBalances[txHash] - 1
                    }
                }
            }
        }
        CACHE_TMP[address]['maxValue'] = maxValue
        CACHE_TMP[address]['maxScanned'] = maxScanned
        CACHE_TMP[address]['maxSuccess'] = maxSuccess > maxScanned ? maxSuccess : maxScanned
        CACHE_TMP[address]['amountBlocked'] = {}
        CACHE_TMP[address]['queryLength'] = queryLength
        CACHE_TMP[address]['queryTxs'] = queryTxs
        for (const key in amountBN) {
            CACHE_TMP[address]['amountBlocked'][key] = amountBN[key].toString()
        }
        return CACHE_TMP[address]
    }

    async getMaxNonce(scanAddress) {
        const address = scanAddress.toLowerCase()
        if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            await this.getCache(address)
        }
        return {
            value: CACHE_TMP[address]['maxValue'],
            scanned: CACHE_TMP[address]['maxScanned'],
            success: CACHE_TMP[address]['maxSuccess'],
            amountBlocked: CACHE_TMP[address]['amountBlocked'],
            queryLength: CACHE_TMP[address]['queryLength'],
            queryTxs: CACHE_TMP[address]['queryTxs']
        }
    }

    getMaxStatic(scanAddress) {
        const address = scanAddress.toLowerCase()
        if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            this.getCache(address)
            return { value: -1, scanned: -1, success: -1, amountBlocked: {}, queryLength: 0 }
        }
        return {
            value: CACHE_TMP[address]['maxValue'],
            scanned: CACHE_TMP[address]['maxScanned'],
            success: CACHE_TMP[address]['maxSuccess'],
            amountBlocked: CACHE_TMP[address]['amountBlocked'],
            queryLength: CACHE_TMP[address]['queryLength'],
            queryTxs: CACHE_TMP[address]['queryTxs']
        }
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
            if (res.array[0].tmp_val * 1 >= value) {
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
