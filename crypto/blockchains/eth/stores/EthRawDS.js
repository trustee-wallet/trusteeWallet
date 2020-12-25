import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import EthTxSendProvider from '../basic/EthTxSendProvider'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const tableName = 'transactions_raw'

class EthRawDS {
    /**
     * @type {string}
     * @private
     */
    _currencyCode = 'ETH'

    _trezorServer = 'none'

    async getForAddress(data) {
        try {
            if (typeof data.currencyCode !== 'undefined') {
                this._currencyCode = data.currencyCode === 'ETH_ROPSTEN' ? 'ETH_ROPSTEN' : 'ETH'
            }
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
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'`
            const result = await dbInterface.setQueryString(sql).query()
            if (!result || !result.array || result.array.length === 0) {
                return {}
            }

            const ret = {}

            if (this._currencyCode === 'ETH' && this._trezorServer === 'none') {
                try {
                    this._trezorServer = await BlocksoftExternalSettings.getTrezorServer('ETH_TREZOR_SERVER', 'ETH.Broadcast')
                    this._infuraProjectId = BlocksoftExternalSettings.getStatic('ETH_INFURA_PROJECT_ID', 'ETH.Broadcast')
                } catch (e) {
                    throw new Error(e.message + ' inside trezorServer')
                }
            }

            const now = new Date().toISOString()

            for (const row of result.array) {
                try {
                    ret[row.transactionUnique] = row
                    if (this._currencyCode === 'ETH') {
                        let broadcastLog = ''
                        let link = this._trezorServer + '/api/v2/sendtx/'
                        const updateObj = {
                            broadcastUpdated: now,
                            is_removed : '0'
                        }
                        let broad
                        try {
                            broad = await BlocksoftAxios.post(link, row.transactionRaw)
                            broadcastLog = ' broadcasted ok ' + JSON.stringify(broad.data)
                            updateObj.is_removed = '1'
                            updateObj.removed_at = now
                        } catch (e) {
                            if (e.message.indexOf('transaction underpriced') !== -1 || e.message.indexOf('already known') !== -1) {
                                updateObj.is_removed = '1'
                                broadcastLog += ' already known'
                            } else {
                                updateObj.is_removed = '0'
                                broadcastLog += e.message
                            }
                        }
                        broadcastLog += ' ' + link + '; '
                        MarketingEvent.logOnlyRealTime('v20_eth_resend_0 ' + row.transactionHash, {broadcastLog, ...updateObj})


                        link = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&apikey=YourApiKeyToken&hex='
                        let broadcastLog1 = ''
                        try {
                            broad = await BlocksoftAxios.get(link + row.transactionRaw)
                            if (typeof broad.data.error !== 'undefined') {
                                throw new Error(JSON.stringify(broad.data.error))
                            }
                            broadcastLog1 = ' broadcasted ok ' + JSON.stringify(broad.data)
                            updateObj.is_removed += '1'
                            updateObj.removed_at = now
                        } catch (e) {
                            if (e.message.indexOf('transaction underpriced') !== -1 || e.message.indexOf('already known') !== -1) {
                                updateObj.is_removed += '1'
                                broadcastLog1 += ' already known'
                            } else {
                                updateObj.is_removed += '0'
                                broadcastLog1 += e.message
                            }
                        }
                        broadcastLog1 += ' ' + link + '; '
                        MarketingEvent.logOnlyRealTime('v20_eth_resend_1 ' + row.transactionHash, {broadcastLog1, ...updateObj})


                        link = 'https://mainnet.infura.io/v3/' + this._infuraProjectId
                        let broadcastLog2 = ''
                        try {
                            broad = await BlocksoftAxios.post(link,
                                {
                                    'jsonrpc': '2.0',
                                    'method': 'eth_sendRawTransaction',
                                    'params': [row.transactionRaw],
                                    'id': 1
                                }
                            )
                            if (typeof broad.data.error !== 'undefined') {
                                throw new Error(JSON.stringify(broad.data.error))
                            }
                            broadcastLog2 = ' broadcasted ok ' + JSON.stringify(broad.data)
                            updateObj.is_removed += '1'
                            updateObj.removed_at = now
                        } catch (e) {
                            if (e.message.indexOf('transaction underpriced') !== -1 || e.message.indexOf('already known') !== -1) {
                                updateObj.is_removed += '1'
                                broadcastLog2 += ' already known'
                            } else {
                                updateObj.is_removed += '0'
                                broadcastLog2 += e.message
                            }

                        }
                        broadcastLog2 += ' ' + link + '; '
                        MarketingEvent.logOnlyRealTime('v20_eth_resend_2 ' + row.transactionHash, {broadcastLog2, ...updateObj})

                        if (updateObj.is_removed === '111') { // do ALL!
                            updateObj.is_removed = 1
                        } else {
                            updateObj.is_removed = 0
                        }

                        broadcastLog = new Date().toISOString() + ' ' + broadcastLog + ' ' + broadcastLog1 + ' ' + broadcastLog2 + ' ' + (row.broadcastLog ? row.broadcastLog.substr(0, 1000) : '')
                        updateObj.broadcastLog = broadcastLog

                        await dbInterface.setTableName('transactions_raw').setUpdateData({
                            updateObj,
                            key: { id: row.id }
                        }).update()
                    }

                } catch (e) {
                    throw new Error(e.message + ' inside row ' + row.transactionHash)
                }
            }
            return ret
        } catch (e) {
            throw new Error(e.message + ' on EthRawDS.getAddress')
        }
    }

    async cleanRaw(data) {
        BlocksoftCryptoLog.log('EthRawDS cleanRaw ', data)

        if (typeof data.currencyCode !== 'undefined') {
            this._currencyCode = data.currencyCode === 'ETH_ROPSTEN' ? 'ETH_ROPSTEN' : 'ETH'
        }

        const dbInterface = new DBInterface()
        const now = new Date().toISOString()
        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE 
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await dbInterface.setQueryString(sql).query()
    }

    async saveRaw(data) {
        console.log('saveData', data)
        if (typeof data.currencyCode !== 'undefined') {
            this._currencyCode = data.currencyCode === 'ETH_ROPSTEN' ? 'ETH_ROPSTEN' : 'ETH'
        }
        const dbInterface = new DBInterface()
        const now = new Date().toISOString()

        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE 
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique.toLowerCase()}'`
        await dbInterface.setQueryString(sql).query()

        const prepared = [{
            currency_code: this._currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: data.transactionUnique.toLowerCase(),
            transaction_hash: data.transactionHash,
            transaction_raw: data.transactionRaw,
            created_at: now,
            is_removed : 0
        }]
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }
}

export default new EthRawDS()
