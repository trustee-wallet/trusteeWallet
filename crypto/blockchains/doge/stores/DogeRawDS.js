
import Database from '@app/appstores/DataSource/Database';
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
        return false
        // @todo refactor from server side
        if (!this._canUpdate) return false
        try {
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
            const result = await Database.query(sql)
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
                        transactionLog = row.transactionLog ? JSON.parse(Database.unEscapeString(row.transactionLog)) : row.transactionLog
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
                            const dbTx = await Database.query(`SELECT * FROM transactions WHERE transaction_hash='${row.transactionHash}'`)
                            if (config.debug.cryptoErrors) {
                                console.log('DogeRawDS.getForAddress send error ' + e.message, JSON.parse(JSON.stringify(row)), dbTx, e)
                            }

                        }
                        if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('missing-inputs') !== -1 || e.message.indexOf('insufficient fee') !== -1) {
                            broadcastLog = ' sub-spent ' + e.message
                            updateObj.is_removed = 3
                            const sql = `UPDATE transactions
                            SET transaction_status='replaced', hidden_at='${now}'
                            WHERE transaction_hash='${row.transactionHash}'
                            AND (transaction_status='missing' OR transaction_status='new')
                            `
                            await Database.query(sql)
                        } else if (e.message.indexOf('already known') !== -1) {
                            broadcastLog = ' already known'
                        } else {
                            broadcastLog = e.message
                        }
                    }
                    broadcastLog = new Date().toISOString() + ' ' + broadcastLog + ' ' + (row.broadcastLog ? row.broadcastLog.substr(0, 1000) : '')
                    updateObj.broadcastLog = broadcastLog
                    await Database.setTableName('transactions_raw').setUpdateData({
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
        const now = new Date().toISOString()
        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await Database.query(sql)
    }

    async saveRaw(data) {
        if (typeof data.transactionUnique === 'undefined') {
            data.transactionUnique = data.address.toLowerCase() + '_' + data.transactionHash
        }
        const now = new Date().toISOString()

        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await Database.query(sql)

        const prepared = [{
            currency_code: data.currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: data.transactionUnique,
            transaction_hash: data.transactionHash,
            transaction_raw: data.transactionRaw,
            created_at: now
        }]
        if (typeof data.transactionLog !== 'undefined' && data.transactionLog) {
            prepared[0].transaction_log = Database.escapeString(JSON.stringify(data.transactionLog))
        }
        await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async savePrefixed(data, prefix) {
        const now = new Date().toISOString()

        const prepared = [{
            currency_code: data.currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: prefix + '_' + data.transactionHash,
            transaction_hash: data.transactionHash,
            transaction_raw: Database.escapeString(data.transactionRaw),
            is_removed: 2,
            created_at: now
        }]
        if (typeof data.transactionLog !== 'undefined' && data.transactionLog) {
            prepared[0].transaction_log = Database.escapeString(JSON.stringify(data.transactionLog))
        }
        await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async getPrefixed(data, prefix) {
        const sql = `SELECT transaction_raw AS transactionRaw
            FROM ${tableName}
            WHERE currency_code='${data.currencyCode}'
            AND transaction_unique_key='${prefix}_${data.transactionHash}' LIMIT 1`
        const res = await Database.query(sql)
        if (!res || !res.array || typeof res.array[0] === 'undefined' || typeof res.array[0].transactionRaw === 'undefined') {
            return false
        }
        try {
            const str = Database.unEscapeString(res.array[0].transactionRaw)
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
