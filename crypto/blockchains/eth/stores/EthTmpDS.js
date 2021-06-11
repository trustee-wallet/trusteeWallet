
import Database from '@app/appstores/DataSource/Database';
import BlocksoftBN from '../../../common/BlocksoftBN'

const tableName = 'transactions_scanners_tmp'

const CACHE_TMP = {}

class EthTmpDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'ETH'

    async setSuccess(txHash) {
        await Database.setQueryString(`UPDATE transactions SET transaction_status = 'success' WHERE transaction_hash='${txHash}' AND (currency_code LIKE '%ETH%' OR currency_code LIKE 'CUSTOM_%') `).query()
    }

    async getCache(scanAddress, toRemove = false) {
        const address = scanAddress.toLowerCase()
        const res = await Database.setQueryString(`
                SELECT id, tmp_key, tmp_sub_key, tmp_val, created_at
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
                    const tmp = row.tmp_sub_key.split('_')
                    if (typeof tmp[1] !== 'undefined') {
                        const txHash = tmp[1]
                        if (toRemove && typeof toRemove[txHash] !== 'undefined') {
                            console.log('remove ' + txHash)
                            await Database.setQueryString(`DELETE FROM ${tableName} WHERE id=${row.id}`).query()
                        } else {
                            if (val > maxSuccess) {
                                forBalances[txHash] = val
                            }
                        }
                    }
                }
            }
        }

        const amountBN = {}
        let queryLength = 0
        let queryTxs = []
        for (const txHash in forBalances) {
            const tmps = await Database.setQueryString(`SELECT currency_code AS currencyCode,
                        address_amount as addressAmount,
                        transaction_status as transactionStatus
                        FROM transactions
                        WHERE transaction_hash='${txHash}'
                        AND (currency_code LIKE '%ETH%' OR currency_code LIKE 'CUSTOM_%')
                        `).query()
            if (tmps && tmps.array && typeof tmps.array[0] !== 'undefined') {
                let txCurrencyCode = ''
                for (const tmp of tmps.array) {
                    if (tmp.currencyCode === 'ETH' || tmp.currencyCode === 'ETH_ROPSTEN') {
                        if (txCurrencyCode === '') {
                            txCurrencyCode = tmp.currencyCode
                        }
                    } else {
                        txCurrencyCode = tmp.currencyCode
                    }
                }
                if (txCurrencyCode !== '') {
                    for (const tmp of tmps.array) {
                        if (tmp.currencyCode !== txCurrencyCode) continue
                        if (tmp.transactionStatus === 'new') {
                            const amount = tmp.addressAmount
                            if (typeof amountBN[tmp.currencyCode] === 'undefined') {
                                amountBN[tmp.currencyCode] = new BlocksoftBN(0)
                            }
                            queryLength++
                            queryTxs.push({ currencyCode: tmp.currencyCode, txHash })
                            amountBN[tmp.currencyCode].add(amount)
                        } else if (tmp.transactionStatus === 'missing') {
                            if (maxSuccess > forBalances[txHash]) {
                                maxSuccess = forBalances[txHash] - 1
                            }
                        }
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

    async getMaxNonce(mainCurrencyCode, scanAddress) {
        if (mainCurrencyCode === 'BNB') {
            return false
        }
        const address = scanAddress.toLowerCase()
        // if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            await this.getCache(address)
        //}
        return {
            maxValue: CACHE_TMP[address]['maxValue'],
            maxScanned: CACHE_TMP[address]['maxScanned'],
            maxSuccess: CACHE_TMP[address]['maxSuccess'],
            amountBlocked: CACHE_TMP[address]['amountBlocked'],
            queryLength: CACHE_TMP[address]['queryLength'],
            queryTxs: CACHE_TMP[address]['queryTxs']
        }
    }

    async removeNonce(mainCurrencyCode, scanAddress, key) {
        if (mainCurrencyCode === 'BNB') {
            return false
        }
        const address = scanAddress.toLowerCase()
        const where = `WHERE currency_code='${this._currencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        await Database.setQueryString(`DELETE FROM ${tableName} ${where}`).query()
        await this.getCache(address)
    }

    async saveNonce(mainCurrencyCode, scanAddress, key, value) {
        if (mainCurrencyCode === 'BNB') {
            return false
        }
        const address = scanAddress.toLowerCase()
        const now = new Date().toISOString()
        value = value * 1

        const where = `WHERE currency_code='${this._currencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        const res = await Database.setQueryString(`SELECT tmp_val FROM ${tableName} ${where}`).query()
        if (res && res.array && res.array.length > 0) {
            if (res.array[0].tmp_val * 1 >= value) {
                return true
            }
            await Database.setQueryString(`DELETE FROM ${tableName} ${where}`).query()
        }

        const prepared = [{
            currency_code: this._currencyCode,
            address: address.toLowerCase(),
            tmp_key: 'nonces',
            tmp_sub_key: key,
            tmp_val: value,
            created_at: now
        }]
        await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
        await this.getCache(address)
    }
}

export default new EthTmpDS()
