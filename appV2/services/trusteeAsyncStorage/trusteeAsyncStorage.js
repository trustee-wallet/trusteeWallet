/**
 * @version 0.50
 */
import AsyncStorage from '@react-native-community/async-storage'

const ASYNC_STORE_KEY = 'trusteeInit'

class TrusteeAsyncStorage {
    constructor() {
        this._inited = false
    }

    init = async (key) => {
        try {
            const tmp = await AsyncStorage.getItem(ASYNC_STORE_KEY)
            if (tmp) {
                const tmp2 = JSON.parse(tmp)
                this._inited = tmp2
            } else {
                this._inited = {}
            }
        } catch (e) {
            this._inited = {}
        }
    }

    _get = async (key) => {
        if (!this._inited) {
            await this.init(key)
        }
        return this._inited[key]
    }

    _set = (key, value) => {
        if (!this._inited) {
            this._inited = {}
        }
        this._inited[key] = value
        AsyncStorage.setItem(ASYNC_STORE_KEY, JSON.stringify(this._inited))
        // console.log(`trustee _set ${JSON.stringify(this._inited)}`)
    }

    _getStatic = (key) => {
        return this._inited[key]
    }

    getThemeSetting = async () => {
        return this._get('themeSetting')
    }

    setThemeSetting = (value) => {
        return this._set('themeSetting', value)
    }

    getDevMode = () => {
        return this._getStatic('devMode') && this._getStatic('devMode').toString() === '1'
    }

    setDevMode = (value) => {
        return this._set('devMode', value)
    }

    getTesterMode = () => {
        return this._getStatic('testerMode')
    }

    setTesterMode = (value) => {
        return this._set('testerMode', value)
    }

    getCashbackParent = async () => {
        return this._get('parentTokenRechecked')
    }

    setCashbackParent = (value) => {
        return this._set('parentTokenRechecked', value)
    }

    getFirebaseUrl = async () => {
        return this._get('firebaseUrl')
    }

    setFirebaseUrl = (value) => {
        return this._set('firebaseUrl', value)
    }

    getCacheBalance = async () => {
        return this._get('CACHE_BALANCE')
    }

    setCacheBalance = (value) => {
        return this._set('CACHE_BALANCE', value)
    }

    getExternalAsked = () => {
        return this._getStatic('externalAsked')
    }

    setExternalAsked = (value) => {
        return this._set('externalAsked', value)
    }

    getSendInputType = () => {
        return this._getStatic('sendInputType')
    }

    setSendInputType = (value) => {
        return this._set('sendInputType', value)
    }

    getSmartSwapMsg = () => {
        return this._getStatic('smartSwapMsg')
    }

    setSmartSwapMsg = async (value) => {
        return this._set('smartSwapMsg', value)
    }

    getIsViolet = async() => {
        return this._get('isViolet')
    }

    setIsViolet = (value) => {
        return this._set('isViolet', value)
    }

    getFcmTokenTime = () => {
        return this._getStatic('pushTokenTime')
    }

    setFcmTokenTime = (value) => {
        return this._set('pushTokenTime', value)
    }

    getFcmToken = async () => {
        return this._get('pushToken')
    }

    getFcmTokensAll = () => {
        return this._getStatic('pushTokensAll')
    }

    setFcmTokensAll = async (value, one) => {
        if (!this._inited) {
            this._inited = {}
        }
        this._inited['pushTokensAll'] = value
        this._inited['pushToken'] = one
        return AsyncStorage.setItem(ASYNC_STORE_KEY, JSON.stringify(this._inited))
    }
}

const trusteeAsyncStorage = new TrusteeAsyncStorage()
export default trusteeAsyncStorage
