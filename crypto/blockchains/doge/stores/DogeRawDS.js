import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import { BlocksoftTransfer } from '../../../actions/BlocksoftTransfer/BlocksoftTransfer'

const tableName = 'transactions_raw'

class DogeRawDS {

    _trezorServer = 'none'

    async getForAddress(data) {
        try {
            const dbInterface = new DBInterface()
            const sql = `
        SELECT id,
        transaction_unique_key AS transactionUnique,
        transaction_hash AS transactionHash,
        transaction_raw AS transactionRaw,
        broadcast_log AS broadcastLog,
        broadcast_updated AS broadcastUpdated,
        created_at AS transactionCreated,
        is_removed, removed_at
        FROM transactions_raw 
        WHERE 
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${data.currencyCode}'
        AND address='${data.address.toLowerCase()}'`
            const result = await dbInterface.setQueryString(sql).query()
            if (!result || !result.array || result.array.length === 0) {
                return {}
            }
            const ret = {}

            const now = new Date().toISOString()

            for (const row of result.array) {
                try {
                    ret[row.transactionUnique] = row

                    let broadcastLog = ''
                    const updateObj = { broadcastUpdated: now }
                    let broad
                    try {
                        broad = await BlocksoftTransfer.sendRawTx(data, row.transactionRaw)
                        if (broad === '') {
                            throw new Error('not broadcasted')
                        }
                        broadcastLog = ' broadcasted ok ' + JSON.stringify(broad)
                        updateObj.is_removed = 1
                        updateObj.removed_at = now
                    } catch (e) {
                        console.log('b', e)
                        if (e.message.indexOf('bad-txns-inputs-spent') !== -1) {
                            broadcastLog = ' sub-spent'
                            updateObj.is_removed = 3
                            console.log('update as replaced')
                            await dbInterface.setQueryString(`UPDATE transactions SET transaction_status='replaced'
                             WHERE hidden_at='${now}'
                             AND transaction_hash='${row.transactionHash}' 
                             AND transaction_status='missing'`).query()
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
                    throw new Error(e.message + ' inside row ' + row.transactionHash)
                }
            }
            return ret
        } catch (e) {
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
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async saveInputs(data) {
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()

        const prepared = [{
            currency_code: data.currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: 'inputs_' + data.transactionHash,
            transaction_hash: data.transactionHash,
            transaction_raw: dbInterface.escapeString(data.transactionRaw),
            is_removed: 2,
            created_at: now
        }]
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }

    async getInputs(data) {
        const dbInterface = new DBInterface()
        const sql = `SELECT transaction_raw AS transactionRaw
            FROM ${tableName} 
            WHERE currency_code='${data.currencyCode}'
            AND transaction_unique_key='inputs_${data.transactionHash}' LIMIT 1`
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
}

export default new DogeRawDS()
