/**
 * @version 0.30
 */

import DBInterface from '../../appstores/DataSource/DB/DBInterface'

import Log from '../../services/Log/Log'
import Api from '../../services/Api/Api'
import ApiV3 from '../../services/Api/ApiV3'

import Settings from '../../appstores/DataSource/Settings/Settings'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import ExchangeOrdersActions from '../../appstores/Stores/ExchangeOrders/ExchangeOrdersActions'

import config from '../../config/config'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'

const settingsDS = new Settings()


const CACHE_VALID_TIME = 20000 // 2 minute
let CACHE_LAST_TIME = false
let TRY_COUNTER = 0

const CACHE_ORDERS = {}
let CACHE_REMOVED = false
const CACHE_ONE_ORDER = {}

const LIMIT_FOR_CURRENCY = 20

class UpdateTradeOrdersDaemon {

    fromApi = async (walletHash, orderHash) => {

        const now = new Date().getTime()
        if ( typeof CACHE_ONE_ORDER[orderHash] !== 'undefined') {
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
                        CACHE_ONE_ORDER[orderHash] = {one, now}
                        return one
                    }
                }
            }

            const tmpTradeOrders = await Api.getExchangeOrders(walletHash)
            if (tmpTradeOrders && typeof tmpTradeOrders.length !== 'undefined' && tmpTradeOrders.length > 0) {
                for (const one of tmpTradeOrders) {
                    if (one.orderId === orderHash) {
                        CACHE_ONE_ORDER[orderHash] = {one, now}
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

    fromDB = async (walletHash) => {
        if (typeof walletHash === 'undefined' || walletHash) {
            walletHash = await BlocksoftKeysStorage.getSelectedWallet()
        }
        if (CACHE_REMOVED === false) {
            await this._removedFromDb()
        }
        try {
            if (typeof CACHE_ORDERS[walletHash] === 'undefined' || !CACHE_ORDERS[walletHash]) {
                const tmpTradeOrders = await settingsDS.getSetting('bseOrdersNew_' + walletHash)
                if (typeof tmpTradeOrders !== 'undefined' && tmpTradeOrders) {
                    const tmpTradeOrders2 = JSON.parse(tmpTradeOrders.paramValue)
                    if (tmpTradeOrders2 && typeof tmpTradeOrders2 !== 'undefined') {
                        CACHE_ORDERS[walletHash] = tmpTradeOrders2
                    }
                }
                for (const key in CACHE_ORDERS[walletHash]) {
                    for (const item of CACHE_ORDERS[walletHash][key]) {
                        if (typeof CACHE_REMOVED[item.orderId] !== 'undefined') {
                            item.isRemovedByUser = true
                        } else {
                            item.isRemovedByUser = false
                        }
                    }
                }
            }
            ExchangeOrdersActions.setExchangeOrderList({walletHash, tradeOrders : CACHE_ORDERS[walletHash]})
        } catch (e) {
            Log.errDaemon('UpdateTradeOrders orders from db error ' + e.message)
        }
    }

    /**
     * @returns {Promise<void>}
     * @private
     */
    _removedFromDb = async () => {
        const tmpRemoved = await settingsDS.getSetting('bseRemoved')

        CACHE_REMOVED = {}
        if (typeof tmpRemoved !== 'undefined' && tmpRemoved) {
            try {
                const tmp = JSON.parse(tmpRemoved.paramValue)
                if (typeof tmp.removed !== 'undefined') {
                    CACHE_REMOVED = tmp.removed
                }
            } catch (e) {
                Log.errDaemon('UpdateTradeOrders removed from db error ' + e.message, tmpRemoved)
            }
        }
    }

    /**
     * @param params.force
     * @param params.source
     * @param params.removeId
     * @returns {Promise<boolean>}
     */
    updateTradeOrdersDaemon = async (params) => {
        const dbInterface = new DBInterface()

        Log.daemon('UpdateTradeOrders called ' + JSON.stringify(params))
        if (CACHE_REMOVED === false) {
            await this._removedFromDb()
        }

        const walletHash = await BlocksoftKeysStorage.getSelectedWallet()
        if (!walletHash) {
            return false
        }

        if (typeof params.source !== 'undefined' && params.source === 'ACCOUNT_OPEN' && CACHE_LAST_TIME) {
            const now = new Date().getTime()
            const diff = now - CACHE_LAST_TIME
            if (diff < CACHE_VALID_TIME) {
                Log.daemon('UpdateTradeOrders skipped by diff ' + diff)
                return false
            }
        }

        const exchangeWayTypes = BlocksoftExternalSettings.getStatic('TRADE_ORDERS_NO_TX_WAY_TYPES', 'UpdateTradeOrdersDaemon')
        const allowedToShow = BlocksoftExternalSettings.getStatic('TRADE_ORDERS_NO_TX_MAX_COUNT', 'UpdateTradeOrdersDaemon')
        const now = new Date().getTime()
        try {
            let tmpTradeOrders = await Api.getExchangeOrders()
            const tmpTradeOrdersV3 = await ApiV3.getExchangeOrders()
            if (typeof tmpTradeOrdersV3 !== 'undefined' && tmpTradeOrdersV3 && tmpTradeOrdersV3.length > 0) {
                if (tmpTradeOrders && typeof tmpTradeOrders.length !== 'undefined' && tmpTradeOrders.length > 0) {
                    try {
                        for (const one of tmpTradeOrdersV3) {
                            one.orderId = one.orderHash
                            one.uiApiVersion = 'v3'
                            tmpTradeOrders.push(one)
                        }
                    } catch (e) {
                        Log.log('UpdateTradeOrders tmpTradeOrders error ' + e.message, tmpTradeOrders)
                    }
                } else {
                    tmpTradeOrders = tmpTradeOrdersV3
                }
            }

            if (typeof params.removeId !== 'undefined') {
                if (typeof CACHE_REMOVED[params.removeId] === 'undefined') {
                    CACHE_REMOVED[params.removeId] = 1
                    await settingsDS.setSettings('bseRemoved', JSON.stringify({ removed: CACHE_REMOVED }))
                }
            }

            try {
                if (typeof tmpTradeOrders !== 'undefined' && tmpTradeOrders && tmpTradeOrders.length > 0 && typeof tmpTradeOrders.sort !== 'undefined') {

                    tmpTradeOrders = tmpTradeOrders.sort((item1, item2) => item2.createdAt - item1.createdAt)

                    let item

                    const index = {}
                    let total = 0

                    const tradeOrders = {}

                    for (item of tmpTradeOrders) {
                        if (total > 100) {
                            break
                        }
                        if (typeof item.uiApiVersion === 'undefined') {
                            item.uiApiVersion = 'v2'
                        }
                        try {
                            // console.log('item', JSON.parse(JSON.stringify(item)))
                            const tmps = [
                                {
                                    currencyCode: item.requestedInAmount.currencyCode || false,
                                    updateHash: item.inTxHash || false,
                                    suffix: 'in'
                                },
                                {
                                    currencyCode: item.requestedOutAmount.currencyCode || false,
                                    updateHash: item.outTxHash || false,
                                    suffix: 'out'
                                }
                            ]

                            let savedToTx = false
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

                            for (const tmp of tmps) {
                                if (!tmp.currencyCode) continue
                                currencyCode = tmp.currencyCode
                                let sql
                                if (tmp.updateHash) {
                                    sql = `
                                     UPDATE transactions 
                                     SET bse_order_id_${tmp.suffix}='${item.orderId}', bse_order_data='${dbInterface.escapeString(JSON.stringify(item))}'
                                     WHERE (transaction_hash='${tmp.updateHash}' AND currency_code='${tmp.currencyCode}')
                                     OR bse_order_id='${item.orderId}'
                                     `
                                    savedToTx = true
                                } else {
                                    sql = `
                                     UPDATE transactions 
                                     SET bse_order_data='${dbInterface.escapeString(JSON.stringify(item))}'
                                     WHERE bse_order_id='${item.orderId}'
                                     `
                                    // could be true could be not
                                }
                                await dbInterface.setQueryString(sql).query(true)

                            }

                            if (!savedToTx) {
                                if (typeof CACHE_REMOVED[item.orderId] !== 'undefined') {
                                    continue
                                }
                                if (typeof item.exchangeWayType !== 'undefined' && typeof exchangeWayTypes[item.exchangeWayType.toUpperCase()] === 'undefined') {
                                    continue
                                }
                                let tmp = exchangeWayTypes[item.exchangeWayType.toUpperCase()]
                                if (typeof item.status !== 'undefined' && typeof tmp[item.status.toLowerCase()] === 'undefined') {
                                    continue
                                }
                                tmp = tmp[item.status.toLowerCase()] * 60000
                                if (now - tmp > item.createdAt) {
                                    continue
                                }

                                if (typeof tradeOrders[currencyCode] === 'undefined') {
                                    tradeOrders[currencyCode] = []
                                }
                                if (tradeOrders[currencyCode].length < allowedToShow) {
                                    tradeOrders[currencyCode].push(item)
                                }

                            }
                            total++

                        } catch (e) {
                            if (config.debug.appErrors) {
                                console.log('UpdateTradeOrders one order error ' + e.message, JSON.parse(JSON.stringify(item)))
                            }
                            Log.err('UpdateTradeOrders one order error ' + e.message, item)
                        }
                    }

                    const txt = JSON.stringify(tradeOrders)
                    if (typeof CACHE_ORDERS[walletHash] === 'undefined' || JSON.stringify(CACHE_ORDERS[walletHash]) !== txt) {
                        CACHE_ORDERS[walletHash] = tradeOrders
                        ExchangeOrdersActions.setExchangeOrderList({ walletHash, tradeOrders })
                        await settingsDS.setSettings('bseOrdersNew_' + walletHash, txt)
                        Log.daemon('UpdateTradeOrders success and updated', tradeOrders)
                    } else {
                        Log.daemon('UpdateTradeOrders success but is cached the same')
                    }

                    TRY_COUNTER = 0

                } else {
                    await this.fromDB(walletHash)
                }

            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateTradeOrders all orders error ' + e.message, e, JSON.parse(JSON.stringify(tmpTradeOrders)))
                }
                throw new Error('UpdateTradeOrders all orders error ' + e.message + ' ' + JSON.stringify(tmpTradeOrders))
            }

        } catch (e) {
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
