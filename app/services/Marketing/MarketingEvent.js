/**
 * @version 0.9
 */
import crashlytics from '@react-native-firebase/crashlytics'
import analytics from '@react-native-firebase/analytics'

import AsyncStorage from '@react-native-community/async-storage'
import { Platform } from 'react-native'

import Log from '../Log/Log'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import BlocksoftTg from '../../../crypto/common/BlocksoftTg'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'

import changeableProd from '../../config/changeable.prod'
import changeableTester from '../../config/changeable.tester'

import DeviceInfo from 'react-native-device-info'

const CACHED = {}
const CACHED_BUY = {}

let CACHE_BALANCE = {}
const ASYNC_CACHE_TITLE = 'pushTokenV2'

class MarketingEvent {
    DATA = {
        LOG_TOKEN : '',
        LOG_WALLET : '',
        LOG_CASHBACK : ''
    }

    UI_DATA = {
        IS_LIGHT : '?',
        IS_LOCKED : false,
        IS_ACTIVE : true
    }

    /**
     * @return {Promise<void>}
     */
    async initMarketing(testerMode) {
        this.TG = new BlocksoftTg(changeableProd.tg.info.spamBot)

        if (testerMode === false) {
            testerMode = await AsyncStorage.getItem('testerMode')
        }

        let changeable
        if (testerMode === 'TESTER') {
            changeable = changeableTester
        } else {
            changeable = changeableProd
        }

        this.TG.API_KEY = changeable.tg.info.spamBot

        this.DATA = {}
        this.DATA.LOG_VERSION = changeable.tg.info.version
        this.DATA.LOG_DEV = !(this.DATA.LOG_VERSION.indexOf('VERSION_CODE_PLACEHOLDER COMMIT_SHORT_SHA_PLACEHOLDER') === -1) ? 'TRUE' : false
        this.DATA.LOG_TESTER = changeable.tg.info.isTester ? 'TRUE' : false
        this.DATA.LOG_PLATFORM = Platform.OS + ' v' + Platform.Version
        this.DATA.LOG_TOKEN = await AsyncStorage.getItem(ASYNC_CACHE_TITLE)

        this.DATA.LOG_MODEL = ''
        try {
            this.DATA.LOG_MODEL = DeviceInfo.getBrand()
        } catch (e) {

        }
        try {
            const tmp = DeviceInfo.getModel()
            if (tmp) {
                this.DATA.LOG_MODEL += ' ' + tmp
            }
        } catch (e) {

        }

        this.DATA.LOG_REFERER = ''
        try {
            const tmp = DeviceInfo.getInstallReferrerSync()
            if (typeof tmp !== 'undefined' && tmp === 'undefined' && tmp) {
                this.DATA.LOG_REFERER = tmp
            }
        } catch (e) {

        }

        this._reinitTgMessage(testerMode)

        // after this is a little bit long soooo we will pass variables any time we could
        this.DATA.LOG_WALLET = await BlocksoftKeysStorage.getSelectedWallet()
        this._reinitTgMessage(testerMode)

        await CashBackUtils.init({force : true, selectedWallet : this.DATA.LOG_WALLET})
        this.DATA.LOG_CASHBACK = CashBackUtils.getWalletToken()
        this._reinitTgMessage(testerMode)

        this.DATA.LOG_PARENT = CashBackUtils.getParentToken()
        this._reinitTgMessage(testerMode)

        let tmp = await AsyncStorage.getItem('CACHE_BALANCE')
        if (tmp) {
            try {
                tmp = JSON.parse(tmp)
                CACHE_BALANCE = tmp
            } catch (e) {
                // do nothing
            }
        }
    }

    /**
     * @private
     */
    _reinitTgMessage(testerMode) {

        this.TG_MESSAGE = ''

        for (const key in this.DATA) {
            const val = this.DATA[key]
            if (!val) {
                continue
            }

            if (key === 'LOG_DEV') {
                // do nothing
            } else if (key === 'LOG_TOKEN') {
                const short  = val.substr(0, 20)
                this.TG_MESSAGE += '\nTOKEN ' + short
                this.TG_MESSAGE += '\nFULL_TOKEN ' + val
                if (crashlytics()) {
                    crashlytics().setAttribute(key, short)
                    crashlytics().setAttribute(key + '_FULL', val)
                }
                analytics().setUserProperty(key, short)
                analytics().setUserProperty(key + '_FULL', val.toString().substr(0, 36))
            } else {
                if (key === 'LOG_VERSION') {
                    // do nothing
                } else {
                    this.TG_MESSAGE += '\n' + key + ' ' + val + ' '
                }
                if (crashlytics()) {
                   crashlytics().setAttribute(key, val)
                }
                analytics().setUserProperty(key, val)
            }
        }

        Log._reinitTgMessage(testerMode, this.DATA, this.TG_MESSAGE)
        BlocksoftCryptoLog._reinitTgMessage(testerMode, this.DATA, this.TG_MESSAGE)

    }

    async logEvent(logTitle, logData, PREFIX = 'SPM') {
        if (this.DATA.LOG_DEV) {
            return false
        }

        const tmp = logTitle + ' ' + JSON.stringify(logData)
        if (tmp === this._cacheLastLog) return true

        const date = (new Date()).toISOString().split('T')
        try {
            if (typeof this.DATA.LOG_TOKEN !== 'undefined' && this.DATA.LOG_TOKEN) {
                // already done
            } else {
                this.DATA.LOG_TOKEN = await AsyncStorage.getItem(ASYNC_CACHE_TITLE)
                if (typeof this.DATA.LOG_TOKEN !== 'undefined' && this.DATA.LOG_TOKEN) {
                    this._reinitTgMessage()
                }
            }

            this._cacheLastLog = tmp

            if (!logData) {
                logData = {}
            }
            logData.date = date

        } catch (e) {
            await Log.err(`DMN/MarketingEvent prepare error ${logTitle} ` + e.message.toString() + ' with logData ' + JSON.stringify(logData))
            return false
        }

        if (PREFIX !== 'RTM') {
            try {
                await analytics().logEvent(logTitle.replace(' ', '_'), logData)
            } catch (e) {
                await Log.err(`DMN/MarketingEvent send analytics error ${logTitle} ` + e.message.toString() + ' with logData ' + JSON.stringify(logData))
            }
        }

        try {
            await this.TG.send(PREFIX + `_sept_${this.DATA.LOG_VERSION} ` + date[0] + ' ' + date[1] + ' ' + tmp + this.TG_MESSAGE)
        } catch (e) {
            await Log.err(`DMN/MarketingEvent send TG error ${logTitle} ` + e.message.toString() + ' with logData ' + JSON.stringify(logData))
        }
    }

    async logOnlyRealTime(logTitle, logData) {
        return this.logEvent(logTitle, logData, 'RTM')
    }

    async setBalance(walletHash, currencyCode, totalBalance, logData) {
        if (totalBalance === '' || totalBalance === 'undefined' || !totalBalance) {
            return false
        }
        const cacheTitle = walletHash + '_' + currencyCode
        if (typeof (CACHE_BALANCE[cacheTitle]) === 'undefined') {
            CACHE_BALANCE[cacheTitle] = -1
        }
        if (CACHE_BALANCE[cacheTitle] === totalBalance) {
            return false
        }

        let eventTitle = 'slava_update_balance'
        if (currencyCode === 'TOTAL') {
            eventTitle = 'slava_update_balance_TOTAL'
        }

        let sendEvent = false
        if (CACHE_BALANCE[cacheTitle] === -1) {
            sendEvent = true
            CACHE_BALANCE[cacheTitle] = totalBalance
            await AsyncStorage.setItem('CACHE_BALANCE', JSON.stringify(CACHE_BALANCE))

        } else if (CACHE_BALANCE[cacheTitle] !== totalBalance) {
            sendEvent = true
            CACHE_BALANCE[cacheTitle] = totalBalance
            await AsyncStorage.setItem('CACHE_BALANCE', JSON.stringify(CACHE_BALANCE))
        } else {
            // do nothing
        }

        if (sendEvent) {
            this.logEvent(eventTitle, logData)
        }
    }

    startBuy(logData) {
        CACHED_BUY[logData.order_id] = logData
        if (!this.DATA.LOG_CASHBACK && typeof logData.cashbackToken !== 'undefined') {
            this.DATA.LOG_CASHBACK = logData.cashbackToken
        }
        this.logEvent('slava_exchange_buy_step_1', logData)
    }


    checkBuyResults(buys) {
        if (CACHED_BUY === {} || typeof buys === 'undefined' || buys.length === 0) return false

        try {
            let buy
            for (buy of buys) {
                if (!(buy.status === 'done' || buy.status === 'done_payin' || buy.status === 'done_convert' || buy.status === 'done_withdraw')) continue // only good one we need
                if (typeof CACHED_BUY[buy.orderId] === 'undefined') continue
                const updatedData = JSON.parse(JSON.stringify(CACHED_BUY[buy.orderId]))
                updatedData.created_ts = buy.createdAt + ''
                updatedData.created_date = (new Date(buy.createdAt)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                this.logEvent('slava_exchange_buy_step_last', updatedData)
                delete CACHED_BUY[buy.orderId]
            }
        } catch (e) {
            Log.err(`DMN/MarketingEvent checkBuyResults ` + e.toString() + ' with CACHED_BUY ' + JSON.stringify(CACHED_BUY) + ' and BUYS ' + JSON.stringify(buys))
        }
    }

    startExchange(logData) {
        logData.TYPE = 'dex'
        CACHED[logData.address_to] = logData
        this.logEvent('slava_exchange_dex_step_1', logData)
    }

    startSell(logData) {
        logData.TYPE = 'sell'
        CACHED[logData.address_to] = { ...logData }
        this.logEvent('slava_exchange_sell_step_1', logData)
    }

    checkSellConfirm(logData) {
        if (typeof CACHED[logData.address_to] === 'undefined') return false
        const type = CACHED[logData.address_to].TYPE
        const tmp = { ...logData }
        CACHED[logData.address_to + '_confirm'] = tmp
        tmp.order_id = CACHED[logData.address_to].order_id
        this.logEvent('slava_exchange_' + type + '_step_2', tmp)
    }

    checkSellSendTx(logData) {
        if (
            typeof CACHED[logData.address_to] === 'undefined'
            || typeof CACHED[logData.address_to + '_confirm'] === 'undefined'
        ) {
            logData.TYPE_OF_TX = 'usual_outcome'
            this.logEvent('slava_send_tx', logData)
            return false
        }
        const tmp = { ...CACHED[logData.address_to] }
        const type = CACHED[logData.address_to].TYPE
        logData.TYPE_OF_TX = type + '_outcome'
        this.logEvent('slava_exchange_' + type + '_step_last', tmp)
        this.logEvent('slava_send_tx', logData)
    }
}

const MarketingEventSingleton = new MarketingEvent()
export default MarketingEventSingleton
