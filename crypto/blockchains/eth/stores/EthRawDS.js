/**
 * @author Ksu
 * @version 0.32
 */
import Database from '@app/appstores/DataSource/Database';
import EthTxSendProvider from '../basic/EthTxSendProvider'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'
import config from '../../../../app/config/config'

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
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'`
            const result = await Database.query(sql)
            if (!result || !result.array || result.array.length === 0) {
                return {}
            }

            const ret = {}

            if (this._trezorServer === 'none') {
                if (this._currencyCode === 'ETH') {
                    try {
                        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer('ETH_TREZOR_SERVER', 'ETH.Broadcast')
                        this._infuraProjectId = BlocksoftExternalSettings.getStatic('ETH_INFURA_PROJECT_ID', 'ETH.Broadcast')
                    } catch (e) {
                        throw new Error(e.message + ' inside trezorServer')
                    }
                } else {
                    this._trezorServer = await BlocksoftExternalSettings.getTrezorServer('ETH_ROPSTEN_TREZOR_SERVER', 'ETH.Broadcast')
                }
            }

            const now = new Date().toISOString()

            for (const row of result.array) {
                try {
                    ret[row.transactionUnique] = row
                    let transactionLog
                    try {
                        transactionLog = row.transactionLog ? JSON.parse(Database.unEscapeString(row.transactionLog)) : row.transactionLog
                    } catch (e) {
                        // do nothing
                    }

                    if (transactionLog && typeof transactionLog.currencyCode !== 'undefined' && (typeof transactionLog.successResult === 'undefined' || !transactionLog.successResult)) {
                        const { apiEndpoints } = config.proxy
                        const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
                        const successProxy = baseURL + '/send/sendtx'
                        let checkResult = false
                        try {
                            transactionLog.selectedFee.isRebroadcast = true
                            checkResult = await BlocksoftAxios.post(successProxy, {
                                raw: row.transactionRaw,
                                txRBF: typeof transactionLog.txRBF !== 'undefined' ? transactionLog.txRBF : false,
                                logData: transactionLog,
                                marketingData: MarketingEvent.DATA
                            })
                            await BlocksoftCryptoLog.log(this._currencyCode + ' EthRawDS.send proxy success result', JSON.parse(JSON.stringify(checkResult)))
                        } catch (e3) {
                            if (config.debug.cryptoErrors) {
                                console.log(this._currencyCode + ' EthRawDS.send proxy success error ' + e3.message)
                            }
                            await BlocksoftCryptoLog.log(this._currencyCode + ' EthRawDS.send proxy success error ' + e3.message)
                        }
                        if (checkResult && typeof checkResult.data !== 'undefined') {
                            transactionLog.successResult = checkResult.data
                        }

                        await Database.setTableName('transactions_raw').setUpdateData({
                            updateObj: { transactionLog: Database.escapeString(JSON.stringify(transactionLog)) },
                            key: { id: row.id }
                        }).update()
                    }

                    let broadcastLog = ''
                    let link = ''
                    let broad
                    const updateObj = {
                        broadcastUpdated: now,
                        is_removed: '0'
                    }
                    if (this._currencyCode === 'ETH' || this._currencyCode === 'ETH_ROPSTEN') {
                        link = this._trezorServer + '/api/v2/sendtx/'
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
                        MarketingEvent.logOnlyRealTime('v30_eth_resend_0_' + row.transactionHash, { broadcastLog, ...updateObj })
                    }

                    if (this._currencyCode === 'ETH') {
                        link = 'https://eth.meowrpc.com'
                        let broadcastLog0 = ''
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
                            broadcastLog0 = ' broadcasted ok ' + JSON.stringify(broad.data)
                            updateObj.is_removed += '1'
                            updateObj.removed_at = now
                        } catch (e) {
                            if (e.message.indexOf('transaction underpriced') !== -1 || e.message.indexOf('already known') !== -1) {
                                updateObj.is_removed += '1'
                                broadcastLog0 += ' already known'
                            } else {
                                updateObj.is_removed += '0'
                                broadcastLog0 += e.message
                            }
                        }
                        broadcastLog0 += ' ' + link + '; '

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
                        MarketingEvent.logOnlyRealTime('v30_eth_resend_1_' + row.transactionHash, { broadcastLog1, ...updateObj })


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
                        MarketingEvent.logOnlyRealTime('v30_eth_resend_2_' + row.transactionHash, { broadcastLog2, ...updateObj })

                        if (updateObj.is_removed === '111') { // do ALL!
                            updateObj.is_removed = 1
                        } else {
                            updateObj.is_removed = 0
                        }

                        broadcastLog = new Date().toISOString() + ' ' + broadcastLog + ' ' + broadcastLog0 + ' ' + broadcastLog1 + ' ' + broadcastLog2 + ' ' + (row.broadcastLog ? row.broadcastLog.substr(0, 1000) : '')
                    } else if (this._currencyCode === 'ETH_ROPSTEN') {
                        if (updateObj.is_removed === '1') { // do ALL!
                            updateObj.is_removed = 1
                        } else {
                            updateObj.is_removed = 0
                        }

                        broadcastLog = new Date().toISOString() + ' ' + broadcastLog + ' ' + (row.broadcastLog ? row.broadcastLog.substr(0, 1000) : '')
                    }

                    if (this._currencyCode === 'ETH' || this._currencyCode === 'ETH_ROPSTEN') {
                        updateObj.broadcastLog = broadcastLog

                        await Database.setTableName('transactions_raw').setUpdateData({
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

    async cleanRawHash(data) {
        BlocksoftCryptoLog.log('EthRawDS cleanRawHash ', data)

        const now = new Date().toISOString()
        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND (currency_code='ETH' OR currency_code='ETH_ROPSTEN')
        AND transaction_hash='${data.transactionHash}'`
        await Database.query(sql)
    }

    async cleanRaw(data) {
        BlocksoftCryptoLog.log('EthRawDS cleanRaw ', data)

        if (typeof data.currencyCode !== 'undefined') {
            this._currencyCode = data.currencyCode === 'ETH_ROPSTEN' ? 'ETH_ROPSTEN' : 'ETH'
        }

        const now = new Date().toISOString()
        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique}'`
        await Database.query(sql)
    }

    async saveRaw(data) {
        if (typeof data.currencyCode !== 'undefined') {
            this._currencyCode = data.currencyCode === 'ETH_ROPSTEN' ? 'ETH_ROPSTEN' : 'ETH'
        }
        const now = new Date().toISOString()

        const sql = `UPDATE transactions_raw
        SET is_removed=1, removed_at = '${now}'
        WHERE
        (is_removed=0 OR is_removed IS NULL)
        AND currency_code='${this._currencyCode}'
        AND address='${data.address.toLowerCase()}'
        AND transaction_unique_key='${data.transactionUnique.toLowerCase()}'`
        await Database.query(sql)

        const prepared = [{
            currency_code: this._currencyCode,
            address: data.address.toLowerCase(),
            transaction_unique_key: data.transactionUnique.toLowerCase(),
            transaction_hash: data.transactionHash,
            transaction_raw: data.transactionRaw,
            transaction_log: Database.escapeString(JSON.stringify(data.transactionLog)),
            created_at: now,
            is_removed: 0
        }]
        await Database.setTableName(tableName).setInsertData({ insertObjs: prepared }).insert()
    }
}

export default new EthRawDS()
