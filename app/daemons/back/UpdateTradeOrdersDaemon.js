/**
 * @version 0.30
 */

import DBInterface from '../../appstores/DataSource/DB/DBInterface'

import Log from '../../services/Log/Log'
import Api from '../../services/Api/Api'
import ApiV3 from '../../services/Api/ApiV3'

import Settings from '../../appstores/DataSource/Settings/Settings'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import config from '../../config/config'
import ApiProxy from '../../services/Api/ApiProxy'

const settingsDS = new Settings()

const CACHE_VALID_TIME = 20000 // 2 minute
let CACHE_LAST_TIME = false
let TRY_COUNTER = 0

let CACHE_ORDERS_HASH = ''
const CACHE_ONE_ORDER = {}

const LIMIT_FOR_CURRENCY = 20

class UpdateTradeOrdersDaemon {

    getSavedOrdersHash = () => {
        return CACHE_ORDERS_HASH
    }

    fromApi = async (walletHash, orderHash) => {

        const now = new Date().getTime()
        if (typeof CACHE_ONE_ORDER[orderHash] !== 'undefined') {
            const diff = now - CACHE_ONE_ORDER[orderHash].now
            if (diff < CACHE_VALID_TIME) {
                Log.daemon('UpdateTradeOrders.fromApi ' + orderHash + ' skipped by diff ' + diff)
                return CACHE_ONE_ORDER[orderHash].one
            }
        }

        Log.daemon('UpdateTradeOrders.fromApi ' + orderHash + ' loading start')

        try {

            const tmpTradeOrdersV3 = await ApiV3.getExchangeOrders(walletHash)
            if (typeof tmpTradeOrdersV3 !== 'undefined' && tmpTradeOrdersV3 && tmpTradeOrdersV3.length > 0) {
                for (const one of tmpTradeOrdersV3) {
                    if (one.orderHash === orderHash) {
                        CACHE_ONE_ORDER[orderHash] = { one, now }
                        return one
                    }
                }
            }

            const tmpTradeOrders = await Api.getExchangeOrders(walletHash)
            if (tmpTradeOrders && typeof tmpTradeOrders.length !== 'undefined' && tmpTradeOrders.length > 0) {
                for (const one of tmpTradeOrders) {
                    if (one.orderId === orderHash) {
                        CACHE_ONE_ORDER[orderHash] = { one, now }
                        return one
                    }
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateTradeOrdersDaemon.fromApi error ' + e.message + ' tmpOneOrder')
            }
            throw new Error(e.message + ' tmpOneOrder')
        }
        return false
    }

    fromDB = async () => {
        // do nothing
    }

    removeId = async (removeId) => {
        Log.daemon('UpdateTradeOrders removeId ' + removeId)
        try {
            const dbInterface = new DBInterface()
            const nowAt = new Date().toISOString()
            const sql = ` UPDATE transactions SET hidden_at='${nowAt}' WHERE bse_order_id = '${removeId}' `
            await dbInterface.setQueryString(sql).query(true)
        } catch (e) {
            Log.errDaemon('UpdateTradeOrders removeId ' + removeId + ' error ' + e.message)
        }
    }

    /**
     * @param params.force
     * @param params.source
     * @returns {Promise<boolean>}
     */
    updateTradeOrdersDaemon = async (params) => {

        if (typeof params.source !== 'undefined' && params.source === 'ACCOUNT_OPEN' && CACHE_LAST_TIME) {
            const now = new Date().getTime()
            const diff = now - CACHE_LAST_TIME
            if (diff < CACHE_VALID_TIME) {
                Log.daemon('UpdateTradeOrders skipped by diff ' + diff)
                return false
            }
        }

        Log.daemon('UpdateTradeOrders called ' + JSON.stringify(params))

        const dbInterface = new DBInterface()

        const walletHash = await BlocksoftKeysStorage.getSelectedWallet()
        if (!walletHash) {
            return false
        }

        const nowAt = new Date().toISOString()
        try {

            const res = await ApiProxy.getAll({ source: 'UpdateTradeOrdersDaemon.updateTradeOrders' })
            const tmpTradeOrders = typeof res.cbOrders !== 'undefined' ? res.cbOrders : false

            /*
            sometimes transaction hash should be unified with order status
            if (typeof res.cbOrdersHash !== 'undefined' && (res.cbOrdersHash === CACHE_ORDERS_HASH || typeof params.removeId === 'undefined')) {
                return false
            }
            */

            try {

                if (typeof tmpTradeOrders === 'undefined' || !tmpTradeOrders || !tmpTradeOrders.length) {
                    return false
                }

                let item

                const index = {}
                let total = 0

                for (item of tmpTradeOrders) {
                    if (total > 100) {
                        break
                    }
                    if (typeof item.orderId === 'undefined' || !item.orderId || item.orderId === '' || item.orderId === 'undefined') {
                        continue
                    }

                    if (typeof item.uiApiVersion === 'undefined') {
                        item.uiApiVersion = 'v2'
                    }

                    try {
                        const tmps = [
                            {
                                currencyCode: item.requestedInAmount.currencyCode || false,
                                addressAmount: item.requestedInAmount.amount || 0,
                                updateHash: item.inTxHash || false,
                                suffix: 'in'
                            },
                            {
                                currencyCode: item.requestedOutAmount.currencyCode || false,
                                addressAmount: item.requestedOutAmount.amount || 0,
                                updateHash: item.outTxHash || false,
                                suffix: 'out'
                            }
                        ]

                        let currencyCode = 'NONE'
                        let someIsUpdatedAllWillUpdate = false

                        for (const tmp of tmps) {
                            if (!tmp.currencyCode) continue
                            if (typeof index[tmp.currencyCode] === 'undefined') {
                                index[tmp.currencyCode] = 1
                            } else {
                                index[tmp.currencyCode]++
                            }
                            if (index[tmp.currencyCode] < LIMIT_FOR_CURRENCY) {
                                someIsUpdatedAllWillUpdate = true
                            }
                        }

                        if (!someIsUpdatedAllWillUpdate) continue


                        let savedToTx = {}
                        let askedSimple = false
                        for (const tmp of tmps) {
                            if (!tmp.currencyCode) continue
                            currencyCode = tmp.currencyCode
                            let sql
                            let sqlUpdateDir = ''
                            if (tmp.updateHash && tmp.updateHash !== '' && tmp.updateHash !== 'null') {
                                sqlUpdateDir = `bse_order_id_${tmp.suffix}='${item.orderId}', bse_order_id='${item.orderId}', `
                                sql = `
                                     SELECT id, bse_order_data, transaction_hash, transactions_scan_log, hidden_at FROM transactions
                                     WHERE (transaction_hash='${tmp.updateHash}' AND currency_code='${tmp.currencyCode}')
                                     OR bse_order_id='${item.orderId}'
                                     `
                            } else if (!askedSimple) {
                                askedSimple = true
                                sql = `
                                     SELECT id, bse_order_data, transaction_hash, transactions_scan_log, hidden_at FROM transactions
                                     WHERE bse_order_id='${item.orderId}'
                                     `
                            } else {
                                continue // do nothing if already asked
                            }
                            const found = await dbInterface.setQueryString(sql).query(true)
                            if (found && found.array && found.array.length > 0) {

                                savedToTx[tmp.currencyCode] = true

                                let id = found.array[0].id
                                const toRemove = []
                                if (found.array.length > 1) {
                                    for (const row of found.array) {
                                        if (row.transaction_hash && row.transaction_hash !== '') {
                                            id = row.id
                                        } else {
                                            toRemove.push(row.id)
                                        }
                                    }
                                }
                                for (const row of found.array) {
                                    if (id !== row.id) continue
                                    if (row.hidden_at !== '' && row.hidden_at !== 'null') continue
                                    const escaped = dbInterface.escapeString(JSON.stringify(item))

                                    if (!(row.bse_order_data === escaped)) {

                                        let scanLog = row.transactions_scan_log
                                        if (scanLog.indexOf(` UPDATED ORDER ${item.orderId} `) === -1) {
                                            scanLog = ` ${nowAt} UPDATED ORDER ${item.orderId} / ${scanLog}`
                                            if (scanLog.length > 1000) {
                                                scanLog = scanLog.substr(0, 1000)
                                            }
                                            sqlUpdateDir += `transactions_scan_log = '${scanLog}', `
                                        }

                                        const sql2 = ` UPDATE transactions SET ${sqlUpdateDir} bse_order_data='${escaped}' WHERE id=${row.id} `
                                        await dbInterface.setQueryString(sql2).query(true)
                                    }
                                }
                                if (toRemove.length > 0) {
                                    const sql3 = ` DELETE FROM transactions WHERE id IN (${toRemove.join(',')}) AND id != ${id} `
                                    await dbInterface.setQueryString(sql3).query(true)
                                }
                            }
                        }


                        for (const tmp of tmps) {
                            if (!tmp.currencyCode || tmp.addressAmount === 0) continue
                            if (typeof savedToTx[tmp.currencyCode] !== 'undefined') continue
                            currencyCode = tmp.currencyCode

                            const createdAt = new Date(item.createdAt).toISOString()
                            const sql = `
                                            INSERT INTO transactions (currency_code, wallet_hash, account_id, transaction_hash, transaction_hash_basic, transaction_status, transactions_scan_log, created_at,
                                            address_amount, address_to, bse_order_id, bse_order_id_${tmp.suffix}, bse_order_data) 
                                            VALUES ('${currencyCode}', '${walletHash}', '0', '', '${tmp.updateHash ? tmp.updateHash : ''}', '', 'FROM ORDER ${createdAt} ${item.orderId}', '${createdAt}',
                                            '${tmp.addressAmount}', '', '${item.orderId}', '${item.orderId}', '${dbInterface.escapeString(JSON.stringify(item))}')
                                       `
                            await dbInterface.setQueryString(sql).query(true)
                        }

                        total++

                    } catch (e) {
                        if (config.debug.appErrors) {
                            console.log('UpdateTradeOrders one order error ' + e.message, JSON.parse(JSON.stringify(item)))
                        }
                        Log.err('UpdateTradeOrders one order error ' + e.message, item)
                    }
                }

                TRY_COUNTER = 0
                CACHE_ORDERS_HASH = res.cbOrdersHash


            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateTradeOrders all orders error ' + e.message, e, JSON.parse(JSON.stringify(tmpTradeOrders)))
                }
                throw new Error('UpdateTradeOrders all orders error ' + e.message + ' ' + JSON.stringify(tmpTradeOrders))
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateTradeOrders get orders error ' + e.message, e)
            }
            if (Log.isNetworkError(e.message) && TRY_COUNTER < 10) {
                TRY_COUNTER++
                Log.daemon('UpdateTradeOrders network try ' + TRY_COUNTER + ' ' + e.message)
            } else if (e.message === 'No cashbackToken') {
                Log.daemon('UpdateTradeOrders notice ' + e.message)
            } else {
                Log.errDaemon('UpdateTradeOrders error ' + e.message)
            }
        }
        CACHE_LAST_TIME = new Date().getTime()
    }
}

export default new UpdateTradeOrdersDaemon
