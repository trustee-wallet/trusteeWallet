/**
 * @version 0.50
 */
import AsyncStorage from '@react-native-community/async-storage'

const ASYNC_STORE_KEY = 'trusteeInit'

class TrusteeAsyncStorage {
    constructor() {
        this._inited = false
    }

    init = async () => {
        try {
            console.log('read async ')
            const tmp = await AsyncStorage.getItem(ASYNC_STORE_KEY)
            if (tmp) {
                const tmp2 = JSON.parse(tmp)
                console.log(`
                
                trustee _init ${JSON.stringify(tmp2)}
                `)
                this._inited = tmp2
            } else {
                this._inited = {}
            }
        } catch (e) {
            console.log('read async error ' + e.message)
            this._inited = {}
        }
    }

    _get = async (key) => {
        if (!this._inited) {
            await this.init()
        }
        return this._inited[key]
    }

    _set = (key, value) => {
        if (!this._inited) {
            this._inited = {}
        }
        this._inited[key] = value
        AsyncStorage.setItem(ASYNC_STORE_KEY, JSON.stringify(this._inited))
        console.log(`
            trustee _set ${JSON.stringify(this._inited)}
        `)
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

    getFirebaseUrl = async () => {
        return this._get('firebaseUrl')
    }

    setFirebaseUrl = (value) => {
        return this._set('firebaseUrl', value)
    }

}

const trusteeAsyncStorage = new TrusteeAsyncStorage()
export default trusteeAsyncStorage
