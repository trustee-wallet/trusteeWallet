import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import { BlocksoftTransfer } from '../../../actions/BlocksoftTransfer/BlocksoftTransfer'
import config from '../../../../app/config/config'

const tableName = 'transactions_raw'

class DogeRawDS {

    _trezorServer = 'none'

    _canUpdate = true
    async getForAddress(data) {
        if (!this._canUpdate) return false
        try {
            const dbInterface = new DBInterface()
            const sql = `
        SELECT id,
        transaction_unique_key AS transactionUnique,
        transaction_hash AS transactionHash,
        transaction_raw AS transactionRaw,
        transaction_log AS transactionLog,
        broadcast_log AS broadcastLog,
        broadcast_updated AS broadcastUpdated,
        created_at AS transactionCreated,
        is_removed, removed_at
        FROM transactions_raw 
        WHERE currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key NOT LIKE 'inputs_%'
        AND transaction_unique_key NOT LIKE 'json_%'
        AND (is_removed=0 OR is_removed IS NULL)
        `
            const result = await dbInterface.setQueryString(sql).query()
            if (!result || !result.array || result.array.length === 0) {
                return {}
            }
            const ret = {}

            const now = new Date().toISOString()

            for (const row of result.array) {
                try {
                    if (typeof ret[row.transactionUnique] !== 'undefined') {
                        continue
                    }
                    ret[row.transactionUnique] = row
                    let transactionLog
                    try {
                        transactionLog = row.transactionLog ? JSON.parse(dbInterface.unEscapeString(row.transactionLog)) : row.transactionLog
                    } catch (e) {
                        // do nothing
                    }

                    let broadcastLog = ''
                    const updateObj = { broadcastUpdated: now }
                    let broad
                    try {
                        broad = await BlocksoftTransfer.sendRawTx(data, row.transactionRaw,
                            typeof transactionLog !== 'undefined' && transactionLog && typeof transactionLog.txRBF !== 'undefined' ? transactionLog.txRBF : false,
                            transactionLog
                        )
                        if (broad === '') {
                            throw new Error('not broadcasted')
                        }
                        broadcastLog = ' broadcasted ok ' + JSON.stringify(broad)
                        updateObj.is_removed = 1
                        updateObj.removed_at = now
                    } catch (e) {
                        if (config.debug.cryptoErrors) {
                            const dbTx = await dbInterface.setQueryString(`SELECT * FROM transactions WHERE transaction_hash='${row.transactionHash}'`).query()
                            if (config.debug.cryptoErrors) {
                                console.log('DogeRawDS.getForAddress send error ' + e.message, JSON.parse(JSON.stringify(row)), dbTx, e)
                            }

                        }
                        if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('missing-inputs') !== -1 || e.message.indexOf('insufficient fee') !== -1) {
                            broadcastLog = ' sub-spent ' + e.message
                            updateObj.is_removed = 3
                            await dbInterface.setQueryString(`UPDATE transactions 
                            SET transaction_status='replaced', hidden_at='${now}'
                            WHERE transaction_hash='${row.transactionHash}' 
                            AND (transaction_status='missing' OR transaction_status='new')
                            `).query()
                        } else if (e.message.indexOf('already known') !== -1) {
                            broadcastLog = ' already known'
                        } else {
                            broadcastLog = e.message
                        }
                    }
                    broadcastLog = new Date().toISOString() + ' ' + broadcastLog + ' ' + (row.broadcastLog ? row.broadcastLog.substr(0, 1000) : '')
                    updateObj.broadcastLog = broadcastLog
                    await dbInterface.setTableName('transactions_raw').setUpdateData({
                        updateObj,
                        key: { id: row.id }
                    }).update()

                } catch (e) {
                    if (config.debug.cryptoErrors) {
                        console.log('DogeRawDS.getForAddress error ' + e.message + ' in ' + row.transactionHash, e)
                    }
                    throw new Error('DogeRawDS.getForAddress error ' + e.message + ' in ' + row.transactionHash)
                }
            }
            this._canUpdate = true
            return ret
        } catch (e) {
            this._canUpdate = true
            throw new Error(e.message + ' on DogeRawDS.getAddress')
        }
    }

    async cleanRaw(data) {
        if (typeof data.transactionUnique === 'undefined') {
            data.transactionUnique = data.address.toLowerCase() + '_' + data.transactionHash
        }
        BlocksoftCryptoLog.log('DogeRawDS cleanRaw ', data)
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()
        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE 
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await dbInterface.setQueryString(sql).query()
    }

    async saveRaw(data) {
        if (typeof data.transactionUnique === 'undefined') {
            data.transactionUnique = data.address.toLowerCase() + '_' + data.transactionHash
        }
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()

        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE 
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await dbInterface.setQueryString(sql).query()

        const prepared = [{
            currency_code: data.currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: data.transactionUnique,
            transaction_hash: data.transactionHash,
            transaction_raw: data.transactionRaw,
            created_at: now
        }]
        if (typeof data.transactionLog !== 'undefined' && data.transactionLog) {
            prepared[0].transaction_log = dbInterface.escapeString(JSON.stringify(data.transactionLog))
        }
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async savePrefixed(data, prefix) {
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()

        const prepared = [{
            currency_code: data.currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: prefix + '_' + data.transactionHash,
            transaction_hash: data.transactionHash,
            transaction_raw: dbInterface.escapeString(data.transactionRaw),
            is_removed: 2,
            created_at: now
        }]
        if (typeof data.transactionLog !== 'undefined' && data.transactionLog) {
            prepared[0].transaction_log = dbInterface.escapeString(JSON.stringify(data.transactionLog))
        }
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async getPrefixed(data, prefix) {
        const dbInterface = new DBInterface()
        const sql = `SELECT transaction_raw AS transactionRaw
            FROM ${tableName} 
            WHERE currency_code='${data.currencyCode}'
            AND transaction_unique_key='${prefix}_${data.transactionHash}' LIMIT 1`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || !res.array || typeof res.array[0] === 'undefined' || typeof res.array[0].transactionRaw === 'undefined') {
            return false
        }
        try {
            const str = dbInterface.unEscapeString(res.array[0].transactionRaw)
            return JSON.parse(str)
        } catch (e) {
            BlocksoftCryptoLog.err('DogeRawDS getInputs error ' + e.message)
            return false
        }
    }

    async saveInputs(data) {
        return this.savePrefixed(data, 'inputs')
    }

    async getInputs(data) {
        return this.getPrefixed(data, 'inputs')
    }

    async saveJson(data) {
        return this.savePrefixed(data, 'json')
    }

    async getJson(data) {
        return this.getPrefixed(data, 'json')
    }
}

export default new DogeRawDS()
