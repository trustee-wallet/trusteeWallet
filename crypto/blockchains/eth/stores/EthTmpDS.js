
import Database from '@app/appstores/DataSource/Database';
import BlocksoftBN from '../../../common/BlocksoftBN'

const tableName = 'transactions_scanners_tmp'

const CACHE_TMP = {}

class EthTmpDS {
    async setSuccess(txHash) {
        await Database.query(`UPDATE transactions SET transaction_status = 'success' WHERE transaction_hash='${txHash}'`)
    }

    async getCache(mainCurrencyCode, scanAddress, toRemove = false) {
        const address = scanAddress.toLowerCase()
        const res = await Database.query(`
                SELECT id, tmp_key, tmp_sub_key, tmp_val, created_at
                FROM ${tableName}
                WHERE currency_code='${mainCurrencyCode}'
                AND address='${address}'
                AND tmp_key='nonces'
                `)
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
                if (row.tmp_sub_key === 'maxScanned' || row.tmp_sub_key === 'maxSuccess' || !row.tmp_sub_key || typeof row.tmp_sub_key === 'undefined') {
                    // do nothing
                } else {
                    const tmp = row.tmp_sub_key.split('_')
                    if (typeof tmp[1] !== 'undefined') {
                        const txHash = tmp[1]
                        if (toRemove && typeof toRemove[txHash] !== 'undefined') {
                            await Database.query(`DELETE FROM ${tableName} WHERE id=${row.id}`)
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
            const tmps = await Database.query(`SELECT currency_code AS currencyCode,
                        address_amount as addressAmount,
                        transaction_status as transactionStatus
                        FROM transactions
                        WHERE transaction_hash='${txHash}'
                        AND (currency_code LIKE '%ETH%' OR currency_code LIKE 'CUSTOM_%')
                        `)
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

                        let recheckRBFStatus = 'none'
                        if (tmp.transactionStatus === 'new' || tmp.transactionStatus === 'confirming') {
                            const recheckTmp = await Database.query(`SELECT transaction_status as transactionStatus FROM transactions WHERE transactions_other_hashes LIKE '%${txHash}%'`)
                            if (recheckTmp && recheckTmp.array && typeof recheckTmp.array[0] !== 'undefined') {
                                recheckRBFStatus = recheckTmp.array[0].transactionStatus
                                if (recheckRBFStatus !== 'new') {
                                    await Database.query(`UPDATE transactions SET transaction_status='${recheckRBFStatus}'
                                            WHERE transaction_hash='${txHash}'
                                            AND (currency_code LIKE '%ETH%' OR currency_code LIKE 'CUSTOM_%')
                                            `)
                                }
                                tmp.transactionStatus = recheckRBFStatus
                            }
                        }
                        if (tmp.transactionStatus === 'new') {
                            const amount = tmp.addressAmount
                            if (typeof amountBN[tmp.currencyCode] === 'undefined') {
                                amountBN[tmp.currencyCode] = new BlocksoftBN(0)
                            }
                            queryLength++
                            queryTxs.push({ currencyCode: tmp.currencyCode, txHash, recheckRBFStatus })
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
        if (mainCurrencyCode !== 'ETH') {
            return false
        }
        const address = scanAddress.toLowerCase()
        // if (typeof CACHE_TMP[address] === 'undefined' || typeof CACHE_TMP[address]['maxValue'] === 'undefined') {
            await this.getCache(mainCurrencyCode, address)
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
        if (mainCurrencyCode !== 'ETH') {
            return false
        }
        const address = scanAddress.toLowerCase()
        const where = `WHERE currency_code='${mainCurrencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        await Database.query(`DELETE FROM ${tableName} ${where}`)
        await this.getCache(mainCurrencyCode, address)
    }

    async saveNonce(mainCurrencyCode, scanAddress, key, value) {
        if (mainCurrencyCode !== 'ETH') {
            return false
        }
        const address = scanAddress.toLowerCase()
        const now = new Date().toISOString()
        value = value * 1

        const where = `WHERE currency_code='${mainCurrencyCode}' AND address='${address}' AND tmp_key='nonces' AND tmp_sub_key='${key}'`
        const res = await Database.query(`SELECT tmp_val FROM ${tableName} ${where}`)
        if (res && res.array && res.array.length > 0) {
            if (res.array[0].tmp_val * 1 >= value) {
                return true
            }
            await Database.query(`DELETE FROM ${tableName} ${where}`)
        }

        const prepared = [{
            currency_code: mainCurrencyCode,
            address: address.toLowerCase(),
            tmp_key: 'nonces',
            tmp_sub_key: key,
            tmp_val: value,
            created_at: now
        }]
        await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
        await this.getCache(mainCurrencyCode, address)
    }
}

export default new EthTmpDS()
