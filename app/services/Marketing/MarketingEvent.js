import firebase from "react-native-firebase"
import AsyncStorage from "@react-native-community/async-storage"
import {Platform} from "react-native"

const CACHED = {}
const CACHED_BUY = {}
const CACHED_BUY_FOUND = {}
const CACHED_BUY_TIME = 1200000

class MarketingEvent {

    async initMarketing() {
        this.isTester = true
        if (this.isTester) {
            firebase.analytics().setAnalyticsCollectionEnabled(false)
            return false
        }

        this.LOG_TOKEN = await AsyncStorage.getItem('fcmToken')
        this.LOG_PLATFORM = Platform.OS + ' v' + Platform.Version
        firebase.analytics().setUserProperty('LOG_TOKEN', this.LOG_TOKEN)
        firebase.analytics().setUserProperty('LOG_PLATFORM', this.LOG_PLATFORM)
    }

    logEvent(logTitle, logData) {
        if (this.isTester) return false

        if (this.LOG_TOKEN) {
            logData.LOG_TOKEN = this.LOG_TOKEN
        }
        if (this.LOG_PLATFORM) {
            logData.LOG_PLATFORM = this.LOG_PLATFORM
        }
        firebase.analytics().logEvent(logTitle, logData)
    }

    startBuy(logData) {
        if (this.isTester) return false

        let tmp = {...logData}
        CACHED_BUY[tmp.currency.toLowerCase() + '_' + tmp.address] = tmp
        firebase.analytics().logEvent('slava_exchange_buy_step_1', CACHED[logData.to])
        console.log(CACHED_BUY)
    }


    checkBuyResults(buys) {
        if (this.isTester) return false

        if (CACHED_BUY === {} || typeof buys === 'undefined' || buys.length === 0) return false

        let now = (new Date()).getTime()
        for(let buy of buys) {
            if (!(buy.status === 'done' || buy.status=== 'done_payin' || buy.status === 'done_convert' || buy.status === 'done_withdraw')) continue // only good one we need
            if (now - buy.createdAt > CACHED_BUY_TIME) continue // old one is skipped

            let title = buy.currency.toLowerCase() + '_' + buy.withdrawDestination // thats main of order finder

            if (typeof CACHED_BUY[title] === 'undefined') continue // not for expecting address
            if (typeof CACHED_BUY_FOUND[title + '_' + buy.createdAt] !== 'undefined') continue // this is already used for expecting address

            //if (CACHED_BUY[title].requestedFiat === buy.requestedFiat || CACHED_BUY[title].requestedCrypto === buy.requestedCrypto)  {
            // not sure cose some orders could have been changed in process
                CACHED_BUY_FOUND[title + '_' + buy.createdAt] = 1
                CACHED_BUY[title].actuallyRequestedFiat = buy.requestedFiat
                CACHED_BUY[title].actuallyRequestedCrypto = buy.requestedCrypto
                firebase.analytics().logEvent('slava_exchange_buy_step_last', CACHED_BUY[title])
                delete CACHED_BUY[title]
            //}

        }
    }


    startSell(logData) {
        if (this.isTester) return false

        CACHED[logData.to] = {...logData}
        firebase.analytics().logEvent('slava_exchange_sell_step_1', CACHED[logData.to])
    }

    checkSellConfirm(logData) {
        if (this.isTester) return false

        if (typeof CACHED[logData.address] === 'undefined') return false
        let cache = CACHED[logData.address]
        if (logData.amount * 1 === cache.amount_crypto * 1 && logData.cryptocurrency.currencyCode === cache.currency) {
            firebase.analytics().logEvent('slava_exchange_sell_step_2', cache)
        }
    }

    checkSellSendTx(logData) {
        if (this.isTester) return false

        if (typeof CACHED[logData.address_to] === 'undefined') return false
        let cache = CACHED[logData.address_to]
        if (logData.address_amount * 1 === cache.address_amount * 1 && logData.currency_code === cache.currency) {
            firebase.analytics().logEvent('slava_exchange_sell_step_last', cache)
        }
    }
}

export default new MarketingEvent()

