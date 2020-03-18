import firebase from 'react-native-firebase'


import AsyncStorage from '@react-native-community/async-storage'
import { Platform } from 'react-native'

import Cashback from '../Cashback/Cashback'
import Log from '../Log/Log'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import BlocksoftTg from '../../../crypto/common/BlocksoftTg'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'


import changeableProd from '../../config/changeable.prod'
import changeableTester from '../../config/changeable.tester'

const CACHED = {}
const CACHED_BUY = {}
const CACHE_BALANCE = {}

class MarketingEvent {
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
        this.DATA.LOG_TOKEN = await AsyncStorage.getItem('fcmToken')

        this._reinitTgMessage(testerMode)

        // after this is a little bit long soooo we will pass variables any time we could
        this.DATA.LOG_WALLET = await BlocksoftKeysStorage.getSelectedWallet()
        this._reinitTgMessage(testerMode)

        this.DATA.LOG_CASHBACK = Cashback.getCashbackToken()
        this._reinitTgMessage(testerMode)


        const date = (new Date()).toISOString().split('T')
        this.DATA.date = date[0]
        this.DATA.time = date[1].replace(/\..+/, '')

        let token = this.DATA.LOG_TOKEN
        if (typeof (this.DATA.LOG_TOKEN) === 'undefined') {
            token = 'NOTOKEN'
        }
        firebase.database().ref('Inits/' + date[0] + '/' + token).push(this.DATA)
        if (token) {
            firebase.database().ref('Installs/' + token.substr(0, 20) + '/' + this.DATA.LOG_VERSION).update(this.DATA)
        }

    }

    /**
     * @private
     */
    _reinitTgMessage(testerMode) {
        Log._reinitTgMessage(testerMode, this.DATA)
        BlocksoftCryptoLog._reinitTgMessage(testerMode, this.DATA)
        this.TG_MESSAGE = '\nVERSION ' + this.DATA.LOG_VERSION
        if (firebase.crashlytics()) {
            firebase.crashlytics().setStringValue('LOG_VERSION', this.DATA.LOG_VERSION)
        }
        firebase.analytics().setUserProperty('LOG_VERSION', this.DATA.LOG_VERSION)


        this.TG_MESSAGE += '\nTESTER ' + this.DATA.LOG_TESTER

        if (this.DATA.LOG_TESTER) {
            if (firebase.crashlytics()) {
                firebase.crashlytics().setStringValue('LOG_TESTER', this.DATA.LOG_TESTER)
            }
            firebase.analytics().setUserProperty('LOG_TESTER', this.DATA.LOG_TESTER)
        }

        if (typeof (this.DATA.LOG_WALLET) !== 'undefined' && this.DATA.LOG_WALLET) {
            if (firebase.crashlytics()) {
                firebase.crashlytics().setStringValue('LOG_WALLET', this.DATA.LOG_WALLET)
            }
            firebase.analytics().setUserProperty('LOG_WALLET', this.DATA.LOG_WALLET)
            this.TG_MESSAGE += '\nWALLET ' + this.DATA.LOG_WALLET
        }
        if (typeof (this.DATA.LOG_CASHBACK) !== 'undefined' && this.DATA.LOG_CASHBACK) {
            if (firebase.crashlytics()) {
                firebase.crashlytics().setStringValue('LOG_CASHBACK', this.DATA.LOG_CASHBACK)
            }
            firebase.analytics().setUserProperty('LOG_CASHBACK', this.DATA.LOG_CASHBACK)
            this.TG_MESSAGE += '\nCASHBACK ' + this.DATA.LOG_CASHBACK.substr(0, 20)
        }
        if (typeof (this.DATA.LOG_TOKEN) !== 'undefined' && this.DATA.LOG_TOKEN) {
            if (firebase.crashlytics()) {
                firebase.crashlytics().setStringValue('LOG_TOKEN', this.DATA.LOG_TOKEN)
            }
            firebase.analytics().setUserProperty('LOG_TOKEN', this.DATA.LOG_TOKEN)
            this.TG_MESSAGE += '\nTOKEN ' + this.DATA.LOG_TOKEN.substr(0, 20)
        }
        if (typeof (this.DATA.LOG_PLATFORM) !== 'undefined' && this.DATA.LOG_PLATFORM) {
            if (firebase.crashlytics()) {
                firebase.crashlytics().setStringValue('LOG_PLATFORM', this.DATA.LOG_PLATFORM)
            }
            firebase.analytics().setUserProperty('LOG_PLATFORM', this.DATA.LOG_PLATFORM)
            this.TG_MESSAGE += '\nPLATFORM ' + this.DATA.LOG_PLATFORM
        }


    }

    async logEvent(logTitle, logData, ONLY_TG = false) {
        if (this.DATA.LOG_DEV) {
            return false
        }
        const tmp = logTitle + ' ' + JSON.stringify(logData)
        if (tmp === this._cacheLastLog) return true
        try {
            if (this.DATA.LOG_TOKEN) {
                logData.LOG_TOKEN = this.DATA.LOG_TOKEN
            } else {
                this.DATA.LOG_TOKEN = await AsyncStorage.getItem('fcmToken')
                if (this.DATA.LOG_TOKEN) {
                    logData.LOG_TOKEN = this.DATA.LOG_TOKEN
                    this._reinitTgMessage()
                }
            }
            if (this.DATA.LOG_WALLET) {
                logData.LOG_WALLET = this.DATA.LOG_WALLET
            }
            if (this.DATA.LOG_CASHBACK) {
                logData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
            } else {
                this.DATA.LOG_CASHBACK = Cashback.getCashbackToken()
                if (this.DATA.LOG_CASHBACK) {
                    logData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
                    this._reinitTgMessage()
                }
            }
            if (this.DATA.LOG_PLATFORM) {
                logData.LOG_PLATFORM = this.DATA.LOG_PLATFORM
            }
            if (this.DATA.LOG_TESTER) {
                logData.LOG_TESTER = this.DATA.LOG_TESTER
            }

            this._cacheLastLog = tmp

            const date = (new Date()).toISOString().split('T')
            logData.time = date[1].replace(/\..+/, '')

            // noinspection ES6MissingAwait
            this.TG.send(`SPM_${this.DATA.LOG_VERSION} Lg ` + tmp + this.TG_MESSAGE)

            if (!ONLY_TG) {
                let keyTitle = 'Events/' + date[0] + '/' + logTitle
                if (this.DATA.LOG_CASHBACK) {
                    keyTitle += '/' + this.DATA.LOG_CASHBACK
                } else {
                    keyTitle += '/NO_CASHBACK'
                }
                firebase.database().ref(keyTitle).push(logData)
                firebase.analytics().logEvent('v3_' + logTitle, logData)
            }

        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err(`DMN/MarketingEvent ${logTitle} ` + e.toString() + ' with logData ' + JSON.stringify(logData))
        }
    }

    async logOnlyRealTime(logTitle, logData) {
        if (this.DATA.LOG_DEV) {
            // return false
        }
        const tmp = logTitle + ' ' + JSON.stringify(logData)
        if (tmp === this._cacheLastLog) return true
        try {
            if (this.DATA.LOG_TOKEN) {
                logData.LOG_TOKEN = this.DATA.LOG_TOKEN
            } else {
                this.DATA.LOG_TOKEN = await AsyncStorage.getItem('fcmToken')
                if (this.DATA.LOG_TOKEN) {
                    logData.LOG_TOKEN = this.DATA.LOG_TOKEN
                    this._reinitTgMessage()
                }
            }
            if (this.DATA.LOG_WALLET) {
                logData.LOG_WALLET = this.DATA.LOG_WALLET
            }
            if (this.DATA.LOG_CASHBACK) {
                logData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
            } else {
                this.DATA.LOG_CASHBACK = Cashback.getCashbackToken()
                if (this.DATA.LOG_CASHBACK) {
                    logData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
                    this._reinitTgMessage()
                }
            }
            if (this.DATA.LOG_PLATFORM) {
                logData.LOG_PLATFORM = this.DATA.LOG_PLATFORM
            }
            if (this.DATA.LOG_TESTER) {
                logData.LOG_TESTER = this.DATA.LOG_TESTER
            }

            this._cacheLastLog = tmp

            const date = (new Date()).toISOString().split('T')
            logData.time = date[1].replace(/\..+/, '')

            // noinspection ES6MissingAwait
            this.TG.send(`RTM_${this.DATA.LOG_VERSION} ` + tmp + this.TG_MESSAGE)
            if (this.DATA.LOG_TESTER) {
                const keyTitle = 'DebugTX/' + date[0] + '/' + logTitle
                firebase.database().ref(keyTitle).push(logData)
            }
        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err(`DMN/MarketingEvent ${logTitle} ` + e.toString() + ' with logData ' + JSON.stringify(logData))
        }
    }

    /**

    "rules": {
                "DATA" : {
                    "$subtoken": {
                        "$wallet": {
                            "$currency": {
                                ".read": "data.child('subtoken').val() === $token",
                                ".write": true
                            }
                        }
                    }
                },
                ".read": false,
                ".write": true
            }
        }
     */
    async setBalance(walletHash, currencyCode, totalBalance, logData) {
        const cacheTitle = walletHash + '_' + currencyCode
        if (typeof(CACHE_BALANCE[cacheTitle]) === 'undefined') {
            CACHE_BALANCE[cacheTitle] = -1
        }
        if (CACHE_BALANCE[cacheTitle] === totalBalance) {
            return false
        }


        const now = new Date()
        const date = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let token = this.DATA.LOG_TOKEN
        if (typeof (this.DATA.LOG_TOKEN) === 'undefined') {
            token = 'NOTOKEN'
        }
        const saveKeyData = { totalBalance, date, token, subtoken : token ? token.substr(0, 20) : ''}

        let eventTitle = 'slava_update_balance'
        let keyTitle = 'DATA/' + saveKeyData.subtoken + '/' + walletHash + '/balance/' + currencyCode
        if (currencyCode === 'TOTAL') {
            eventTitle = 'slava_update_balance_TOTAL'
            keyTitle = 'DATA/' + saveKeyData.subtoken + '/' + walletHash + '/TOTAL/'
            if (this.DATA.LOG_CASHBACK) {
                saveKeyData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
            } else {
                this.DATA.LOG_CASHBACK = Cashback.getCashbackToken()
                if (this.DATA.LOG_CASHBACK) {
                    saveKeyData.LOG_CASHBACK = this.DATA.LOG_CASHBACK
                }
            }
        }

        let sendEvent = false
        if (CACHE_BALANCE[cacheTitle] === -1) {
            CACHE_BALANCE[cacheTitle] = totalBalance
            try {
                let savedTotalBalance = await new Promise((resolve, reject) => {
                    firebase.database().ref(keyTitle).once('value').then((snapshot) => {
                        resolve(snapshot.val())
                    }).catch((err) => {
                        reject(err)
                    });
                })
                if (savedTotalBalance) {
                    savedTotalBalance = savedTotalBalance.totalBalance
                }
                if (savedTotalBalance !== totalBalance) {
                    firebase.database().ref(keyTitle).update(saveKeyData)
                    sendEvent = true
                }
            } catch(e) {
                firebase.database().ref(keyTitle).update(saveKeyData)
            }
        } else if (CACHE_BALANCE[cacheTitle] !== totalBalance) {
            sendEvent = true
            CACHE_BALANCE[cacheTitle] = totalBalance
            firebase.database().ref(keyTitle).update(saveKeyData)
        } else {
            // do nothing
        }

        if (sendEvent) {
            this.logEvent(eventTitle, logData)
        }
    }

    startBuy(logData) {
        CACHED_BUY[logData.order_id] = logData
        if (!this.DATA.LOG_CASHBACK) {
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
        const tmp = {...logData}
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
        const tmp = { ...CACHED[logData.address_to]}
        const type  = CACHED[logData.address_to].TYPE
        logData.TYPE_OF_TX = type + '_outcome'
        this.logEvent('slava_exchange_' + type + '_step_last', tmp)
        this.logEvent('slava_send_tx', logData)
    }
}

const MarketingEventSingleton = new MarketingEvent()
export default MarketingEventSingleton
