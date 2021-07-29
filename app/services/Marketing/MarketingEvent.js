/**
 * @version 0.9
 */
import crashlytics from '@react-native-firebase/crashlytics'
import analytics from '@react-native-firebase/analytics'

import { Platform } from 'react-native'

import Log from '@app/services/Log/Log'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftTg from '@crypto/common/BlocksoftTg'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import changeableProd from '@app/config/changeable.prod'
import changeableTester from '@app/config/changeable.tester'

import DeviceInfo from 'react-native-device-info'
import appsFlyer from 'react-native-appsflyer'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

let CACHE_TG_INITED = false
let CACHE_BALANCE = {}
let CACHE_APP_FLYER_ERROR = 0
const CACHE_APP_FLYER_ERROR_TIME = 120000



class MarketingEvent {
    DATA = {
        LOG_TOKEN: '',
        LOG_WALLET: '',
        LOG_CASHBACK: '',
        LOG_PARENT: '',
        LOG_PLATFORM : '',
        LOG_VERSION : '',
        LOG_WALLETS_COUNT : '0',
        LOG_DEV : false,
        LOG_TESTER: false
    }

    UI_DATA = {
        IS_LIGHT: '?',
        IS_LOCKED: false,
        IS_ACTIVE: true,
        IS_TESTER : false,
    }

    /**
     * @return {Promise<void>}
     */
    async initMarketing(testerMode) {
        this.TG = new BlocksoftTg(changeableProd.tg.info.spamBot)

        if (testerMode === false) {
            testerMode = await trusteeAsyncStorage.getTesterMode()
        }
        this.UI_DATA.IS_TESTER = testerMode

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
        this.DATA.LOG_TESTER = testerMode === 'TESTER' ? 'TRUE' : false

        this.DATA.LOG_PLATFORM = Platform.OS + ' v' + Platform.Version
        this.DATA.LOG_TOKEN = await trusteeAsyncStorage.getFcmToken()

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

        // after this is a little bit long soooo we will pass variables any time we could
        this.DATA.LOG_WALLET = await settingsActions.getSelectedWallet('MarketingEvent')
        const tmp = await trusteeAsyncStorage.getCacheBalance()
        if (tmp) {
            CACHE_BALANCE = tmp
        }
    }

    async reinitIfNever() {
        if (CACHE_TG_INITED) return true
        await this._reinitTgMessage(this.UI_DATA.IS_TESTER)
    }

    async reinitByWallet(walletHash) {
        if (this.DATA.LOG_WALLET === walletHash) {
            return false
        }
        this.DATA.LOG_WALLET = walletHash

        await CashBackUtils.init({ force: true, selectedWallet: this.DATA.LOG_WALLET }, 'MarketingEvent')

        this.DATA.LOG_CASHBACK = CashBackUtils.getWalletToken()
        this.DATA.LOG_PARENT = CashBackUtils.getParentToken()

        await this._reinitTgMessage(this.UI_DATA.IS_TESTER)
    }


    async reinitCrashlytics() {
        for (const key in this.DATA) {
            const val = this.DATA[key]
            if (!val) {
                continue
            }

            if (key === 'LOG_DEV') {
                // do nothing
            } else if (key === 'LOG_TOKEN') {
                const short = val.substr(0, 20)
                if (crashlytics()) {
                    crashlytics().setAttribute(key, short)
                    crashlytics().setAttribute(key + '_FULL', val)
                }
                analytics().setUserProperty(key, short)
                analytics().setUserProperty(key + '_FULL', val.toString().substr(0, 36))
            } else {
                if (crashlytics()) {
                    crashlytics().setAttribute(key, val)
                }
                analytics().setUserProperty(key, val)
            }
        }
    }


        /**
     * @private
     */
    async _reinitTgMessage(testerMode) {

        this.TG_MESSAGE = ''

        for (const key in this.DATA) {
            const val = this.DATA[key]
            if (!val) {
                continue
            }

            if (key === 'LOG_DEV') {
                // do nothing
            } else if (key === 'LOG_TOKEN') {
                const short = val.substr(0, 20)
                this.TG_MESSAGE += '\nTOKEN ' + short
                this.TG_MESSAGE += '\nFULL_TOKEN ' + val
                if (crashlytics()) {
                    crashlytics().setAttribute(key, short)
                    crashlytics().setAttribute(key + '_FULL', val)
                }
                analytics().setUserProperty(key, short)
                analytics().setUserProperty(key + '_FULL', val.toString().substr(0, 36))
            } else {
                if (key === 'LOG_CASHBACK') {
                    try {
                        await appsFlyer.setCustomerUserId(val.toString(), () => {})
                    } catch (e) {
                        await Log.log(`DMN/MarketingEventappsFlyer.setCustomerUserId error ` + e.message.toString())
                    }
                }
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

        await Log._reinitTgMessage(testerMode, this.DATA, this.TG_MESSAGE)
        await BlocksoftCryptoLog._reinitTgMessage(testerMode, this.DATA, this.TG_MESSAGE)
        CACHE_TG_INITED = true

    }

    async logEvent(logTitle, logData, PREFIX = 'SPM') {
        if (this.DATA.LOG_DEV) {
            return false
        }
        let logDataString = ''
        let logDataObject = {}
        if (typeof logData === 'string') {
            logDataString = logData
            logDataObject = {
                'txt' : logData
            }
        } else {
            logDataString = JSON.stringify(logData)
            logDataObject = logData
            if (!logDataObject) {
                logDataObject = {}
            }
        }

        const tmp = logTitle + ' ' + logDataString
        if (tmp === this._cacheLastLog) return true

        const date = (new Date()).toISOString().split('T')
        try {
            if (typeof this.DATA.LOG_TOKEN !== 'undefined' && this.DATA.LOG_TOKEN) {
                // already done
            } else {
                this.DATA.LOG_TOKEN = await trusteeAsyncStorage.getFcmToken()
                if (typeof this.DATA.LOG_TOKEN !== 'undefined' && this.DATA.LOG_TOKEN) {
                    await this._reinitTgMessage()
                }
            }
            this._cacheLastLog = tmp
            logDataObject.date = date
        } catch (e) {
            await Log.err(`DMN/MarketingEvent prepare error ${logTitle} ` + e.message.toString() + ' with logData ' + logDataString)
            return false
        }

        if (PREFIX !== 'RTM') {
            const now = new Date().getTime()
            if (now - CACHE_APP_FLYER_ERROR > CACHE_APP_FLYER_ERROR_TIME) {
                try {
                    await appsFlyer.logEvent(logTitle.replace(' ', '_'), logDataObject)
                } catch (e) {
                    CACHE_APP_FLYER_ERROR = now
                    await Log.log(`DMN/MarketingEvent send appsFlyer error ${logTitle} ` + e.message.toString() + ' with logData ' + logDataString)
                }
            }

            try {
                await analytics().logEvent(logTitle.replace(' ', '_'), logDataObject)
            } catch (e) {
                await Log.err(`DMN/MarketingEvent send analytics error ${logTitle} ` + e.message.toString() + ' with logData ' + logDataString)
            }
        }

        try {
            await this.TG.send(PREFIX + `_2021_04_${this.DATA.LOG_VERSION} ` + date[0] + ' ' + date[1] + ' ' + tmp + this.TG_MESSAGE)
        } catch (e) {
            await Log.err(`DMN/MarketingEvent send TG error ${logTitle} ` + e.message.toString() + ' with logData ' + logDataString)
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
            trusteeAsyncStorage.setCacheBalance(CACHE_BALANCE)

        } else if (CACHE_BALANCE[cacheTitle] !== totalBalance) {
            sendEvent = true
            CACHE_BALANCE[cacheTitle] = totalBalance
            trusteeAsyncStorage.setCacheBalance(CACHE_BALANCE)
        } else {
            // do nothing
        }

        if (sendEvent) {
            this.logEvent(eventTitle, logData)
        }
    }

}

const MarketingEventSingleton = new MarketingEvent()
export default MarketingEventSingleton
